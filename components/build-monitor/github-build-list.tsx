"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, GitBranch, GitCommit, RefreshCw, Github } from "lucide-react";

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string;
  branch: string;
  commit: string;
  message: string;
  author: string;
  url: string;
  updated_at: string;
}

interface RepoBuilds {
  repo: string;
  runs: WorkflowRun[];
  error?: boolean;
}

export function GithubBuildList() {
  const [data, setData] = useState<RepoBuilds[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/builds/github");
        if (res.ok) {
            const json = await res.json();
            setData(json.builds || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
       {data.map((repoData) => (
           <Card key={repoData.repo} className="overflow-hidden border-border">
               <CardHeader className="bg-muted/30 border-b border-border py-4">
                   <CardTitle className="flex items-center gap-2 text-base">
                       <Github className="h-5 w-5" />
                       {repoData.repo}
                   </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                    <Table className="text-sm">
                        <TableHeader className="bg-muted/20">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead>Branch / Commit</TableHead>
                                <TableHead className="hidden md:table-cell">Message</TableHead>
                                <TableHead className="w-[150px] text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {repoData.runs.map((run) => (
                                <TableRow key={run.id} className="group hover:bg-muted/40">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {run.status === "completed" ? (
                                                run.conclusion === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                                            )}
                                            <Badge variant="outline" className="font-mono text-[10px] h-5">
                                                {run.conclusion || run.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                                                {run.branch}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                <GitCommit className="h-3 w-3" />
                                                {run.commit}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="truncate block max-w-[300px] text-muted-foreground group-hover:text-foreground transition-colors" title={run.message}>
                                            {run.message}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {new Date(run.updated_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {repoData.runs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        No builds found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
               </CardContent>
           </Card>
       ))}
    </div>
  );
}
