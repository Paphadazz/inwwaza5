-- up.sql
DO $$
DECLARE
    constraint_name_val TEXT;
BEGIN
    -- Drop all foreign key constraints on the task_id column in mission_submissions
    FOR constraint_name_val IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'mission_submissions'::regclass
          AND contype = 'f'
          AND conkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'mission_submissions'::regclass AND attname = 'task_id')::smallint]
    LOOP
        EXECUTE 'ALTER TABLE mission_submissions DROP CONSTRAINT ' || constraint_name_val;
    END LOOP;
END $$;

-- Add the CASCADE constraint
ALTER TABLE mission_submissions
ADD CONSTRAINT mission_submissions_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES tasks(id)
ON DELETE CASCADE;
