use std::sync::Arc;

use anyhow::{Ok, Result};
use async_trait::async_trait;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};

use crate::{
    domain::{
        repositories::mission_viewing::MissionViewingRepository,
        value_objects::{brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel},
    },
    infrastructure::database::{
        postgresql_connection::PgPoolSquad,
        schema::crew_memberships,
    },
};
pub struct MissionViewingPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl MissionViewingPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl MissionViewingRepository for MissionViewingPostgres {
    async fn member_counting(&self, mission_id: i32) -> Result<u32> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let value = crew_memberships::table
            .filter(crew_memberships::mission_id.eq(mission_id))
            .count()
            .first::<i64>(&mut conn)?;

        let count = u32::try_from(value)?;
        Ok(count)
    }

    async fn view_detail(&self, mission_id: i32, user_id: Option<i32>) -> Result<MissionModel> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT m.id, m.name, m.description, m.status, m.chief_id, 
                   b.display_name AS chief_display_name,
                   (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS member_count,
                   m.max_members,
                   m.created_at, m.updated_at,
                   EXISTS (SELECT 1 FROM crew_memberships cm2 WHERE cm2.mission_id = m.id AND cm2.brawler_id = $2) AS is_joined
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.id = $1 AND m.deleted_at IS NULL
            LIMIT 1
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Int4>, _>(user_id)
            .get_result::<MissionModel>(&mut conn)?;

        Ok(result)
    }

    async fn gets(&self, filter: &MissionFilter, user_id: Option<i32>) -> Result<Vec<MissionModel>> {
        use diesel::sql_types::{Nullable, Varchar, Int4};

        let mut conn = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT m.id, m.name, m.description, m.status, m.chief_id, 
                   b.display_name AS chief_display_name,
                   (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS member_count,
                   m.max_members,
                   m.created_at, m.updated_at,
                   EXISTS (SELECT 1 FROM crew_memberships cm2 WHERE cm2.mission_id = m.id AND cm2.brawler_id = $3) AS is_joined
            FROM missions m
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE m.deleted_at IS NULL
              AND ($1 IS NULL OR m.status = $1)
              AND ($2 IS NULL OR m.name ILIKE $2)
            ORDER BY m.created_at DESC
        "#;

        // Prepare optional bind values
        let status_bind: Option<String> = filter.status.as_ref().map(|s| s.to_string());
        let name_bind: Option<String> = filter.name.as_ref().map(|n| format!("%{}%", n));

        let rows = diesel::sql_query(sql)
            .bind::<Nullable<Varchar>, _>(status_bind)
            .bind::<Nullable<Varchar>, _>(name_bind)
            .bind::<Nullable<Int4>, _>(user_id)
            .load::<MissionModel>(&mut conn)?;

        Ok(rows)
    }

    async fn get_mission_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        let sql = r#"
            SELECT b.id,
                    b.display_name,
                    COALESCE(b.avatar_url, '') AS avatar_url,
                    COALESCE(s.success_count, 0::BIGINT) AS mission_success_count,
                    COALESCE(j.joined_count, 0::BIGINT) AS mission_join_count,
                    b.bio,
                    cm.role
            FROM crew_memberships cm
            INNER JOIN brawlers b ON b.id = cm.brawler_id
            LEFT JOIN (
                SELECT cm2.brawler_id, COUNT(*) AS success_count
                FROM crew_memberships cm2
                INNER JOIN missions m2 ON m2.id = cm2.mission_id
                WHERE m2.status = 'success'
                GROUP BY cm2.brawler_id
            ) s ON s.brawler_id = b.id
            LEFT JOIN (
                SELECT cm3.brawler_id, COUNT(*) AS joined_count
                FROM crew_memberships cm3
                GROUP BY cm3.brawler_id
            ) j ON j.brawler_id = b.id
            WHERE cm.mission_id = $1
        "#;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let brawler_list = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .load::<BrawlerModel>(&mut conn)?;

        Ok(brawler_list)
    }

    async fn get_joined(&self, user_id: i32) -> Result<Vec<MissionModel>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let sql = r#"
            SELECT m.id, m.name, m.description, m.status, m.chief_id,
                   b.display_name AS chief_display_name,
                   (SELECT COUNT(*) FROM crew_memberships cm WHERE cm.mission_id = m.id) AS member_count,
                   m.max_members,
                   m.created_at, m.updated_at,
                   true AS is_joined
            FROM crew_memberships cm
            INNER JOIN missions m ON m.id = cm.mission_id
            INNER JOIN brawlers b ON b.id = m.chief_id
            WHERE cm.brawler_id = $1 
              AND m.chief_id != $1
              AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
        "#;

        let missions = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(user_id)
            .load::<MissionModel>(&mut conn)?;

        Ok(missions)
    }
}
