-- Seeding some users metadata (you'll need to create matching auth.users)
-- Assuming IDs for demonstration:
-- 1: Unit Head, 2: Manager, 3: Project Lead, 4: Employee 1, 5: Employee 2

-- Seed Projects (5 entries)
INSERT INTO projects (name, description, status, completion_percentage) VALUES
('Project Hydra', 'Internal infrastructure refactor', 'active', 45.5),
('Project Orion', 'Client CRM expansion', 'active', 12.0),
('Project Phoenix', 'Legacy system decommissioning', 'on_hold', 85.0),
('Project Zephyr', 'Cloud migration strategy', 'completed', 100.0),
('Project Titan', 'AI implementation for support', 'active', 30.0);

-- Seed Checklists (Tasks - 5 entries)
-- These should refer to the project IDs, but for the script, we'll reuse names
DO $$ 
DECLARE 
    pid UUID;
    lead_id UUID; -- needs to be valid
BEGIN
    SELECT id INTO pid FROM projects WHERE name = 'Project Hydra' LIMIT 1;
    INSERT INTO checklists (title, project_id, status) VALUES 
    ('Setup CI/CD Pipeline', pid, 'ongoing'),
    ('Write unit tests for Auth', pid, 'not_started');

    SELECT id INTO pid FROM projects WHERE name = 'Project Orion' LIMIT 1;
    INSERT INTO checklists (title, project_id, status) VALUES 
    ('Database schema review', pid, 'completed'),
    ('API documentation update', pid, 'ongoing'),
    ('Client meeting for feedback', pid, 'not_started');
END $$;

-- Seed Revenue (5 entries)
-- Referencing some employee ID handles
-- (In reality, employee_id should match metadata.id)
-- INSERT INTO revenue_records (employee_id, amount, description, date) VALUES ...;

-- Seed Meetings (5 entries)
INSERT INTO meetings (title, scheduled_at, duration_minutes, link) VALUES
('Kickoff: Project Hydra', NOW() + INTERVAL '1 day', 60, 'https://meet.google.com/abc-defg-hij'),
('Weekly Sync: Project Orion', NOW() + INTERVAL '3 days', 45, 'https://meet.google.com/uvw-xyz-123'),
('Leadership Review', NOW() + INTERVAL '5 days', 60, 'https://meet.google.com/mno-pqrs-tuv'),
('Dev Standup', NOW() + INTERVAL '1 hour', 15, 'https://meet.google.com/ghj-klmn-opq'),
('Retrospective: Project Zephyr', NOW() - INTERVAL '2 days', 90, 'https://meet.google.com/xyz-123-abc');

-- Seed Messages (5 entries)
-- Referencing sender/receiver ids
-- INSERT INTO messages (sender_id, receiver_id, subject, body, template_type) VALUES ...;
