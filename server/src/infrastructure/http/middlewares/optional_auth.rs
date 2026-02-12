use axum::{
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::Response,
};

use crate::{config::config_loader::get_jwt_env, infrastructure::jwt::verify_token};

pub async fn optional_authorization(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok());

    if let Some(auth_header) = header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            let jwt_env = get_jwt_env().unwrap();
            let secret = jwt_env.secret;

            if let Ok(claims) = verify_token(secret, token.to_string()) {
                if let Ok(user_id) = claims.sub.parse::<i32>() {
                    req.extensions_mut().insert(user_id);
                }
            }
        }
    }

    Ok(next.run(req).await)
}
