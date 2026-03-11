CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_metadata (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      'Employee'
    ),
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN (new.raw_user_meta_data->>'role') IS NOT NULL AND (new.raw_user_meta_data->>'role') IN ('employee', 'project_lead', 'manager', 'unit_head') 
      THEN (new.raw_user_meta_data->>'role')::user_role
      ELSE 'employee'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update project completion percentage automatically
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS trigger AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    proj_id UUID;
BEGIN
    -- Get the project_id from the checklist/task
    IF TG_OP = 'DELETE' THEN
        proj_id := old.project_id;
    ELSE
        proj_id := new.project_id;
    END IF;

    -- Count tasks
    SELECT COUNT(*) INTO total_tasks FROM checklists WHERE project_id = proj_id;
    SELECT COUNT(*) INTO completed_tasks FROM checklists WHERE project_id = proj_id AND status = 'completed';

    -- Update project progress
    UPDATE projects 
    SET completion_percentage = CASE 
        WHEN total_tasks > 0 THEN (completed_tasks::numeric / total_tasks::numeric) * 100 
        ELSE 0 
    END
    WHERE id = proj_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project progress
DROP TRIGGER IF EXISTS tr_update_project_progress ON checklists;
CREATE TRIGGER tr_update_project_progress
AFTER INSERT OR UPDATE OR DELETE ON checklists
FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Function to handle task verification and awarding scores
CREATE OR REPLACE FUNCTION verify_task_and_score(
    p_allocation_id UUID,
    p_score_to_award INTEGER
)
RETURNS void AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    -- Update the allocation to verified
    UPDATE checklist_allocations 
    SET 
        verified = TRUE, 
        score_awarded = p_score_to_award,
        status = 'completed'
    WHERE id = p_allocation_id
    RETURNING employee_id INTO v_employee_id;

    -- Increment employee total score
    UPDATE users_metadata
    SET score = score + p_score_to_award
    WHERE id = v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
