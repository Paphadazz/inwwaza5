use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub created_missions_count: i64,
    pub joined_missions_count: i64,
    pub active_missions_count: i64,
    pub completed_missions_count: i64,
}
