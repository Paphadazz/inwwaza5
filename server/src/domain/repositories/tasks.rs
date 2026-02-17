use crate::domain::{
    entities::tasks::{CreateTaskEntity, UpdateTaskEntity},
    value_objects::task_model::TaskModel,
};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait TaskRepository {
    async fn create(&self, entity: CreateTaskEntity) -> Result<TaskModel>;
    async fn update(&self, task_id: i32, entity: UpdateTaskEntity) -> Result<TaskModel>;
    async fn delete(&self, task_id: i32) -> Result<()>;
    async fn get_by_id(&self, task_id: i32) -> Result<TaskModel>;
    async fn get_by_mission_id(&self, mission_id: i32) -> Result<Vec<TaskModel>>;
    async fn get_by_assignee(&self, member_id: i32) -> Result<Vec<TaskModel>>;
}
