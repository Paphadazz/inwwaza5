use std::sync::Arc;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
    Extension, Json, Router,
};
use crate::infrastructure::http::routers::mission_workspace::AppState;
use crate::domain::value_objects::task_model::{CreateTaskModel, UpdateTaskModel};

pub async fn create_task(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(payload): Json<CreateTaskModel>,
) -> impl IntoResponse {
    match state.task_case.create(mission_id, user_id, payload).await {
        Ok(task) => (StatusCode::CREATED, Json(task)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_task(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((_mission_id, task_id)): Path<(i32, i32)>,
    Json(payload): Json<UpdateTaskModel>,
) -> impl IntoResponse {
    match state.task_case.update(task_id, user_id, payload).await {
        Ok(task) => (StatusCode::OK, Json(task)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_task(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((_mission_id, task_id)): Path<(i32, i32)>,
) -> impl IntoResponse {
    match state.task_case.delete(task_id, user_id).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Task deleted successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_tasks(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.task_case.get_by_mission(mission_id, user_id).await {
        Ok(tasks) => (StatusCode::OK, Json(tasks)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
