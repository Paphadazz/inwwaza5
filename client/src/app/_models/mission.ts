export interface Mission {
    id: number,
    name: string,
    description?: string,
    status: string,
    chief_id: number,
    chief_display_name: string,
    member_count: number,
    max_members: number,
    created_at: Date,
    updated_at: Date,
    is_joined: boolean
}