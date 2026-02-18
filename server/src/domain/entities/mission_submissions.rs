use crate::infrastructure::database::schema::mission_submissions;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = mission_submissions)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct MissionSubmission {
    pub id: i32,
    pub mission_id: i32,
    pub brawler_id: i32,
    pub file_url: String,
    pub file_name: String,
    pub file_type: String,
    pub submitted_at: DateTime<Utc>,
    pub task_id: Option<i32>,
    pub description: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = mission_submissions)]
pub struct NewMissionSubmission<'a> {
    pub mission_id: i32,
    pub brawler_id: i32,
    pub file_url: &'a str,
    pub file_name: &'a str,
    pub file_type: &'a str,
    pub task_id: Option<i32>,
    pub description: Option<&'a str>,
}
