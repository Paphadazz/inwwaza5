CREATE TABLE mission_submissions (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    brawler_id INTEGER NOT NULL REFERENCES brawlers(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mission_submissions_mission_id ON mission_submissions(mission_id);
CREATE INDEX idx_mission_submissions_brawler_id ON mission_submissions(brawler_id);
