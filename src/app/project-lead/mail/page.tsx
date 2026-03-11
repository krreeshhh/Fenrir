"use client"

import { useState } from "react";
import { 
  Mail as MailIcon, 
  Send, 
  Clock, 
  Database,
  Search,
  MoreVertical,
  Reply,
  CheckCircle2,
  Users
} from "lucide-react";
import { cn } from "@/utils/cn";

const mockMails = [
  { id: 1, sender: "Sarah Manager", subject: "Budget Approval: Project Hydra", snippet: "The requested budget for Q2 has been approved...", time: "09:30 AM", read: false, isNotification: false },
  { id: 2, sender: "Katherine Head", subject: "Unit Review Meeting", snippet: "Please prepare the unit efficiency reports for Monday.", time: "Yesterday", read: true, isNotification: true },
  { id: 3, sender: "James Lead", subject: "Resource Request: Orion", snippet: "I need 2 more frontend devs for the next sprint.", time: "Mon", read: true, isNotification: false },
];

export default function ProjectLeadMailPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMail, setSelectedMail] = useState(mockMails[0]);
  const [showTemplateSent, setShowTemplateSent] = useState(false);

  const sendTemplateMail = (type: string) => {
    setShowTemplateSent(true);
    setTimeout(() => setShowTemplateSent(false), 3000);
  };

  return (
    
      <div className="space-y-6 pb-20">
        
        {/* Resource Allocation Templates */}
        <section>
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-foreground" />
              Lead Actions
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <TemplateCard 
                icon={Database} 
                title="Request Budget" 
                desc="Send a formalized budget request to your Manager."
                onClick={() => sendTemplateMail("budget")}
              />
              <TemplateCard 
                icon={Users} 
                title="Personnel Shift" 
                desc="Request to move an employee to a different task/project."
                onClick={() => sendTemplateMail("personnel")}
              />
              <TemplateCard 
                icon={Clock} 
                title="Sprint Delay Alert" 
                desc="Notify stakeholders about a delay in the current milestone."
                onClick={() => sendTemplateMail("delay")}
              />
              <TemplateCard 
                icon={Send} 
                title="Assign Task" 
                desc="Compose an assignment notification for a team member."
                onClick={() => alert("Open compose")}
              />
           </div>
        </section>

        {showTemplateSent && (
           <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-bold text-sm">Action request dispatched to the reporting node!</p>
           </div>
        )}

        <section className="bg-background border rounded-3xl overflow-hidden shadow-sm flex h-[600px] border-secondary/10">
           {/* Sidebar */}
           <div className="w-1/3 border-r flex flex-col bg-muted/10">
              <div className="p-4 border-b space-y-4">
                 <div className="flex items-center bg-background border px-3 py-2 rounded-xl focus-within:ring-2 ring-secondary-foreground transition-all">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <input type="text" placeholder="Search commands..." className="bg-transparent border-none outline-none text-sm w-full font-bold" />
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('inbox')}
                      className={cn("flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm", activeTab === 'inbox' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
                    >
                      Inbox (1)
                    </button>
                    <button 
                      onClick={() => setActiveTab('sent')}
                      className={cn("flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors", activeTab === 'sent' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
                    >
                      Sent
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y">
                 {mockMails.map((mail) => (
                    <button 
                      key={mail.id} 
                      onClick={() => setSelectedMail(mail)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-muted/50 transition-all border-l-4",
                        selectedMail.id === mail.id ? "border-l-secondary-foreground bg-secondary/10" : "border-l-transparent",
                        !mail.read ? "bg-background" : "bg-transparent opacity-80"
                      )}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <span className={cn("text-xs truncate font-bold uppercase tracking-tight", !mail.read && "text-secondary-foreground")}>{mail.sender}</span>
                          <span className="text-[10px] font-black text-muted-foreground">{mail.time}</span>
                       </div>
                       <p className={cn("text-sm mb-1 truncate font-black", !mail.read ? "text-foreground" : "text-muted-foreground")}>{mail.subject}</p>
                       <p className="text-[11px] text-muted-foreground truncate">{mail.snippet}</p>
                    </button>
                 ))}
              </div>
           </div>

           {/* Reading Pane */}
           <div className="flex-1 flex flex-col bg-background">
              {selectedMail ? (
                <>
                  <div className="p-8 border-b flex justify-between items-start">
                     <div>
                        <h2 className="text-2xl font-black tracking-tighter mb-4">{selectedMail.subject}</h2>
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-secondary-foreground border shadow-sm">
                              {selectedMail.sender[0]}
                           </div>
                           <div>
                              <p className="text-lg font-black">{selectedMail.sender}</p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Operational Lead Node</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="h-10 w-10 rounded-xl hover:bg-muted border flex items-center justify-center transition-colors">
                           <Reply className="h-5 w-5" />
                        </button>
                        <button className="h-10 w-10 rounded-xl hover:bg-muted border flex items-center justify-center transition-colors">
                           <MoreVertical className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto text-base leading-relaxed text-foreground/80 font-medium">
                     <p className="mb-6">{selectedMail.snippet}</p>
                     <p>This is a simulated secure message body for the ERP system. Project Leads can use this interface to communicate with Managers regarding resource shifts or budget reallocations across their active projects.</p>
                     
                     {selectedMail.isNotification && (
                        <div className="mt-12 p-6 bg-secondary-foreground/5 border-2 border-secondary-foreground/10 rounded-[32px] relative overflow-hidden group">
                           <div className="absolute -top-4 -right-4 h-16 w-16 bg-secondary-foreground/5 rounded-full group-hover:scale-150 transition-transform"></div>
                           <p className="text-[10px] font-black text-secondary-foreground uppercase tracking-[0.2em] mb-3">System Directive</p>
                           <p className="font-bold text-base leading-snug">Action Required: Validate the Q2 milestone completions before the end of this operational cycle.</p>
                        </div>
                     )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-bold">
                   Command node idle. Select a message.
                </div>
              )}
           </div>
        </section>

      </div>
    
  );
}

function TemplateCard({ icon: Icon, title, desc, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className="text-left bg-background border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary-foreground/30 transition-all group"
      >
         <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-secondary flex items-center justify-center mb-4 transition-colors">
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-secondary-foreground transition-colors" />
         </div>
         <h4 className="font-bold text-sm mb-2">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold uppercase tracking-tight">{desc}</p>
      </button>
   )
}

