import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://papkgiajcnndgvgrusog.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGtnaWFqY25uZGd2Z3J1c29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyODU3NiwiZXhwIjoyMDg4ODA0NTc2fQ.eRvYKKSYwacWpPBmR0WfucGJLWXclBeWDr8mkSJpv_s';

const PROJECT_REF = 'papkgiajcnndgvgrusog';

async function checkFKs() {
  const SQL = `
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'projects';
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log('FKs:', JSON.stringify(data, null, 2));
  } else {
    console.error('Failed:', await res.text());
  }
}

checkFKs();
