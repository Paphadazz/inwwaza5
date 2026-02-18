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
    pub has_submission: Option<bool>,
}

#[derive(Debug, Clone, Queryable, Selectable)]
#[diesel(table_name = tasks)]
pub struct TaskEntityInternal {
    pub id: i32,
    pub mission_id: i32,
    pub member_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
    pub priority: String,
    pub status: String,
    pub created_by: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub has_submission: bool,
}
