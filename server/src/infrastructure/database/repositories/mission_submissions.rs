use crate::domain::entities::mission_submissions::{MissionSubmission, NewMissionSubmission};
use crate::domain::repositories::mission_submissions::MissionSubmissionsRepository;
use crate::domain::value_objects::mission_submission_model::MissionSubmissionModel;
use crate::infrastructure::database::postgresql_connection::PgPoolSquad;
use crate::infrastructure::database::schema::mission_submissions;
use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

pub struct MissionSubmissionsPostgres {
    pub pool: Arc<PgPoolSquad>,
}

impl MissionSubmissionsPostgres {
    pub fn new(pool: Arc<PgPoolSquad>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl MissionSubmissionsRepository for MissionSubmissionsPostgres {
    async fn create(&self, new_submission: NewMissionSubmission<'_>) -> Result<MissionSubmission> {
        let mut conn = self.pool.get()?;

        let result = diesel::insert_into(mission_submissions::table)
            .values(&new_submission)
            .get_result(&mut conn)?;
        
        Ok(result)
    }

    async fn get_by_mission(&self, mission_id: i32) -> Result<Vec<MissionSubmissionModel>> {
        let mut conn = self.pool.get()?;

        let sql = r#"
            SELECT ms.*, b.display_name as brawler_name, b.avatar_url as brawler_avatar_url
            FROM mission_submissions ms
            JOIN brawlers b ON ms.brawler_id = b.id
            WHERE ms.mission_id = $1
            ORDER BY ms.submitted_at DESC
        "#;

        let results = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .load::<MissionSubmissionModel>(&mut conn)?;
        
        Ok(results)
    }

    async fn get_by_task(&self, task_id: i32) -> Result<Option<MissionSubmissionModel>> {
        let mut conn = self.pool.get()?;

        let sql = r#"
            SELECT ms.*, b.display_name as brawler_name, b.avatar_url as brawler_avatar_url
            FROM mission_submissions ms
            JOIN brawlers b ON ms.brawler_id = b.id
            WHERE ms.task_id = $1
            LIMIT 1
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(task_id)
            .get_result::<MissionSubmissionModel>(&mut conn)
            .optional()?;
        
        Ok(result)
    }

    async fn delete_all_by_member(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mut conn = self.pool.get()?;

        diesel::delete(
            mission_submissions::table
                .filter(mission_submissions::mission_id.eq(mission_id))
                .filter(mission_submissions::brawler_id.eq(brawler_id)),
        )
        .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_all_by_task(&self, task_id: i32) -> Result<()> {
        let mut conn = self.pool.get()?;

        diesel::delete(
            mission_submissions::table
                .filter(mission_submissions::task_id.eq(task_id)),
        )
        .execute(&mut conn)?;

        Ok(())
    }

    async fn get_by_id(&self, id: i32) -> Result<Option<MissionSubmissionModel>> {
        let mut conn = self.pool.get()?;

        let sql = r#"
            SELECT ms.*, b.display_name as brawler_name, b.avatar_url as brawler_avatar_url
            FROM mission_submissions ms
            JOIN brawlers b ON ms.brawler_id = b.id
            WHERE ms.id = $1
            LIMIT 1
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(id)
            .get_result::<MissionSubmissionModel>(&mut conn)
            .optional()?;
        
        Ok(result)
    }

    async fn update_description(&self, id: i32, description: String) -> Result<()> {
        let mut conn = self.pool.get()?;

        diesel::update(mission_submissions::table.find(id))
            .set(mission_submissions::description.eq(description))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete(&self, id: i32) -> Result<()> {
        let mut conn = self.pool.get()?;

        diesel::delete(mission_submissions::table.find(id)).execute(&mut conn)?;

        Ok(())
    }
}
