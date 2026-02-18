use crate::domain::{
    entities::crew_memberships::CrewMemberShips,
    repositories::{
        crew_operation::CrewOperationRepository, mission_viewing::MissionViewingRepository,
        mission_submissions::MissionSubmissionsRepository,
    },
    value_objects::mission_statuses::MissionStatuses,
};
use anyhow::Result;
use chrono::Local;
use std::sync::Arc;

pub struct CrewOperationUseCase<T1, T2, T3>
where
    T1: CrewOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionSubmissionsRepository + Send + Sync,
{
    crew_operation_repository: Arc<T1>,
    mission_viewing_repository: Arc<T2>,
    mission_submissions_repository: Arc<T3>,
}

impl<T1, T2, T3> CrewOperationUseCase<T1, T2, T3>
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync,
    T3: MissionSubmissionsRepository + Send + Sync,
{
    pub fn new(
        crew_operation_repository: Arc<T1>,
        mission_viewing_repository: Arc<T2>,
        mission_submissions_repository: Arc<T3>,
    ) -> Self {
        Self {
            crew_operation_repository,
            mission_viewing_repository,
            mission_submissions_repository,
        }
    }

    pub async fn join(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.view_detail(mission_id, Some(brawler_id)).await?;

        if mission.is_joined {
            return Ok(());
        }

        if mission.chief_id == brawler_id {
            return Err(anyhow::anyhow!(
                "The Chief can not join in his own mission as a crew member!!"
            ));
        }

        let member_count = self
            .mission_viewing_repository
            .member_counting(mission_id)
            .await?;

        let mission_status_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::Failed.to_string();
        if !mission_status_condition {
            return Err(anyhow::anyhow!("Mission is not joinable"));
        }
        let member_count_condition = (member_count as i32) < mission.max_members;
        if !member_count_condition {
            return Err(anyhow::anyhow!("Mission is full"));
        }

        self.crew_operation_repository
            .join(CrewMemberShips {
                mission_id,
                brawler_id,
                joined_at: Local::now().naive_local(),
                role: "Member".to_string(),
            })
            .await?;

        Ok(())
    }

    pub async fn leave(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.view_detail(mission_id, Some(brawler_id)).await?;

        if !mission.is_joined {
            return Err(anyhow::anyhow!("You are not a member of this mission"));
        }

        let leaving_condition = mission.status == MissionStatuses::Open.to_string()
            || mission.status == MissionStatuses::InProgress.to_string()
            || mission.status == MissionStatuses::Failed.to_string();

        if !leaving_condition {
            return Err(anyhow::anyhow!("Mission is not leavable in its current state"));
        }

        self.crew_operation_repository
            .leave(CrewMemberShips {
                mission_id,
                brawler_id,
                joined_at: Local::now().naive_local(),
                role: "".to_string(), // Role doesn't matter for leave
            })
            .await?;

        Ok(())
    }

    pub async fn update_role(&self, mission_id: i32, brawler_id: i32, role: String, chief_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.view_detail(mission_id, None).await?;
        if mission.chief_id != chief_id {
            return Err(anyhow::anyhow!("Only the Chief can update roles"));
        }

        self.crew_operation_repository.update_role(mission_id, brawler_id, role).await?;
        Ok(())
    }

    pub async fn kick(&self, mission_id: i32, brawler_id: i32, chief_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.view_detail(mission_id, None).await?;
        
        if mission.chief_id != chief_id {
            return Err(anyhow::anyhow!("Only the Chief can kick members"));
        }

        if mission.chief_id == brawler_id {
            return Err(anyhow::anyhow!("The Chief cannot kick themselves"));
        }

        // Cleanup submissions before kicking
        self.mission_submissions_repository
            .delete_all_by_member(mission_id, brawler_id)
            .await?;

        self.crew_operation_repository
            .leave(CrewMemberShips {
                mission_id,
                brawler_id,
                joined_at: Local::now().naive_local(),
                role: "".to_string(),
            })
            .await?;

        Ok(())
    }
}
