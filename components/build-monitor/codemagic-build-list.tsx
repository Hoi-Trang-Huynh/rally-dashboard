"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Smartphone, RefreshCw, QrCode, ChevronLeft, ChevronRight, File, GitBranch, GitCommit, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CodemagicBuild {
    id: string;
    appId: string;
    appName: string;
    status: string;
    branch: string;
    version: string;
    workflow: string;
    started_at: string;
    duration: number;
    artifact?: {
        name: string;
        url: string;
        secureId?: string;
    };
    allArtifacts?: {
        name: string;
        type: string;
        url: string;
        size: number;
    }[];
    commit_hash?: string;
    author_name?: string;
    author_avatar?: string;
    instance_type?: string;
}

export function CodemagicBuildList() {
    const [builds, setBuilds] = useState<CodemagicBuild[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
    const [loadingQr, setLoadingQr] = useState<string | null>(null);

    const fetchData = async (pageNum: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/builds/codemagic?page=${pageNum}&limit=9`);
            if (res.ok) {
                const json = await res.json();
                setBuilds(json.builds || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page]);

    const handleGenerateQr = async (key: string, url: string) => {
        if (!url) return;
        
        // Toggle off if already showing
        if (qrUrls[key]) {
             setQrUrls(prev => {
                 const next = { ...prev };
                 delete next[key];
                 return next;
             });
             return;
        }

        setLoadingQr(key);
        try {
            const res = await fetch("/api/builds/codemagic/public-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artifactUrl: url })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setQrUrls(prev => ({ ...prev, [key]: data.url }));
                }
            }
        } catch (e) {
            console.error("Failed to generate QR", e);
        } finally {
            setLoadingQr(null);
        }
    };

    if (isLoading && builds.length === 0) {
        return <div className="p-8 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {builds.map((build) => (
                    <Card key={build.id} className="overflow-hidden flex flex-col">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-foreground" />
                                        {build.appName || "Rally App"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">{build.workflow}</p>
                                 </div>
                                 {build.status === 'finished' ? 
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : 
                                    (build.status === 'failed' ? <XCircle className="h-5 w-5 text-red-500" /> : <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />)
                                 }
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Branch</p>
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <p className="font-medium truncate" title={build.branch}>{build.branch}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Version</p>
                                    <div className="flex items-center gap-1.5">
                                        <GitCommit className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <p className="font-mono">{build.version || "-"}</p>
                                        {build.commit_hash && <span className="text-xs text-muted-foreground px-1 bg-muted rounded">#{build.commit_hash}</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Triggered By</p>
                                    <div className="flex items-center gap-1.5">
                                        {build.author_avatar ? (
                                            <img src={build.author_avatar} alt={build.author_name} className="h-5 w-5 rounded-full border border-border" />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                {build.author_name?.charAt(0) || "?"}
                                            </div>
                                        )}
                                        <p className="font-medium truncate text-xs">{build.author_name || "System"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Machine</p>
                                    <p className="font-medium truncate text-xs capitalize bg-muted/40 px-2 py-0.5 rounded border border-border/50 inline-block">
                                        {build.instance_type || "Standard"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <p className="font-medium">{build.duration ? `${Math.round(build.duration / 60)}m` : "-"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                                    <p className="font-medium text-xs">{new Date(build.started_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Artifacts</p>
                                {build.allArtifacts && build.allArtifacts.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {build.allArtifacts.map((artifact, i) => {
                                            const isApp = artifact.type === 'apk' || artifact.type === 'ipa' || artifact.name.endsWith('.apk') || artifact.name.endsWith('.ipa');
                                            const key = artifact.url;
                                            return (
                                                <div key={i} className="flex flex-col gap-2 bg-muted/30 p-2 rounded border border-border/50">
                                                    <div className="flex items-center gap-2 justify-between">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="p-1.5 bg-background rounded-md border border-border shadow-sm shrink-0">
                                                                {isApp ? (
                                                                    <Smartphone className="h-3.5 w-3.5 text-foreground" />
                                                                ) : (
                                                                    <File className="h-3.5 w-3.5 text-foreground" />
                                                                )}
                                                            </div>
                                                            <a href={artifact.url} target="_blank" className="text-xs font-medium hover:underline truncate" title={artifact.name}>
                                                                {artifact.name}
                                                            </a>
                                                        </div>
                                                        {isApp && (
                                                            <Button 
                                                                variant={qrUrls[key] ? "secondary" : "ghost"}
                                                                size="icon" 
                                                                className="h-7 w-7 shrink-0"
                                                                onClick={() => handleGenerateQr(key, artifact.url)}
                                                                disabled={loadingQr === key}
                                                                title="Get QR Code"
                                                            >
                                                                {loadingQr === key ? (
                                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <QrCode className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {/* QR Display */}
                                                    {qrUrls[key] && (
                                                        <div className="flex flex-col items-center p-3 bg-white rounded border border-border animate-in fade-in zoom-in duration-200 mt-1">
                                                            <QRCodeSVG value={qrUrls[key]} size={128} />
                                                            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Scan to install</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-2 flex flex-col gap-1">
                                        <span>No artifacts found</span>
                                    </div>
                                )}
                            </div>
                            

                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <div className="text-sm font-medium">Page {page}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={builds.length < 9 || isLoading}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
