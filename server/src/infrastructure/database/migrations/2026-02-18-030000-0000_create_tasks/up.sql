CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES brawlers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_by INTEGER NOT NULL REFERENCES brawlers(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by mission
CREATE INDEX IF NOT EXISTS idx_tasks_mission_id ON tasks(mission_id);
-- Index for lookups by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_member_id ON tasks(member_id);
