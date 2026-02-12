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

        Ok(DashboardSummary {
            created_missions_count: created,
            joined_missions_count: joined,
            active_missions_count: active,
            completed_missions_count: completed,
        })
    }
}
