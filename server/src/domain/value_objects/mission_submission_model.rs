use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use diesel::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize, QueryableByName)]
#[diesel(table_name = crate::infrastructure::database::schema::mission_submissions)]
pub struct MissionSubmissionModel {
    #[diesel(sql_type = diesel::sql_types::Int4)]
    pub id: i32,
    #[diesel(sql_type = diesel::sql_types::Int4)]
    pub mission_id: i32,
    #[diesel(sql_type = diesel::sql_types::Int4)]
    pub brawler_id: i32,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub brawler_name: String,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub file_url: String,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub file_name: String,
    #[diesel(sql_type = diesel::sql_types::Text)]
    pub file_type: String,
    #[diesel(sql_type = diesel::sql_types::Timestamptz)]
    pub submitted_at: DateTime<Utc>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Int4>)]
    pub task_id: Option<i32>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    pub brawler_avatar_url: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    pub description: Option<String>,
}
