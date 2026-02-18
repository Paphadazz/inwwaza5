use crate::domain::entities::mission_submissions::{MissionSubmission, NewMissionSubmission};
use crate::domain::value_objects::mission_submission_model::MissionSubmissionModel;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait MissionSubmissionsRepository: Send + Sync {
    async fn create(&self, new_submission: NewMissionSubmission<'_>) -> Result<MissionSubmission>;
    async fn get_by_mission(&self, mission_id: i32) -> Result<Vec<MissionSubmissionModel>>;
    async fn get_by_task(&self, task_id: i32) -> Result<Option<MissionSubmissionModel>>;
    async fn get_by_id(&self, id: i32) -> Result<Option<MissionSubmissionModel>>;
    async fn delete_all_by_member(&self, mission_id: i32, brawler_id: i32) -> Result<()>;
    async fn delete_all_by_task(&self, task_id: i32) -> Result<()>;
    async fn update_description(&self, id: i32, description: String) -> Result<()>;
    async fn delete(&self, id: i32) -> Result<()>;
}
