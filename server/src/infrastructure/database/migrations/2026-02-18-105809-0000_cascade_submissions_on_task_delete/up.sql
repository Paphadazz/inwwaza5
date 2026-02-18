ALTER TABLE mission_submissions DROP CONSTRAINT IF EXISTS mission_submissions_task_id_fkey;
ALTER TABLE mission_submissions ADD CONSTRAINT mission_submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
