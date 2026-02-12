use std::sync::Arc;

use anyhow::Result;

use crate::{
    domain::{
        repositories::brawlers::BrawlerRepository,
        value_objects::brawler_model::RegisterBrawlerModel,       
    },
    infrastructure::{
        argon2::{self, hash},
        jwt::{authentication_model::LoginModel, jwt_model::Passport},
    },
};
pub struct AuthenticationUseCase<T>
where
    T: BrawlerRepository + Send + Sync,
{
    brawler_repository: Arc<T>,
}
impl<T> AuthenticationUseCase<T>
where
    T: BrawlerRepository + Sync + Send,
{
    pub fn new(brawler_repository: Arc<T>) -> Self {
        Self { brawler_repository }
    }

    pub async fn login(&self, login_model: LoginModel) -> Result<Passport> {
        let username = login_model.username.clone();
        println!("Login attempt for username: {}", username);

        //find this user in database
        let user = self.brawler_repository.find_by_username(username).await?;
        let hashed_password = user.password;
        println!("User found. Hashed password from DB: {}", hashed_password);
        println!("Password provided: {}", login_model.password);

        if !argon2::verify(login_model.password, hashed_password)? {
            println!("Password verification failed!");
            return Err(anyhow::anyhow!("Invalid Password !!"));   
        }
        println!("Password verification successful!");

        let passport = Passport::new(
            user.id,
            user.display_name,
            user.avatar_url,
            user.bio,
            Some(user.created_at.format("%Y-%m-%dT%H:%M:%SZ").to_string()),
        )?;
        Ok(passport)
    }

    pub async fn register(
        &self,
        mut register_brawler_model: RegisterBrawlerModel,
    ) -> Result<Passport> {
        let raw_password = register_brawler_model.password.clone();
        println!("Registering user: {}", register_brawler_model.username);
        println!("Raw password: {}", raw_password);

        let hashed_password = hash(raw_password)?;
        println!("Hashed password generated: {}", hashed_password);

        register_brawler_model.password = hashed_password;

        let register_entity = register_brawler_model.to_entity(); 

        let passport = self.brawler_repository.register(register_entity).await?;

        Ok(passport)
    }
}
