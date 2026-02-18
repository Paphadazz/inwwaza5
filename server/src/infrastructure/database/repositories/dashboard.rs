use std::sync::Arc;
use anyhow::{Ok, Result};
use async_trait::async_trait;
use diesel::RunQueryDsl;

use crate::{
    domain::{
        repositories::dashboard::DashboardRepository,
        value_objects::dashboard_model::DashboardSummary,
    },
    infrastructure::database::postgresql_connection::PgPoolSquad,
};

pub struct DashboardPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl DashboardPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl DashboardRepository for DashboardPostgres {
    async fn get_summary(&self, brawler_id: i32) -> Result<DashboardSummary> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Count missions created by user
        let created_count_sql = r#"
            SELECT COUNT(*) as count
            FROM missions
            WHERE chief_id = $1 AND deleted_at IS NULL
        "#;

        // Count missions joined by user (not chief)
        let joined_count_sql = r#"
            SELECT COUNT(*) as count
            FROM crew_memberships cm
            INNER JOIN missions m ON m.id = cm.mission_id
            WHERE cm.brawler_id = $1 AND m.chief_id != $1 AND m.deleted_at IS NULL
        "#;

        // Count active missions (Open or InProgress)
        let active_count_sql = r#"
            SELECT COUNT(*) as count
            FROM missions m
            WHERE (m.chief_id = $1 OR EXISTS (SELECT 1 FROM crew_memberships WHERE mission_id = m.id AND brawler_id = $1))
              AND m.status IN ('Open', 'InProgress')
              AND m.deleted_at IS NULL
        "#;

        // Count completed missions
        let completed_count_sql = r#"
            SELECT COUNT(*) as count
            FROM missions m
            WHERE (m.chief_id = $1 OR EXISTS (SELECT 1 FROM crew_memberships WHERE mission_id = m.id AND brawler_id = $1))
              AND m.status = 'Completed'
              AND m.deleted_at IS NULL
        "#;

        use diesel::sql_types::BigInt;

        #[derive(diesel::QueryableByName)]
        struct CountResult {
            #[diesel(sql_type = BigInt)]
            count: i64,
        }

        let created = diesel::sql_query(created_count_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .get_result::<CountResult>(&mut conn)?
            .count;

        let joined = diesel::sql_query(joined_count_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .get_result::<CountResult>(&mut conn)?
            .count;

        let active = diesel::sql_query(active_count_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .get_result::<CountResult>(&mut conn)?
            .count;

        let completed = diesel::sql_query(completed_count_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .get_result::<CountResult>(&mut conn)?
            .count;

        // --- Chart Data Calculation (Monthly for Current Year) ---
        use chrono::{Datelike, NaiveDate, Utc};
        use std::collections::HashMap;

        let current_year = Utc::now().year();
        let start_date = NaiveDate::from_ymd_opt(current_year, 1, 1).unwrap()
            .and_hms_opt(0, 0, 0).unwrap();

        // Fetch timestamps for "Created" 
        let created_ts_sql = r#"
            SELECT DATE_TRUNC('month', created_at)::date as date, COUNT(*) as count
            FROM missions
            WHERE chief_id = $1 AND deleted_at IS NULL AND created_at >= $2
            GROUP BY 1
        "#;

        // Fetch timestamps for "Joined"
        let joined_ts_sql = r#"
            SELECT DATE_TRUNC('month', joined_at)::date as date, COUNT(*) as count
            FROM crew_memberships cm
            INNER JOIN missions m ON m.id = cm.mission_id
            WHERE cm.brawler_id = $1 AND m.chief_id != $1 AND m.deleted_at IS NULL AND cm.joined_at >= $2
            GROUP BY 1
        "#;

        // Fetch timestamps for "Completed"
        let completed_ts_sql = r#"
            SELECT DATE_TRUNC('month', updated_at)::date as date, COUNT(*) as count
            FROM missions m
            WHERE (m.chief_id = $1 OR EXISTS (SELECT 1 FROM crew_memberships WHERE mission_id = m.id AND brawler_id = $1))
              AND m.status = 'Completed' AND m.deleted_at IS NULL AND m.updated_at >= $2
            GROUP BY 1
        "#;

        #[derive(diesel::QueryableByName)]
        struct DateCount {
            #[diesel(sql_type = diesel::sql_types::Date)]
            date: NaiveDate,
            #[diesel(sql_type = BigInt)]
            count: i64,
        }

        let created_ts = diesel::sql_query(created_ts_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .bind::<diesel::sql_types::Timestamp, _>(start_date)
            .get_results::<DateCount>(&mut conn)?;

        let joined_ts = diesel::sql_query(joined_ts_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .bind::<diesel::sql_types::Timestamp, _>(start_date)
            .get_results::<DateCount>(&mut conn)?;

        let completed_ts = diesel::sql_query(completed_ts_sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .bind::<diesel::sql_types::Timestamp, _>(start_date)
            .get_results::<DateCount>(&mut conn)?;

        let mut chart_map: HashMap<NaiveDate, crate::domain::value_objects::dashboard_model::ActivityPoint> = HashMap::new();

        // Initialize 12 months
        for m in 1..=12 {
            let d = NaiveDate::from_ymd_opt(current_year, m, 1).unwrap();
            chart_map.insert(d, crate::domain::value_objects::dashboard_model::ActivityPoint {
                date: d.format("%Y-%m-%d").to_string(),
                created: 0,
                joined: 0,
                completed: 0,
                active: 0,
            });
        }

        for item in created_ts {
            if let Some(p) = chart_map.get_mut(&item.date) {
                p.created = item.count;
            }
        }
        for item in joined_ts {
            if let Some(p) = chart_map.get_mut(&item.date) {
                p.joined = item.count;
            }
        }
        for item in completed_ts {
            if let Some(p) = chart_map.get_mut(&item.date) {
                p.completed = item.count;
            }
        }

        // Convert map to sorted vector
        let mut chart_data: Vec<_> = chart_map.into_values().collect();
        chart_data.sort_by(|a, b| a.date.cmp(&b.date));

        // Calculate "Active" trend (simplified monthly snapshot)
        let mut current_active = active;
        for i in (0..12).rev() {
            chart_data[i].active = current_active;
            current_active = current_active - chart_data[i].created - chart_data[i].joined + chart_data[i].completed;
            if current_active < 0 { current_active = 0; }
        }

        Ok(DashboardSummary {
            created_missions_count: created,
            joined_missions_count: joined,
            active_missions_count: active,
            completed_missions_count: completed,
            chart_data,
        })
    }
}
