"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";

interface MeetingCalendarProps {
   meetings: any[];
   selectedDate: Date | null;
   onSelectDate: (date: Date | null) => void;
}

export function MeetingCalendar({ meetings, selectedDate, onSelectDate }: MeetingCalendarProps) {
   const today = new Date();
   const [viewYear, setViewYear] = useState(today.getFullYear());
   const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

   const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
   const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

   const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

   const prevMonth = () => {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
   };

   const nextMonth = () => {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
   };

   const getMeetingCount = (day: number) =>
      meetings.filter(m => {
         const d = new Date(m.scheduled_at);
         return d.getDate() === day && d.getMonth() === viewMonth && d.getFullYear() === viewYear;
      }).length;

   const isToday = (day: number) =>
      today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

   const isSelected = (day: number) =>
      selectedDate?.getDate() === day &&
      selectedDate?.getMonth() === viewMonth &&
      selectedDate?.getFullYear() === viewYear;

   const handleDayClick = (day: number) => {
      const clicked = new Date(viewYear, viewMonth, day);
      if (isSelected(day)) {
         onSelectDate(null); // deselect
      } else {
         onSelectDate(clicked);
      }
   };

   return (
      <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm select-none">
         {/* Month Nav */}
         <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold">{monthName} {viewYear}</h3>
            <div className="flex gap-1">
               <button
                  onClick={prevMonth}
                  className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
               >
                  <ChevronLeft className="h-4 w-4" />
               </button>
               <button
                  onClick={nextMonth}
                  className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
               >
                  <ChevronRight className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Day Labels */}
         <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
               <span key={d} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground py-1">{d}</span>
            ))}
         </div>

         {/* Day Grid */}
         <div className="grid grid-cols-7 gap-0.5">
            {/* Empty leading cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
               <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const count = getMeetingCount(day);
               const today_ = isToday(day);
               const selected = isSelected(day);
               const hasMtg = count > 0;

               return (
                  <button
                     key={day}
                     onClick={() => handleDayClick(day)}
                     className={cn(
                        "relative h-9 w-full flex flex-col items-center justify-center rounded-lg text-[11px] font-bold transition-all",
                        selected
                           ? "bg-accent text-white shadow-md shadow-accent/20"
                           : today_
                              ? "bg-foreground text-background shadow-sm"
                              : hasMtg
                                 ? "bg-accent/10 text-accent hover:bg-accent/20"
                                 : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                     )}
                  >
                     {day}
                     {hasMtg && !selected && (
                        <span className={cn(
                           "absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full",
                           today_ ? "bg-background" : "bg-accent"
                        )} />
                     )}
                     {hasMtg && selected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/60" />
                     )}
                  </button>
               );
            })}
         </div>

         {/* Legend */}
         <div className="mt-4 pt-4 border-t border-secondary flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-accent" /> Meeting
            </span>
            <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-foreground" /> Today
            </span>
            {selectedDate && (
               <button
                  onClick={() => onSelectDate(null)}
                  className="text-accent hover:underline"
               >
                  Clear
               </button>
            )}
         </div>
      </div>
   );
}
