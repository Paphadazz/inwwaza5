use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = crate::infrastructure::database::schema::tasks)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct TaskModel {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskModel {
    pub title: String,
    pub description: Option<String>,
    pub member_id: Option<i32>,
    pub priority: Option<String>,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskModel {
    pub title: Option<String>,
    pub description: Option<String>,
    pub member_id: Option<i32>,
    pub status: Option<String>,
    pub priority: Option<String>,
}
