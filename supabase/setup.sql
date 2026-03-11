-- Create ENUM types for user roles and statuses
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employee', 'project_lead', 'manager', 'unit_head');
    CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold');
    CREATE TYPE task_status AS ENUM ('not_started', 'ongoing', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- users_metadata table (extending auth.users)
CREATE TABLE IF NOT EXISTS users_metadata (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'employee',
    avatar_url TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active',
    completion_percentage NUMERIC DEFAULT 0,
    manager_id UUID REFERENCES users_metadata(id),
    unit_head_id UUID REFERENCES users_metadata(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- project_allocations
CREATE TABLE IF NOT EXISTS project_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    project_lead_id UUID REFERENCES users_metadata(id),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- checklists (tasks)
CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status task_status DEFAULT 'not_started',
    project_lead_id UUID REFERENCES users_metadata(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- checklist_allocations (employee-specific work)
CREATE TABLE IF NOT EXISTS checklist_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users_metadata(id),
    deadline TIMESTAMPTZ,
    role_on_project TEXT,
    status task_status DEFAULT 'not_started',
    difficulty_rating TEXT,
    employee_note TEXT,
    verified BOOLEAN DEFAULT FALSE,
    score_awarded INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- meetings
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    link TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_metadata(id),
    UNIQUE(meeting_id, user_id)
);

-- messages (Mail & Notifications)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users_metadata(id),
    receiver_id UUID REFERENCES users_metadata(id),
    subject TEXT,
    body TEXT,
    template_type TEXT DEFAULT 'custom', -- 'deadline_request', 'resource_request', etc.
    is_notification BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- revenue_records
CREATE TABLE IF NOT EXISTS revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES users_metadata(id),
    amount NUMERIC NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    paycheck_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - Basic Setup (You should refine these policies)
ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Example: Read access for everyone authenticated, update for owners)
-- In a real enterprise app, role-based checks would be much stricter here using functions.

-- Sample Function to check role (for use in policies)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID) 
RETURNS user_role AS $$
  SELECT role FROM users_metadata WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- Example policy: Unit heads can see all projects
-- CREATE POLICY unit_head_see_all ON projects FOR SELECT USING (get_user_role(auth.uid()) = 'unit_head');
