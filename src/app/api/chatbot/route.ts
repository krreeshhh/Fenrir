import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || "";

    // 1. Initialize Supabase and Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch User Context Data & System Stats
    let userContext = "User is not logged in.";
    if (user) {
      // Parallel fetch for speed
      const [profileRes, projectStatsRes, revenueRes, userCountRes, messagesRes] = await Promise.all([
        supabase.from('users_metadata').select('*').eq('id', user.id).single(),
        supabase.from('projects').select('completion_percentage, status'),
        supabase.from('revenue_records').select('amount'),
        supabase.from('users_metadata').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('subject, body').eq('receiver_id', user.id).eq('is_read', false).limit(3)
      ]);

      const profile = profileRes.data;
      const role = profile?.role || 'employee';
      const fullName = profile?.full_name || 'Operator';
      
      // Global Stats calculation
      const totalRev = (revenueRes.data || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
      const totalProjects = (projectStatsRes.data || []).length;
      const totalNodes = userCountRes.count || 0;
      const avgPerf = projectStatsRes.data && projectStatsRes.data.length > 0
        ? Math.round(projectStatsRes.data.reduce((sum: number, p: any) => sum + Number(p.completion_percentage || 0), 0) / projectStatsRes.data.length)
        : 0;

      // Unread Notifications summary
      const unreadSync = (messagesRes.data || []).map((m: any) => `- Notify: ${m.subject}`).join('\n');

      let extraDataStr = "";
      
      if (role === 'employee') {
        const { data: checks } = await supabase
          .from('checklist_allocations')
          .select('status, checklists(title, projects(name))')
          .eq('employee_id', user.id);
        
        const summary = (checks || []).map((c: any) => 
          `- Checklist: ${c.checklists?.title} (Project: ${c.checklists?.projects?.name}) | Status: ${c.status}`
        ).join('\n');
        
        extraDataStr = `Assigned Tasks:\n${summary || "No active assignments."}`;
      } else if (role === 'project_lead') {
        const { data: projects } = await supabase
          .from('projects')
          .select('name, status, completion_percentage')
          .eq('project_lead_id', user.id);
        
        const summary = (projects || []).map((p: any) => 
          `- Lead Project: ${p.name} | Status: ${p.status} | Sync: ${p.completion_percentage}%`
        ).join('\n');
        
        extraDataStr = `Portfolio Hub:\n${summary || "No projects assigned."}`;
      } else { // Manager or Unit Head
        const { data: managed } = await supabase
          .from('projects')
          .select('name, status, completion_percentage, manager_id');
        
        const filtered = role === 'manager' ? (managed || []).filter(p => p.manager_id === user.id) : (managed || []);
        const summary = filtered.map((p: any) => 
          `- Strategic Node: ${p.name} | Sync: ${p.completion_percentage}% | Status: ${p.status}`
        ).join('\n');
        
        extraDataStr = `Operational Command:\n${summary || "General oversight mode."}`;
      }

      userContext = `
IDENTITY:
- Name: ${fullName}
- Email: ${profile?.email}
- Role: ${role}
- Impact Score: ${profile?.score || 0}
- Join Date: ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}

GLOBAL SYSTEM STATUS:
- Network Valuation (Total Revenue): $${totalRev.toLocaleString()}
- Strategic Nodes (Total Projects): ${totalProjects}
- Human Resources (Total Nodes): ${totalNodes}
- Portfolio Health (Avg Performance): ${avgPerf}%

RECENT NOTIFICATIONS (UNREAD):
${unreadSync || "No pending notifications."}

ROLE-SPECIFIC STATUS:
${extraDataStr}`;
    }

    // 3. AI Processing
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ 
        response: "Neural Link Pending. Please configure the GEMINI_API_KEY." 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const systemPrompt = `You are "PIVOT", a high-efficiency Operational HQ AI. 
    Your goal: Provide concise, direct, and actionable insights.
    Constraint: Do NOT repeat the USER DATA CONTEXT back to the user unless necessary to answer their specific question. Minimize jargon and fluff.

    USER DATA CONTEXT:
    ${userContext}

    Answer concisely: `;

    const result = await model.generateContent(systemPrompt + message);
    const response = await result.response;
    
    if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
      return NextResponse.json({ 
        response: "Directive restricted by safety protocols." 
      });
    }

    const text = response.text();
    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error("[Chatbot API Error Details]:", error);
    return NextResponse.json({ 
      error: "INTERNAL_ERROR",
      message: error.message,
      response: "Cognitive overload detected. Please repeat your directive." 
    }, { status: 500 });
  }
}
