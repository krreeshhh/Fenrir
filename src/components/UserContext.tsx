"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase";

interface UserContextValue {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  score: number;
  userId: string;
  joinedDate: string;
  loading: boolean;
  // Call this after a successful Save Changes to update the cached name
  refreshName: (newName: string) => void;
}

const UserContext = createContext<UserContextValue>({
  fullName: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  score: 0,
  userId: "",
  joinedDate: "",
  loading: true,
  refreshName: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [data, setData] = useState<Omit<UserContextValue, "loading" | "refreshName">>({
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    score: 0,
    userId: "",
    joinedDate: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: meta } = await supabase
      .from("users_metadata")
      .select("full_name, role, score")
      .eq("id", user.id)
      .single();

    const full = meta?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const joined = user.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Unknown";

    setData({
      fullName: full,
      firstName: full.split(" ")[0] || "",
      lastName: full.split(" ").slice(1).join(" ") || "",
      email: user.email || "",
      role: meta?.role || user.user_metadata?.role || "employee",
      score: meta?.score || 0,
      userId: user.id,
      joinedDate: joined,
    });
    setLoading(false);
  };

  const refreshName = (newName: string) => {
    setData(prev => ({
      ...prev,
      fullName: newName,
      firstName: newName.split(" ")[0] || "",
      lastName: newName.split(" ").slice(1).join(" ") || "",
    }));
  };

  return (
    <UserContext.Provider value={{ ...data, loading, refreshName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
