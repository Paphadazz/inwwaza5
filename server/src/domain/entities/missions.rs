use chrono::NaiveDateTime;
use diesel::prelude::*;

use crate::{
    domain::value_objects::mission_model::MissionModel, infrastructure::database::schema::missions,
};

#[derive(Debug, Clone, Identifiable, Selectable, Queryable)]
#[diesel(check_for_backend(diesel::pg::Pg))]
#[diesel(table_name = missions)]
pub struct MissionEntity {
    pub id: i32,
    pub chief_id: i32,
    pub name: String,
    pub status: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub max_members: i32,
}

impl MissionEntity {
    pub fn to_model(&self, chief_display_name: String, member_count: i64) -> MissionModel {
        MissionModel {
            id: self.id,
            name: self.name.clone(),
            description: self.description.clone(),
            status: self.status.clone(),
            chief_id: self.chief_id,
            chief_display_name,
            member_count,
            max_members: self.max_members,
            created_at: self.created_at,
            updated_at: self.updated_at,
            is_joined: false,
        }
    }
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = missions)]
pub struct AddMissionEntity {
    pub chief_id: i32,
    pub name: String,
    pub status: String,
    pub description: Option<String>,
    pub max_members: i32,
}

#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = missions)]
pub struct EditMissionEntity {
    pub chief_id: i32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub max_members: Option<i32>,
    pub status: Option<String>,
}
