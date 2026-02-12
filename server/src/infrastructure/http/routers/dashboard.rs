use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};

use crate::{
    application::use_cases::dashboard::DashboardUseCase,
    domain::repositories::dashboard::DashboardRepository,
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::dashboard::DashboardPostgres,
        },
        http::middlewares::auth::authorization,
    },
};

pub async fn get_summary<T>(
    State(use_case): State<Arc<DashboardUseCase<T>>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse
where
    T: DashboardRepository + Send + Sync,
{
    match use_case.get_summary(user_id).await {
        Ok(summary) => (StatusCode::OK, Json(summary)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = DashboardPostgres::new(Arc::clone(&db_pool));
    let use_case = DashboardUseCase::new(Arc::new(repository));

    Router::new()
        .route("/summary", get(get_summary))
        .route_layer(axum::middleware::from_fn(authorization))
        .with_state(Arc::new(use_case))
}
