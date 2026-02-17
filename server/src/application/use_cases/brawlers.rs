use crate::{
    domain::{
        repositories::brawlers::BrawlerRepository,
        value_objects::{
            base64_img::Base64Img, brawler_model::RegisterBrawlerModel, uploaded_img::UploadedImg,
            mission_model::MissionModel, brawler_model::UpdateBrawlerModel,
        },
    },
    infrastructure::{argon2::hash, cloudinary::UploadImageOptions, jwt::jwt_model::Passport},
};
use anyhow::{Ok, Result};
use std::sync::Arc;

pub struct BrawlersUseCase<T>
where
    T: BrawlerRepository + Send + Sync,
{
    brawler_repository: Arc<T>,
}

impl<T> BrawlersUseCase<T>
where
    T: BrawlerRepository + Send + Sync,
{
    pub fn new(brawler_repository: Arc<T>) -> Self {
        Self { brawler_repository }
    }

    pub async fn register(
        &self,
        mut register_brawler_model: RegisterBrawlerModel,
    ) -> Result<Passport> {
        let hashed_password = hash(register_brawler_model.password.clone())?;

        register_brawler_model.password = hashed_password;

        let register_entity = register_brawler_model.to_entity();

        let passport = self.brawler_repository.register(register_entity).await?;

        Ok(passport)
    }

    pub async fn upload_base64img(
        &self,
        user_id: i32,
        base64string: String,
    ) -> Result<UploadedImg> {
        let opt = UploadImageOptions {
            folder: Some("avatar".to_string()),
            public_id: Some(user_id.to_string()),
            transformation: Some("c_scale,w_256".to_string()),
        };

        let base64img = Base64Img::new(base64string)?;

        let uploaded = self
            .brawler_repository
            .upload_base64img(user_id, base64img, opt)
            .await?;

        Ok(uploaded)
    }

    pub async fn get_missions_by_brawler(&self, brawler_id: i32) -> Result<Vec<MissionModel>> {
        let missions = self.brawler_repository.get_missions(brawler_id).await?;
        let brawler = self.brawler_repository.find_by_id(brawler_id).await?;

        let mut mission_models = Vec::new();
        for mission in missions {
            let member_count = self.brawler_repository.member_counting(mission.id).await?;
            mission_models.push(mission.to_model(brawler.display_name.clone(), member_count as i64));
        }

        Ok(mission_models)
    }

    pub async fn update_profile(&self, brawler_id: i32, model: UpdateBrawlerModel) -> Result<()> {
        self.brawler_repository.update_profile(brawler_id, model).await?;
        Ok(())
    }
}
