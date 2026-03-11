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
   CheckCircle2
} from "lucide-react";
import { cn } from "@/utils/cn";

const mockMails = [
   { id: 1, sender: "James Lead", subject: "Review: CI/CD Pipeline", snippet: "Looks good, but we need to cover the edge cases...", time: "10:30 AM", read: false, isNotification: true },
   { id: 2, sender: "System Notification", subject: "Task Approved", snippet: "Your task 'API Documentation' was verified and you received +100 score.", time: "Yesterday", read: true, isNotification: true },
   { id: 3, sender: "Sarah Manager", subject: "Project Orion Sync", snippet: "Please prepare the slides for tomorrow's sync with the client.", time: "Mon", read: true, isNotification: false },
];

export default function MailPage() {
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
   const [selectedMail, setSelectedMail] = useState(mockMails[0]);
   const [showTemplateSent, setShowTemplateSent] = useState(false);

   const sendTemplateMail = (type: string) => {
      // Mock sending template mail
      setShowTemplateSent(true);
      setTimeout(() => setShowTemplateSent(false), 3000);
   };

   return (
      
         <div className="space-y-6 pb-20">

            {/* Quick Action Templates */}
            <section>
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MailIcon className="h-5 w-5 text-secondary-foreground" />
                  Quick Actions
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <TemplateCard
                     icon={Clock}
                     title="Request Deadline Extension"
                     desc="Draft a mail to your Project Lead asking for more time on a task."
                     onClick={() => sendTemplateMail("deadline")}
                  />
                  <TemplateCard
                     icon={Database}
                     title="Request Resources"
                     desc="Ask for additional server access, API keys, or team help."
                     onClick={() => sendTemplateMail("resources")}
                  />
                  <TemplateCard
                     icon={Send}
                     title="Custom Mail"
                     desc="Draft a standard custom message to a colleague."
                     onClick={() => alert("Open compose modal")}
                  />
               </div>
            </section>

            {showTemplateSent && (
               <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-bold text-sm">Template request sent successfully to your manager!</p>
               </div>
            )}

            {/* Mailbox Interface */}
            <section className="bg-background border rounded-3xl overflow-hidden shadow-sm flex h-[600px] border-secondary/20">
               {/* Sidebar */}
               <div className="w-1/3 border-r flex flex-col bg-muted/10">
                  <div className="p-4 border-b space-y-4">
                     <div className="flex items-center bg-background border px-3 py-2 rounded-xl focus-within:ring-2 ring-secondary-foreground transition-all">
                        <Search className="h-4 w-4 text-muted-foreground mr-2" />
                        <input type="text" placeholder="Search mails..." className="bg-transparent border-none outline-none text-sm w-full" />
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={() => setActiveTab('inbox')}
                           className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors", activeTab === 'inbox' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
                        >
                           Inbox (1)
                        </button>
                        <button
                           onClick={() => setActiveTab('sent')}
                           className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors", activeTab === 'sent' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
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
                              <span className={cn("text-sm truncate font-medium", !mail.read && "font-black")}>{mail.sender}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{mail.time}</span>
                           </div>
                           <p className={cn("text-xs mb-1 truncate", !mail.read ? "font-bold text-foreground" : "text-muted-foreground")}>{mail.subject}</p>
                           <p className="text-[11px] text-muted-foreground truncate">{mail.snippet}</p>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Reading Pane */}
               <div className="flex-1 flex flex-col bg-background">
                  {selectedMail ? (
                     <>
                        <div className="p-6 border-b flex justify-between items-start">
                           <div>
                              <h2 className="text-xl font-bold mb-4">{selectedMail.subject}</h2>
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground border">
                                    {selectedMail.sender[0]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold">{selectedMail.sender}</p>
                                    <p className="text-[11px] text-muted-foreground">To: me</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-2 text-muted-foreground">
                              <span className="text-xs font-medium mr-4 mt-2">{selectedMail.time}</span>
                              <button className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                                 <Reply className="h-4 w-4" />
                              </button>
                              <button className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                                 <MoreVertical className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto text-sm leading-relaxed text-foreground/80">
                           <p>{selectedMail.snippet}  This is where the full body of the email would go. It explains the details required or the context of the notification received regarding the task completions.</p>

                           {selectedMail.isNotification && (
                              <div className="mt-8 p-4 bg-muted/20 border border-muted rounded-xl inline-block">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Automated Alert</p>
                                 <p className="font-medium text-sm">Action required: Please review the updated documentation before proceeding.</p>
                              </div>
                           )}
                        </div>
                     </>
                  ) : (
                     <div className="flex-1 flex items-center justify-center text-muted-foreground font-medium">
                        Select an item to read
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
         className="text-left bg-background border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-secondary-foreground/30 transition-all group"
      >
         <div className="h-10 w-10 rounded-xl bg-muted group-hover:bg-secondary flex items-center justify-center mb-4 transition-colors">
            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-secondary-foreground transition-colors" />
         </div>
         <h4 className="font-bold text-sm mb-2">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </button>
   )
}
