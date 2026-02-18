// @generated automatically by Diesel CLI.

diesel::table! {
    brawlers (id) {
        id -> Int4,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 255]
        password -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        #[max_length = 50]
        display_name -> Varchar,
        #[max_length = 512]
        avatar_url -> Nullable<Varchar>,
        #[max_length = 255]
        avatar_public_id -> Nullable<Varchar>,
        bio -> Nullable<Text>,
    }
}

diesel::table! {
    crew_memberships (mission_id, brawler_id) {
        mission_id -> Int4,
        brawler_id -> Int4,
        joined_at -> Timestamp,
        #[max_length = 255]
        role -> Varchar,
        assigned_by -> Nullable<Int4>,
    }
}

diesel::table! {
    mission_submissions (id) {
        id -> Int4,
        mission_id -> Int4,
        brawler_id -> Int4,
        file_url -> Text,
        file_name -> Text,
        file_type -> Text,
        submitted_at -> Timestamptz,
        task_id -> Nullable<Int4>,
        description -> Nullable<Text>,
    }
}

diesel::table! {
    missions (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 255]
        status -> Varchar,
        chief_id -> Int4,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
        max_members -> Int4,
        start_date -> Nullable<Timestamp>,
        end_date -> Nullable<Timestamp>,
    }
}

diesel::table! {
    tasks (id) {
        id -> Int4,
        mission_id -> Int4,
        member_id -> Nullable<Int4>,
        #[max_length = 255]
        title -> Varchar,
        description -> Nullable<Text>,
        start_date -> Nullable<Timestamp>,
        end_date -> Nullable<Timestamp>,
        #[max_length = 50]
        priority -> Varchar,
        #[max_length = 50]
        status -> Varchar,
        created_by -> Int4,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        has_submission -> Bool,
    }
}

diesel::joinable!(crew_memberships -> missions (mission_id));
diesel::joinable!(mission_submissions -> brawlers (brawler_id));
diesel::joinable!(mission_submissions -> missions (mission_id));
diesel::joinable!(mission_submissions -> tasks (task_id));
diesel::joinable!(missions -> brawlers (chief_id));
diesel::joinable!(tasks -> missions (mission_id));

diesel::allow_tables_to_appear_in_same_query!(
    brawlers,
    crew_memberships,
    mission_submissions,
    missions,
    tasks,
);
