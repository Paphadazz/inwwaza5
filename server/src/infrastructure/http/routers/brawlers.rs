use std::sync::Arc;

use axum::{
    Extension, Json, Router, extract::State, http::StatusCode, response::IntoResponse,
    routing::{get, post},
};

use crate::{
    application::use_cases::brawlers::BrawlersUseCase,
    domain::{
        repositories::brawlers::BrawlerRepository,
        value_objects::uploaded_img::UploadBase64Img,
    },
    infrastructure::{
        database::{postgresql_connection::PgPoolSquad, repositories::brawlers::BrawlerPostgres},
        http::middlewares::auth::auth,
    },
};

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = BrawlerPostgres::new(db_pool);
    let user_case = BrawlersUseCase::new(Arc::new(repository));

    let protected_routes = Router::new()
        .route("/avatar", post(upload_avatar))
        .route("/missions", get(get_my_missions))
        .route_layer(axum::middleware::from_fn(auth));

    Router::new()
        .merge(protected_routes)
        .with_state(Arc::new(user_case))
}

pub async fn upload_avatar<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
    Json(model): Json<UploadBase64Img>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case
        .upload_base64img(user_id, model.base64_string)
        .await
    {
        Ok(upload_img) => (StatusCode::OK, Json(upload_img)).into_response(),

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_my_missions<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.get_missions_by_brawler(user_id).await {
        Ok(missions) => (StatusCode::OK, Json(missions)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
