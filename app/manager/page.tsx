"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  AlertTriangle, 
  FileText,
  Bug,
  CheckSquare, // Task
  Bookmark, // Epic (close enough)
  BookOpen, // Story
  Search, // Research
  PenTool, // Refinement
  HelpCircle, // Default
  Banknote,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Ticket {
  id: string;
  key: string;
  summary: string;
  status: string;
  type: string;
  assignee: string;
  url: string;
  updated: string;
}

interface Page {
  id: string;
  title: string;
  url: string;
  updated: string;
  author: string;
}

const statusColors: Record<string, string> = {
  "To Do": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  "In Progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "Blocked": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  "Review": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  "Done": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
};

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("grooming");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/manager/grooming");
        if (res.status === 401) {
            setError("Access Denied: You do not have permission to view this page.");
            setIsLoading(false);
            return;
        }
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server Error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        setTickets(data.tickets || []);
        setPages(data.pages || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load grooming data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <ShieldAlert className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Manager Access Restricted</h1>
            <p className="text-muted-foreground">{error}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-6 pt-8 pb-6 gap-8 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Briefcase className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manager</h1>
                <p className="text-lg text-muted-foreground">Manage project grooming, budget, and settings</p>
            </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab("grooming")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "grooming" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
                <AlertTriangle className="h-4 w-4" />
                Grooming
            </button>
            <button 
                onClick={() => setActiveTab("budget")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "budget" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Banknote className="h-4 w-4" />
                Budget
            </button>
        </div>
      </div>

      {activeTab === "grooming" && (
        <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Ungroomed Tickets */}
            <Card className="flex flex-col overflow-hidden h-full border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border shrink-0 py-4 px-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Ungroomed Tickets
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono">{tickets.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Missing Desc, AC, Labels, SP, Developer, or Due Date</p>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                 {isLoading ? (
                     <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                 ) : tickets.length === 0 ? (
                     <div className="p-8 text-center text-muted-foreground">No ungroomed tickets found</div>
                 ) : (
                    <ScrollArea className="h-full w-full">
                        <Table className="table-fixed w-full text-xs">
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm border-b border-border">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="w-[90px] pl-6 h-10">Type</TableHead>
                                    <TableHead className="w-[110px] h-10">Key</TableHead>
                                    <TableHead className="w-auto h-10">Summary</TableHead>
                                    <TableHead className="w-[130px] h-10">Status</TableHead>
                                    <TableHead className="w-[140px] pr-6 text-right h-10">Assignee</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket: Ticket) => (
                                    <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                                        <TableCell className="pl-6 py-3 overflow-hidden">
                                            <Badge variant="outline" className="font-normal text-[10px] border-border/50 text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                                                {ticket.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium py-3 overflow-hidden text-muted-foreground">
                                            <a href={ticket.url} target="_blank" className="hover:text-primary transition-colors whitespace-nowrap">
                                                {ticket.key}
                                            </a>
                                        </TableCell>
                                        <TableCell className="py-3 overflow-hidden">
                                            <div className="truncate w-full font-medium text-foreground" title={ticket.summary}>
                                                {ticket.summary}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 overflow-hidden">
                                            <Badge variant="outline" className={`text-[10px] whitespace-nowrap border px-2 py-0.5 h-6 rounded-md font-medium ${statusColors[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground truncate text-right pr-6 py-3">
                                            {ticket.assignee}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 )}
              </CardContent>
            </Card>

            {/* Unlabeled Pages */}
            <Card className="flex flex-col overflow-hidden h-full border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border shrink-0 py-4 px-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Unlabeled Pages
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono">{pages.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Confluence pages with no labels</p>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                 {isLoading ? (
                     <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                 ) : pages.length === 0 ? (
                     <div className="p-8 text-center text-muted-foreground">No unlabeled pages found</div>
                 ) : (
                    <ScrollArea className="h-full w-full">
                        <Table className="table-fixed w-full text-xs">
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm border-b border-border">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="pl-6 w-auto h-10">Title</TableHead>
                                    <TableHead className="w-[140px] h-10">Author</TableHead>
                                    <TableHead className="w-[110px] text-right pr-6 h-10">Updated</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map((page: Page) => (
                                    <TableRow key={page.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                                        <TableCell className="font-medium pl-6 py-3 overflow-hidden">
                                             <a href={page.url} target="_blank" className="hover:underline hover:text-primary flex items-center gap-2.5 group w-full">
                                                <div className="p-1 rounded bg-blue-500/10 text-blue-500">
                                                    <FileText className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="truncate text-foreground" title={page.title}>{page.title}</span>
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground truncate py-3 overflow-hidden">
                                            {page.author}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-right whitespace-nowrap pr-6 py-3">
                                            {page.updated && new Date(page.updated).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 )}
              </CardContent>
            </Card>
        </div>
      )}

      {activeTab === "budget" && (
          <div className="flex flex-col items-center justify-center flex-1 min-h-0 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-xl font-semibold">Budget Management</h2>
              <p className="text-muted-foreground">Financial tracking and planning module coming soon.</p>
          </div>
      )}
    </div>
  );
}
