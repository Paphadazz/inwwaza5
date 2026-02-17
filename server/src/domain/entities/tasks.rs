use crate::infrastructure::database::schema::tasks;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = tasks)]
pub struct CreateTaskEntity {
    pub mission_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub member_id: Option<i32>,
    pub created_by: i32,
    pub status: String,
    pub priority: String,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = tasks)]
pub struct UpdateTaskEntity {
    pub title: Option<String>,
    pub description: Option<String>,
    pub member_id: Option<i32>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
}
