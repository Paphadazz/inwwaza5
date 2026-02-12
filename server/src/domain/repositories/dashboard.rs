use anyhow::Result;
use async_trait::async_trait;
use crate::domain::value_objects::dashboard_model::DashboardSummary;

#[async_trait]
pub trait DashboardRepository {
    async fn get_summary(&self, brawler_id: i32) -> Result<DashboardSummary>;
}
