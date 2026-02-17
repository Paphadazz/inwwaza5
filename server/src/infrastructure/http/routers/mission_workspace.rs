use std::sync::Arc;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::{
    application::use_cases::{
        crew_operation::CrewOperationUseCase,
        mission_viewing::MissionViewingUseCase
    },
    domain::{
        value_objects::brawler_model::BrawlerModel,
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                crew_operation::CrewOperationPostgres,
                mission_viewing::MissionViewingPostgres,
                tasks::TaskPostgres,
            },
        },
        http::middlewares::auth::authorization,
    },
};

#[derive(Serialize)]
pub struct CrewListResponse {
    pub members: Vec<BrawlerModel>,
    pub count: usize,
    pub max_count: i32,
}

#[derive(Deserialize)]
pub struct UpdateRoleRequest {
    pub role: String,
}

#[derive(Deserialize)]
pub struct UpdateSettingsRequest {
    pub max_members: i32,
}

pub struct WorkspaceState {
    pub crew_case: Arc<CrewOperationUseCase<CrewOperationPostgres, MissionViewingPostgres>>,
    pub view_case: Arc<MissionViewingUseCase<MissionViewingPostgres>>,
    pub management_case: Arc<crate::application::use_cases::mission_management::MissionManagementUseCase<crate::infrastructure::database::repositories::mission_management::MissionManagementPostgres, crate::infrastructure::database::repositories::mission_viewing::MissionViewingPostgres>>,
    pub task_case: Arc<crate::application::use_cases::tasks::TaskUseCase<TaskPostgres, MissionViewingPostgres>>,
}

pub type AppState = Arc<WorkspaceState>;

pub async fn get_joined(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse {
    match state.view_case.get_joined(user_id).await {
        Ok(models) => (StatusCode::OK, Json(models)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn join(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.crew_case.join(mission_id, user_id).await {       
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Joined successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn leave(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.crew_case.leave(mission_id, user_id).await {      
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Left successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_member_role(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((mission_id, brawler_id)): Path<(i32, i32)>,
    Json(payload): Json<UpdateRoleRequest>,
) -> impl IntoResponse {
    match state.crew_case.update_role(mission_id, brawler_id, payload.role, user_id).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Role updated successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn kick_member(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((mission_id, brawler_id)): Path<(i32, i32)>,
) -> impl IntoResponse {
    match state.crew_case.kick(mission_id, brawler_id, user_id).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Member kicked successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_settings(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(payload): Json<UpdateSettingsRequest>,
) -> impl IntoResponse {
    use crate::domain::value_objects::mission_model::EditMissionModel;
    let edit_model = EditMissionModel {
        name: None,
        description: None,
        max_members: Some(payload.max_members),
        status: None,
    };
    match state.management_case.update(mission_id, edit_model, user_id).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Settings updated successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_members(
    State(state): State<AppState>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.view_case.get_one(mission_id, None).await {       
        Ok(mission) => {
             match state.view_case.get_crew(mission_id).await {   
                Ok(members) => {
                    let count = members.len();
                    (StatusCode::OK, Json(CrewListResponse { members, count, max_count: mission.max_members })).into_response()     
                }
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
            }
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let crew_repo = Arc::new(CrewOperationPostgres::new(Arc::clone(&db_pool)));
    let view_repo = Arc::new(MissionViewingPostgres::new(Arc::clone(&db_pool)));

    let crew_case = Arc::new(CrewOperationUseCase::new(
        Arc::clone(&crew_repo),
        Arc::clone(&view_repo),
    ));

    let task_repo = Arc::new(TaskPostgres::new(Arc::clone(&db_pool)));
    let task_case = Arc::new(crate::application::use_cases::tasks::TaskUseCase::new(
        Arc::clone(&task_repo),
        Arc::clone(&view_repo),
    ));
    
    let view_case = Arc::new(MissionViewingUseCase::new(Arc::clone(&view_repo)));

    let management_repo = Arc::new(crate::infrastructure::database::repositories::mission_management::MissionManagementPostgres::new(Arc::clone(&db_pool)));
    let management_case = Arc::new(crate::application::use_cases::mission_management::MissionManagementUseCase::new(
        Arc::clone(&management_repo),
        Arc::clone(&view_repo),
    ));

    let state: AppState = Arc::new(WorkspaceState {
        crew_case,
        view_case,
        management_case,
        task_case,
    });

    Router::new()
        .route("/joined", get(get_joined))
        .route("/{mission_id}/join", post(join))
        .route("/{mission_id}/leave", delete(leave))
        .route("/{mission_id}/members", get(get_members))
        .route("/{mission_id}/members/{brawler_id}/role", post(update_member_role))
        .route("/{mission_id}/members/{brawler_id}/kick", delete(kick_member))
        .route("/{mission_id}/settings", post(update_settings))
        // Task Routes
        .route("/{mission_id}/tasks", get(crate::infrastructure::http::routers::tasks::get_tasks).post(crate::infrastructure::http::routers::tasks::create_task))
        .route("/{mission_id}/tasks/{task_id}", patch(crate::infrastructure::http::routers::tasks::update_task).delete(crate::infrastructure::http::routers::tasks::delete_task))
        .route_layer(axum::middleware::from_fn(authorization))
        .with_state(state)
}
