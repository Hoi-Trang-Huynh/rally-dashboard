"use client";

import { useEffect, useState } from "react";
import { OrgChart } from "@/components/team/org-chart";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    avatarUrl?: string;
    managerId?: string | null;
}

export default function TeamPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] px-6 pt-8 pb-6 gap-8 overflow-hidden">
             <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                        <Users className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Organization</h1>
                        <p className="text-lg text-muted-foreground">Overview of the team structure and hierarchy.</p>
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                     {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                     Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-auto min-h-0 relative">
                 {/* Background pattern */}
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                 
                 {loading && users.length === 0 ? (
                     <div className="flex items-center justify-center h-full">
                         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                     </div>
                 ) : (
                     <OrgChart users={users} />
                 )}
            </div>
        </div>
    );
}
