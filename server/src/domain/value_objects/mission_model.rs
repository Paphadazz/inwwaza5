use chrono::NaiveDateTime;
use diesel::{
    QueryableByName,
    sql_types::{BigInt, Int4, Nullable, Text, Timestamp, Varchar},
};
use serde::{Deserialize, Serialize};

use crate::domain::{
    entities::missions::{AddMissionEntity, EditMissionEntity},
    value_objects::mission_statuses::MissionStatuses,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, QueryableByName)]
pub struct MissionModel {
    #[diesel(sql_type = Int4)]
    pub id: i32,
    #[diesel(sql_type = Varchar)]
    pub name: String,
    #[diesel(sql_type = Nullable<Text>)]
    pub description: Option<String>,
    #[diesel(sql_type = Varchar)]
    pub status: String,
    #[diesel(sql_type = Int4)]
    pub chief_id: i32,
    #[diesel(sql_type = Varchar)]
    pub chief_display_name: String,
    #[diesel(sql_type = BigInt)]
    pub member_count: i64,
    #[diesel(sql_type = Int4)]
    pub max_members: i32,
    #[diesel(sql_type = Timestamp)]
    pub created_at: NaiveDateTime,
    #[diesel(sql_type = Timestamp)]
    pub updated_at: NaiveDateTime,
    #[diesel(sql_type = diesel::sql_types::Bool)]
    pub is_joined: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddMissionModel {
    pub name: String,
    pub description: Option<String>,
    pub max_members: Option<i32>,
    pub status: Option<String>,
}

impl AddMissionModel {
    pub fn to_entity(&self, chief_id: i32) -> AddMissionEntity {
        AddMissionEntity {
            name: self.name.clone(),
            description: self.description.clone(),
            status: self.status.clone().unwrap_or(MissionStatuses::Open.to_string()),
            chief_id,
            max_members: self.max_members.unwrap_or(10),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditMissionModel {
    pub name: Option<String>,
    pub description: Option<String>,
    pub max_members: Option<i32>,
    pub status: Option<String>,
}

impl EditMissionModel {
    pub fn to_entity(&self, chief_id: i32) -> EditMissionEntity {
        EditMissionEntity {
            name: self.name.clone(),
            description: self.description.clone(),
            max_members: self.max_members,
            chief_id,
            status: self.status.clone(),
        }
    }
}
