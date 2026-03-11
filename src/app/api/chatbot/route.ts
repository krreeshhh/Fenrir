import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message, context } = await req.json();

  // Simple simulated AI logic
  // In a real hackathon, you'd call OpenAI/Anthropic/Gemini here.
  let response = "I'm processing your request. As your system intelligence node, I can help you with project metrics, task allocation, and organizational data.";

  if (message.toLowerCase().includes("task") || message.toLowerCase().includes("checklist")) {
    response = "You have 4 active tasks. I recommend starting with 'Setup CI/CD Pipeline' as it's critical for the Hydra project.";
  } else if (message.toLowerCase().includes("rank") || message.toLowerCase().includes("score")) {
    response = "Your current Impact Score is 1,850, ranking you at #1 globally. Your growth velocity is up 15% this week.";
  } else if (message.toLowerCase().includes("budget") || message.toLowerCase().includes("revenue")) {
    response = "Your unit budget is currently at 92% utilization. There is a pending $12.5k expense node requiring manager authorization.";
  }

  return NextResponse.json({ response });
}
