use crate::domain::{
    entities::tasks::{CreateTaskEntity, UpdateTaskEntity},
    repositories::{
        mission_viewing::MissionViewingRepository, tasks::TaskRepository,
        mission_submissions::MissionSubmissionsRepository,
    },
    value_objects::task_model::{CreateTaskModel, TaskModel, UpdateTaskModel},
};
use anyhow::Result;
use chrono::Local;
use std::sync::Arc;

pub struct TaskUseCase<T1, T2, T3>
where
    T1: TaskRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionSubmissionsRepository + Send + Sync,
{
    task_repository: Arc<T1>,
    mission_viewing_repository: Arc<T2>,
    mission_submissions_repository: Arc<T3>,
}

impl<T1, T2, T3> TaskUseCase<T1, T2, T3>
where
    T1: TaskRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionSubmissionsRepository + Send + Sync,
{
    pub fn new(
        task_repository: Arc<T1>,
        mission_viewing_repository: Arc<T2>,
        mission_submissions_repository: Arc<T3>,
    ) -> Self {
        Self {
            task_repository,
            mission_viewing_repository,
            mission_submissions_repository,
        }
    }

    pub async fn create(&self, mission_id: i32, user_id: i32, model: CreateTaskModel) -> Result<TaskModel> {
        let mission = self.mission_viewing_repository.view_detail(mission_id, None).await?;
        
        if mission.chief_id != user_id {
            return Err(anyhow::anyhow!("Only the Chief can create tasks"));
        }

        let entity = CreateTaskEntity {
            mission_id,
            title: model.title,
            description: model.description,
            member_id: model.member_id,
            created_by: user_id,
            status: "Pending".to_string(),
            priority: model.priority.unwrap_or_else(|| "Medium".to_string()),
            start_date: model.start_date,
            end_date: model.end_date,
        };

        self.task_repository.create(entity).await
    }

    pub async fn update(&self, task_id: i32, user_id: i32, model: UpdateTaskModel) -> Result<TaskModel> {
        let task = self.task_repository.get_by_id(task_id).await?;
        let mission = self.mission_viewing_repository.view_detail(task.mission_id, None).await?;

        // Allow update if user is chief OR if user is assigned and updating status only?
        // For now, let's restrict major updates to Chief, but maybe status updates to assignee.
        // The user request said "Only mission owner can: ... Create and assign tasks". 
        // It didn't explicitly forbid members from updating status.
        // But for strict "Owner-only control", let's assume Members are View-Only for now as per "Members can: View tasks".

        if mission.chief_id != user_id {
            return Err(anyhow::anyhow!("Only the Chief can update tasks"));
        }

        let entity = UpdateTaskEntity {
            title: model.title,
            description: model.description,
            member_id: model.member_id,
            status: model.status,
            priority: model.priority,
            updated_at: Some(Local::now().naive_local()),
            has_submission: None,
        };

        self.task_repository.update(task_id, entity).await
    }

    pub async fn delete(&self, task_id: i32, user_id: i32) -> Result<()> {
        let task = self.task_repository.get_by_id(task_id).await?;
        let mission = self.mission_viewing_repository.view_detail(task.mission_id, None).await?;

        if mission.chief_id != user_id {
            return Err(anyhow::anyhow!("Only the Chief can delete tasks"));
        }

        // Manual cleanup for associated submissions as fallback to CASCADE
        self.mission_submissions_repository.delete_all_by_task(task_id).await?;
        
        self.task_repository.delete(task_id).await
    }

    pub async fn get_by_mission(&self, mission_id: i32, user_id: i32) -> Result<Vec<TaskModel>> {
        // Verify user is member or chief
        let mission = self.mission_viewing_repository.view_detail(mission_id, Some(user_id)).await?;
        if !mission.is_joined && mission.chief_id != user_id {
             return Err(anyhow::anyhow!("Access denied"));
        }

        self.task_repository.get_by_mission_id(mission_id).await
    }
}
