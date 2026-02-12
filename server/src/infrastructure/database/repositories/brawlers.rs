use anyhow::{Ok, Result};
use async_trait::async_trait;
use diesel::{
    ExpressionMethods, RunQueryDsl, SelectableHelper, insert_into,
    QueryDsl,
};
use std::sync::Arc;

use crate::{
    domain::{
        entities::{
            brawlers::{BrawlerEntity, RegisterBrawlerEntity},
            missions::MissionEntity,
        },
        repositories::brawlers::BrawlerRepository,
        value_objects::{
            base64_img::Base64Img, uploaded_img::UploadedImg, brawler_model::UpdateBrawlerModel,
        },
    },
    infrastructure::{
        cloudinary::{self, UploadImageOptions},
        database::{postgresql_connection::PgPoolSquad, schema::{brawlers, crew_memberships, missions}},
        jwt::{
            jwt_model::Passport,
        },
    },
};

pub struct BrawlerPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl BrawlerPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl BrawlerRepository for BrawlerPostgres {
    async fn register(&self, register_brawler_entity: RegisterBrawlerEntity) -> Result<Passport> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let brawler = insert_into(brawlers::table)
            .values(&register_brawler_entity)
            .get_result::<BrawlerEntity>(&mut connection)?;

        Passport::new(
            brawler.id,
            brawler.display_name,
            brawler.avatar_url,
            brawler.bio,
            Some(brawler.created_at.to_string()),
        )
    }

    async fn find_by_username(&self, username: String) -> Result<BrawlerEntity> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let result = brawlers::table
            .filter(brawlers::username.eq(username))
            .select(BrawlerEntity::as_select())
            .first::<BrawlerEntity>(&mut connection)?;

        Ok(result)
    }

    async fn find_by_id(&self, brawler_id: i32) -> Result<BrawlerEntity> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let result = brawlers::table
            .filter(brawlers::id.eq(brawler_id))
            .select(BrawlerEntity::as_select())
            .first::<BrawlerEntity>(&mut connection)?;

        Ok(result)
    }

    async fn upload_base64img(
        &self,
        user_id: i32,
        base64img: Base64Img,
        opt: UploadImageOptions,
    ) -> Result<UploadedImg> {
        let uploaded_img = cloudinary::upload(base64img, opt).await?;

        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::update(brawlers::table)
            .filter(brawlers::id.eq(user_id))
            .set((
                brawlers::avatar_url.eq(uploaded_img.url.clone()),
                brawlers::avatar_public_id.eq(uploaded_img.public_id.clone()),
            ))
            .execute(&mut conn)?;

        Ok(uploaded_img)
    }

    async fn crew_counting(&self, mission_id: i32) -> Result<u32> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let count: i64 = crew_memberships::table
            .filter(crew_memberships::mission_id.eq(mission_id))
            .count()
            .get_result(&mut connection)?;

        Ok(count as u32)
    }

    async fn get_missions(&self, brawler_id: i32) -> Result<Vec<MissionEntity>> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        let result = missions::table
            .filter(missions::chief_id.eq(brawler_id))
            .select(MissionEntity::as_select())
            .load::<MissionEntity>(&mut connection)?;

        Ok(result)
    }

    async fn update_profile(&self, brawler_id: i32, model: UpdateBrawlerModel) -> Result<()> {
        let mut connection = Arc::clone(&self.db_pool).get()?;

        diesel::update(brawlers::table)
            .filter(brawlers::id.eq(brawler_id))
            .set(&model)
            .execute(&mut connection)?;

        Ok(())
    }
}
