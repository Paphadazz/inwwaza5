CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES brawlers(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, InProgress, Completed
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by mission
CREATE INDEX idx_tasks_mission_id ON tasks(mission_id);
-- Index for lookups by assignee
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
