use std::sync::Arc;

use axum::{Json, Router, extract::State, http::StatusCode, response::IntoResponse, routing::post};

use crate::{
    application::use_cases::authentication::AuthenticationUseCase,
    domain::{
        repositories::brawlers::BrawlerRepository, value_objects::brawler_model::RegisterBrawlerModel,
    },
    infrastructure::{
        database::{postgresql_connection::PgPoolSquad, repositories::brawlers::BrawlerPostgres},
        jwt::authentication_model::LoginModel,
    },
};

pub async fn login<T>(
    State(user_case): State<Arc<AuthenticationUseCase<T>>>,       
    Json(model): Json<LoginModel>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.login(model).await {
        Ok(passport) => (StatusCode::OK, Json(passport)).into_response(),

        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn register<T>(
    State(user_case): State<Arc<AuthenticationUseCase<T>>>,       
    Json(model): Json<RegisterBrawlerModel>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.register(model).await {
        Ok(passport) => (StatusCode::CREATED, Json(passport)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = BrawlerPostgres::new(db_pool);
    let user_case = AuthenticationUseCase::new(Arc::new(repository));

    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
        .with_state(Arc::new(user_case))
}
