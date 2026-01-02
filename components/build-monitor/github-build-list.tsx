import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, GitBranch, GitCommit, RefreshCw, Github, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { BuildInfo, BuildsResponse } from "@/types";
import { StatusIcon, StatusBadge, DurationBadge, UserAvatar } from "./build-utils";

interface RepoBuilds {
  repo: string;
  total_count?: number;
  runs: BuildInfo[];
  error?: boolean;
}

const ITEMS_PER_PAGE = 5;

export function GithubBuildList() {
  const [data, setData] = useState<RepoBuilds[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRepos, setExpandedRepos] = useState<Record<string, boolean>>({});
  const [repoPages, setRepoPages] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/builds/github");
        if (res.ok) {
            const json: BuildsResponse = await res.json();
            // The API now returns { builds: RepoBuilds[] } which is typed as BuildInfo[] in the generic, 
            // but the route actually returns a structured object for GitHub specifically.
            // Let's cast it properly or update the Type if needed.
            // Actually, my types/builds.ts defines `BuildsResponse { builds: BuildInfo[] }`.
            // But the GitHub route returns `builds: { repo, runs: BuildInfo[] }[]`.
            // While TypeScript might complain, the runtime JSON is what matters.
            // I should update the types/builds.ts or extend it, but for now I'll cast.
            
            const builds = json.builds as unknown as RepoBuilds[] || [];
            setData(builds);
            
            // Initialize all repos as expanded by default
            const expanded: Record<string, boolean> = {};
            const pages: Record<string, number> = {};
            builds.forEach((repo: RepoBuilds) => {
              expanded[repo.repo] = true;
              pages[repo.repo] = 1;
            });
            setExpandedRepos(expanded);
            setRepoPages(pages);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRepo = (repoName: string) => {
    setExpandedRepos(prev => ({
      ...prev,
      [repoName]: !prev[repoName]
    }));
  };

  const setRepoPage = (repoName: string, page: number) => {
    setRepoPages(prev => ({
      ...prev,
      [repoName]: page
    }));
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
       {data.map((repoData) => {
           const isExpanded = expandedRepos[repoData.repo] ?? true;
           const currentPage = repoPages[repoData.repo] ?? 1;
           const totalPages = Math.ceil(repoData.runs.length / ITEMS_PER_PAGE);
           const paginatedRuns = repoData.runs.slice(
             (currentPage - 1) * ITEMS_PER_PAGE,
             currentPage * ITEMS_PER_PAGE
           );

           return (
               <Card key={repoData.repo} className="overflow-hidden border-border">
                   <CardHeader 
                     className="bg-muted/30 border-b border-border py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                     onClick={() => toggleRepo(repoData.repo)}
                   >
                       <div className="flex items-center justify-between">
                           <CardTitle className="flex items-center gap-2 text-base">
                               <Github className="h-5 w-5" />
                               {repoData.repo}
                               <Badge variant="secondary" className="ml-2 font-mono text-xs">
                                   {repoData.total_count ?? repoData.runs.length} builds
                               </Badge>
                           </CardTitle>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                               {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                           </Button>
                       </div>
                   </CardHeader>
                   {isExpanded && (
                       <CardContent className="p-0">
                            <Table className="text-sm">
                                <TableHeader className="bg-muted/20">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px]">Status</TableHead>
                                        <TableHead className="w-[140px]">Author</TableHead>
                                        <TableHead>Branch / Commit</TableHead>
                                        <TableHead className="hidden md:table-cell">Message</TableHead>
                                        <TableHead className="w-[80px]">Duration</TableHead>
                                        <TableHead className="w-[150px] text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRuns.map((run) => (
                                        <TableRow 
                                            key={run.id} 
                                            className="group hover:bg-muted/40 cursor-pointer"
                                            onClick={() => window.open(run.url, '_blank')}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon status={run.normalizedStatus} rawStatus={run.status} conclusion={run.conclusion} />
                                                    <StatusBadge status={run.normalizedStatus} rawStatus={run.conclusion || run.status} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserAvatar name={run.author} avatarUrl={run.authorAvatar} />
                                                    <span className="text-xs font-medium truncate">{run.author || "System"}</span>
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
                                                        {run.commitHash}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <span className="truncate block max-w-[300px] text-muted-foreground group-hover:text-foreground transition-colors" title={run.commitMessage}>
                                                    {run.commitMessage}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <p className="font-medium text-xs"><DurationBadge duration={run.duration} /></p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {repoData.runs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                No builds found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 py-3 border-t border-border bg-muted/10">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); setRepoPage(repoData.repo, currentPage - 1); }} 
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Prev
                                    </Button>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); setRepoPage(repoData.repo, currentPage + 1); }} 
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                       </CardContent>
                   )}
               </Card>
           );
       })}
    </div>
  );
}
