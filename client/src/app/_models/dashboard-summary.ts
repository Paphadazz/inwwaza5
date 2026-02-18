export interface ActivityPoint {
    date: string;
    created: number;
    joined: number;
    completed: number;
    active: number;
}

export interface DashboardSummary {
    created_missions_count: number;
    joined_missions_count: number;
    active_missions_count: number;
    completed_missions_count: number;
    chart_data: ActivityPoint[];
}
