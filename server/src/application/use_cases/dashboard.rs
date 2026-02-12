use std::sync::Arc;
use anyhow::Result;

use crate::domain::{
    repositories::dashboard::DashboardRepository,
    value_objects::dashboard_model::DashboardSummary,
};

pub struct DashboardUseCase<T>
where
    T: DashboardRepository + Send + Sync,
{
    dashboard_repository: Arc<T>,
}

impl<T> DashboardUseCase<T>
where
    T: DashboardRepository + Send + Sync,
{
    pub fn new(dashboard_repository: Arc<T>) -> Self {
        Self { dashboard_repository }
    }

    pub async fn get_summary(&self, brawler_id: i32) -> Result<DashboardSummary> {
        self.dashboard_repository.get_summary(brawler_id).await
    }
}
