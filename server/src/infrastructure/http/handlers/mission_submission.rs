use crate::infrastructure::http::routers::mission_workspace::AppState;
use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};
use base64::{engine::general_purpose, Engine};

#[derive(serde::Deserialize)]
pub struct SubmitQuery {
    pub task_id: Option<i32>,
}

pub async fn submit_work(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    axum::extract::Query(query): axum::extract::Query<SubmitQuery>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_data = None;
    let mut file_name = String::new();
    let mut file_type = String::new();

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();

        if name == "file" {
            file_name = field.file_name().unwrap_or("unknown").to_string();
            file_type = field.content_type().unwrap_or("application/octet-stream").to_string();
            let data = field.bytes().await.unwrap();
            file_data = Some(data);
        }
    }

    if let Some(data) = file_data {
        let base64_data = general_purpose::STANDARD.encode(data);
        match state
            .submission_case
            .submit_work(
                mission_id,
                user_id,
                query.task_id,
                base64_data,
                file_name,
                file_type,
            )
            .await
        {
            Ok(submission) => (StatusCode::OK, Json(submission)).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        }
    } else {
        (StatusCode::BAD_REQUEST, "No file uploaded").into_response()
    }
}

pub async fn get_task_submission(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((_mission_id, task_id)): Path<(i32, i32)>,
) -> impl IntoResponse {
    match state.submission_case.get_task_submission(task_id, user_id).await {
        Ok(Some(submission)) => (StatusCode::OK, Json(submission)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "No submission found for this task").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_mission_submissions(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.submission_case.get_submissions(mission_id, user_id).await {
        Ok(submissions) => (StatusCode::OK, Json(submissions)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
pub async fn delete_submission(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((_mission_id, submission_id)): Path<(i32, i32)>,
) -> impl IntoResponse {
    match state.submission_case.delete_submission(submission_id, user_id).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Submission deleted successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
#[derive(serde::Deserialize)]
pub struct UpdateDetailsRequest {
    pub description: String,
}

pub async fn update_submission_details(
    State(state): State<AppState>,
    Extension(user_id): Extension<i32>,
    Path((_mission_id, submission_id)): Path<(i32, i32)>,
    Json(payload): Json<UpdateDetailsRequest>,
) -> impl IntoResponse {
    match state.submission_case.update_description(submission_id, user_id, payload.description).await {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "message": "Submission details updated successfully" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
