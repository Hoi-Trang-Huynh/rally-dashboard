"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetView } from "@/components/manager/budget-view";
import { 
  Briefcase, 
  Brush, 
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
  assignee: {
    displayName: string;
    avatarUrl?: string | null;
  };
  url: string;
  updated: string;
}

interface Page {
  id: string;
  title: string;
  parent?: string | null;
  url: string;
  updated: string;
  author: {
    displayName: string;
    avatarUrl?: string | null;
  };
}

// Uniform neutral style for all badges
const badgeStyle = "bg-muted text-muted-foreground border-border";

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

        <div className="flex items-center gap-3">
            <button 
                onClick={() => setActiveTab("grooming")}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                    activeTab === "grooming" 
                        ? "border-pink-500/50 bg-background shadow-md shadow-pink-500/10 ring-1 ring-pink-500/20 text-foreground" 
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-background hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/5 hover:text-foreground"
                }`}
            >
                <Brush className={`h-4 w-4 transition-colors ${
                    activeTab === "grooming" ? "text-pink-500" : "group-hover:text-pink-500"
                }`} />
                <span>Grooming</span>
            </button>
            
            <button 
                onClick={() => setActiveTab("budget")}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                    activeTab === "budget" 
                        ? "border-pink-500/50 bg-background shadow-md shadow-pink-500/10 ring-1 ring-pink-500/20 text-foreground" 
                        : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-background hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/5 hover:text-foreground"
                }`}
            >
                <Banknote className={`h-4 w-4 transition-colors ${
                    activeTab === "budget" ? "text-pink-500" : "group-hover:text-pink-500"
                }`} />
                <span>Budget</span>
            </button>
        </div>
      </div>

      {activeTab === "grooming" && (
        <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Ungroomed Tickets */}
            <Card className="flex flex-col overflow-hidden h-full border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border shrink-0 py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 shadow-sm bg-muted text-foreground">
                        <Brush className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold text-foreground">Ungroomed Tickets</CardTitle>
                            {tickets.length > 0 && (
                                <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full">
                                    {tickets.length}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">Items needing estimation or refinement</p>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative flex flex-col min-h-0">
                  <div className="absolute inset-0">
                    <ScrollArea className="h-full w-full">
                        <Table className="table-fixed w-full text-xs">
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm border-b border-border">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="w-[80px] pl-6 h-10">Type</TableHead>
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
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyle} whitespace-nowrap`}>
                                                {ticket.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium py-3 overflow-hidden text-muted-foreground">
                                            <span className="truncate block w-full text-xs" title={ticket.key}>
                                                {ticket.key}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium py-3 overflow-hidden">
                                            <a href={ticket.url} target="_blank" className="hover:underline hover:text-primary truncate block w-full text-foreground" title={ticket.summary}>
                                                {ticket.summary}
                                            </a>
                                        </TableCell>
                                        <TableCell className="py-3 overflow-hidden">
                                            <Badge variant="outline" className={`font-normal text-[10px] px-2 py-0 h-5 whitespace-nowrap ${badgeStyle}`}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap pr-6 py-3">
                                            {ticket.assignee && ticket.assignee.avatarUrl ? (
                                                <img 
                                                    src={ticket.assignee.avatarUrl} 
                                                    alt={ticket.assignee.displayName}
                                                    title={ticket.assignee.displayName}
                                                    className="h-7 w-7 rounded-full ml-auto"
                                                />
                                            ) : (
                                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ml-auto" title={ticket.assignee?.displayName || "Unassigned"}>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{ticket.assignee?.displayName?.charAt(0) || "?"}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                  </div>
              </CardContent>
            </Card>

            {/* Unlabeled Pages */}
            <Card className="flex flex-col overflow-hidden h-full border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border shrink-0 py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 shadow-sm bg-muted text-foreground">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                             <CardTitle className="text-base font-semibold text-foreground">Unlabeled Pages</CardTitle>
                             {pages.length > 0 && (
                                <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pages.length}
                                </span>
                             )}
                        </div>
                        <p className="text-sm text-muted-foreground">Confluence pages missing mandatory labels</p>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative flex flex-col min-h-0">
                  <div className="absolute inset-0">
                    <ScrollArea className="h-full w-full">
                        <Table className="table-fixed w-full text-xs">
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm border-b border-border">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="w-[90px] pl-6 h-10">Type</TableHead>
                                    <TableHead className="w-[110px] h-10">ID</TableHead>
                                    <TableHead className="w-auto h-10">Title</TableHead>
                                    <TableHead className="w-[130px] h-10">Updated</TableHead>
                                    <TableHead className="w-[140px] pr-6 text-right h-10">Author</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map((page: Page) => (
                                    <TableRow key={page.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                                        <TableCell className="pl-6 py-3 overflow-hidden">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeStyle} whitespace-nowrap`}>
                                                Page
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium py-3 overflow-hidden text-muted-foreground">
                                            <span className="truncate block w-full text-xs" title={page.id}>
                                                {page.id}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium py-3 overflow-hidden">
                                             <div className="flex flex-col min-w-0">
                                                {page.parent && (
                                                    <span className="text-[10px] text-muted-foreground truncate mb-0.5 flex items-center gap-1">
                                                        <span className="opacity-70">in</span> {page.parent}
                                                    </span>
                                                )}
                                                <a href={page.url} target="_blank" className="hover:underline hover:text-primary truncate text-foreground" title={page.title}>
                                                    {page.title}
                                                </a>
                                             </div>
                                        </TableCell>
                                        <TableCell className="py-3 overflow-hidden">
                                            <span className="text-xs text-muted-foreground">
                                                {page.updated && new Date(page.updated).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap pr-6 py-3">
                                            {page.author.avatarUrl ? (
                                                <img 
                                                    src={page.author.avatarUrl} 
                                                    alt={page.author.displayName}
                                                    title={page.author.displayName}
                                                    className="h-7 w-7 rounded-full ml-auto"
                                                />
                                            ) : (
                                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ml-auto" title={page.author.displayName}>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{page.author.displayName.charAt(0)}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                  </div>
              </CardContent>
            </Card>
        </div>
      )}

      {activeTab === "budget" && (
         <div className="flex-1 min-h-0 overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <BudgetView />
         </div>
      )}
    </div>
  );
}

