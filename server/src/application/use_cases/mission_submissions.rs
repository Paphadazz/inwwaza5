use crate::domain::{
    entities::mission_submissions::{MissionSubmission, NewMissionSubmission},
    repositories::{
        mission_submissions::MissionSubmissionsRepository,
        mission_viewing::MissionViewingRepository,
    },
    value_objects::base64_img::Base64Img,
};
use crate::infrastructure::{
    cloudinary::{upload_auto, UploadImageOptions},
};
use anyhow::Result;
use std::sync::Arc;

use crate::domain::value_objects::mission_submission_model::MissionSubmissionModel;

pub struct MissionSubmissionUseCase<T1, T2, T3>
where
    T1: MissionViewingRepository + Send + Sync,
    T2: MissionSubmissionsRepository + Send + Sync,
    T3: crate::domain::repositories::tasks::TaskRepository + Send + Sync,
{
    mission_viewing_repository: Arc<T1>,
    mission_submissions_repository: Arc<T2>,
    task_repository: Arc<T3>,
}

impl<T1, T2, T3> MissionSubmissionUseCase<T1, T2, T3>
where
    T1: MissionViewingRepository + Send + Sync,
    T2: MissionSubmissionsRepository + Send + Sync,
    T3: crate::domain::repositories::tasks::TaskRepository + Send + Sync,
{
    pub fn new(
        mission_viewing_repository: Arc<T1>,
        mission_submissions_repository: Arc<T2>,
        task_repository: Arc<T3>,
    ) -> Self {
        Self {
            mission_viewing_repository,
            mission_submissions_repository,
            task_repository,
        }
    }

    pub async fn submit_work(
        &self,
        mission_id: i32,
        brawler_id: i32,
        task_id: Option<i32>,
        base64_data: String,
        file_name: String,
        file_type: String,
    ) -> Result<MissionSubmission> {
        // 1. Verify user is a member of the mission
        let mission_details = self
            .mission_viewing_repository
            .view_detail(mission_id, Some(brawler_id))
            .await?;

        if !mission_details.is_joined {
            return Err(anyhow::anyhow!("You must be a member of this mission to submit work."));
        }

        // 2. Upload file to Cloudinary
        // Use Base64Img to ensure common prefix if missing
        let b64_img = Base64Img::new(base64_data)?;
        let upload_result = upload_auto(
            b64_img.into_inner(),
            UploadImageOptions {
                folder: Some(format!("mission_{}_submissions", mission_id)),
                public_id: None,
                transformation: None,
            },
        )
        .await?;

        // 3. Save submission to database
        let new_submission = NewMissionSubmission {
            mission_id,
            brawler_id,
            file_url: &upload_result.url,
            file_name: &file_name,
            file_type: &file_type,
            task_id,
            description: None,
        };

        let submission = self.mission_submissions_repository.create(new_submission).await?;

        // 4. Update task has_submission flag
        if let Some(tid) = task_id {
            let _ = self.task_repository.update(tid, crate::domain::entities::tasks::UpdateTaskEntity {
                title: None,
                description: None,
                member_id: None,
                status: Some("Review".to_string()),
                priority: None,
                updated_at: Some(chrono::Utc::now().naive_utc()),
                has_submission: Some(true),
            }).await;
        }

        Ok(submission)
    }

    pub async fn get_submissions(&self, mission_id: i32, brawler_id: i32) -> Result<Vec<MissionSubmissionModel>> {
        let mission_details = self.mission_viewing_repository.view_detail(mission_id, Some(brawler_id)).await?;

        if !mission_details.is_joined && mission_details.chief_id != brawler_id {
             return Err(anyhow::anyhow!("You do not have permission to view submissions for this mission."));
        }

        let submissions = self.mission_submissions_repository.get_by_mission(mission_id).await?;
        Ok(submissions)
    }

    pub async fn get_task_submission(&self, task_id: i32, _brawler_id: i32) -> Result<Option<MissionSubmissionModel>> {
        let submission = self.mission_submissions_repository.get_by_task(task_id).await?;
        Ok(submission)
    }

    pub async fn delete_submission(&self, id: i32, brawler_id: i32) -> Result<()> {
        let submission = self.mission_submissions_repository.get_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("Submission not found"))?;

        let mission = self.mission_viewing_repository.view_detail(submission.mission_id, Some(brawler_id)).await?;
        
        if mission.chief_id != brawler_id && submission.brawler_id != brawler_id {
            return Err(anyhow::anyhow!("Only the Chief or the submission owner can delete submissions"));
        }

        self.mission_submissions_repository.delete(id).await?;
        
        // Update task if applicable
        if let Some(tid) = submission.task_id {
            let _ = self.task_repository.update(tid, crate::domain::entities::tasks::UpdateTaskEntity {
                title: None,
                description: None,
                member_id: None,
                status: Some("In Progress".to_string()),
                priority: None,
                updated_at: Some(chrono::Utc::now().naive_utc()),
                has_submission: Some(false),
            }).await;
        }

        Ok(())
    }

    pub async fn update_description(&self, id: i32, brawler_id: i32, description: String) -> Result<()> {
        let submission = self.mission_submissions_repository.get_by_id(id).await?
            .ok_or_else(|| anyhow::anyhow!("Submission not found"))?;

        let mission = self.mission_viewing_repository.view_detail(submission.mission_id, Some(brawler_id)).await?;
        
        if mission.chief_id != brawler_id && submission.brawler_id != brawler_id {
            return Err(anyhow::anyhow!("Only the Chief or the submission owner can update descriptions"));
        }

        self.mission_submissions_repository.update_description(id, description).await?;

        Ok(())
    }
}
