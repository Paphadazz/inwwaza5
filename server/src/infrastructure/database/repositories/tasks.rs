use crate::domain::{
    entities::tasks::{CreateTaskEntity, UpdateTaskEntity},
    repositories::tasks::TaskRepository,
    value_objects::task_model::TaskModel,
};
use crate::infrastructure::database::postgresql_connection::PgPoolSquad;
use crate::infrastructure::database::schema::tasks;
use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

pub struct TaskPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl TaskPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl TaskRepository for TaskPostgres {
    async fn create(&self, entity: CreateTaskEntity) -> Result<TaskModel> {
        let mut conn = self.db_pool.get()?;
        let result = diesel::insert_into(tasks::table)
            .values(&entity)
            .get_result::<TaskModel>(&mut conn)?;
        Ok(result)
    }

    async fn update(&self, task_id: i32, entity: UpdateTaskEntity) -> Result<TaskModel> {
        let mut conn = self.db_pool.get()?;
        let result = diesel::update(tasks::table.find(task_id))
            .set(&entity)
            .get_result::<TaskModel>(&mut conn)?;
        Ok(result)
    }

    async fn delete(&self, task_id: i32) -> Result<()> {
        let mut conn = self.db_pool.get()?;
        diesel::delete(tasks::table.find(task_id)).execute(&mut conn)?;
        Ok(())
    }

    async fn get_by_id(&self, task_id: i32) -> Result<TaskModel> {
        let mut conn = self.db_pool.get()?;
        let result = tasks::table
            .find(task_id)
            .get_result::<TaskModel>(&mut conn)?;
        Ok(result)
    }

    async fn get_by_mission_id(&self, mission_id: i32) -> Result<Vec<TaskModel>> {
        let mut conn = self.db_pool.get()?;
        let result = tasks::table
            .filter(tasks::mission_id.eq(mission_id))
            .order(tasks::created_at.desc())
            .load::<TaskModel>(&mut conn)?;
        Ok(result)
    }

    async fn get_by_assignee(&self, member_id: i32) -> Result<Vec<TaskModel>> {
        let mut conn = self.db_pool.get()?;
        let result = tasks::table
            .filter(tasks::member_id.eq(member_id))
            .order(tasks::created_at.desc())
            .load::<TaskModel>(&mut conn)?;
        Ok(result)
    }
}
