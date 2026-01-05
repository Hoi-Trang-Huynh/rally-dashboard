"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Gift, 
  Plus, 
  CheckCircle2, 
  Hand,
  Loader2,
  ExternalLink,
  Trophy
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BountyItem {
  _id: string;
  title: string;
  description?: string;
  reward: string;
  jiraKey?: string;
  createdBy: {
    userId: string;
    name: string;
    image?: string | null;
  };
  claimedBy?: {
    userId: string;
    name: string;
    image?: string | null;
  };
  rewardedTo?: {
    userId: string;
    name: string;
    image?: string | null;
  };
  status: "open" | "claimed" | "rewarded";
  createdAt: string;
  claimedAt?: string;
  rewardedAt?: string;
}

interface JiraIssue {
  key: string;
  summary: string;
  status?: string;
  statusColor?: string;
  priority?: string;
  issueType?: string;
  issueTypeIcon?: string;
  reporter?: {
    name: string;
    avatar: string;
  } | null;
  assignee?: {
    name: string;
    avatar: string;
  } | null;
}

export function BountyBoardCard() {
  const { data: session } = useSession();
  const [bounties, setBounties] = useState<BountyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [rewardingId, setRewardingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [jiraKey, setJiraKey] = useState("");
  
  // Jira autocomplete
  const [jiraSuggestions, setJiraSuggestions] = useState<JiraIssue[]>([]);
  const [isSearchingJira, setIsSearchingJira] = useState(false);
  const [showJiraSuggestions, setShowJiraSuggestions] = useState(false);

  const fetchBounties = async () => {
    try {
      const response = await fetch("/api/bounties?limit=10");
      if (response.ok) {
        const data = await response.json();
        setBounties(data.bounties || []);
      }
    } catch (err) {
      console.error("Failed to fetch bounties", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
    const interval = setInterval(fetchBounties, 60000);
    return () => clearInterval(interval);
  }, []);

  // Debounced Jira search
  const searchJira = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setJiraSuggestions([]);
      setShowJiraSuggestions(false);
      return;
    }
    
    setIsSearchingJira(true);
    setShowJiraSuggestions(true); // Show dropdown immediately when searching
    try {
      // Prepend RAL- to the query
      const fullKey = `RAL-${query}`;
      const response = await fetch(`/api/jira/search?q=${encodeURIComponent(fullKey)}`);
      console.log("Jira search response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Jira search results:", data);
        setJiraSuggestions(data.issues || []);
      } else {
        console.error("Jira search failed:", response.status);
        setJiraSuggestions([]);
      }
    } catch (err) {
      console.error("Failed to search Jira", err);
      setJiraSuggestions([]);
    } finally {
      setIsSearchingJira(false);
    }
  }, []);

  // Debounce effect for Jira search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchJira(jiraKey);
    }, 300);
    return () => clearTimeout(timer);
  }, [jiraKey, searchJira]);

  const handleSubmit = async () => {
    if (!title.trim() || !reward.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          reward: reward.trim(),
          jiraKey: jiraKey.trim() ? `RAL-${jiraKey.trim()}` : undefined,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setTitle("");
        setDescription("");
        setReward("");
        setJiraKey("");
        fetchBounties();
      }
    } catch (err) {
      console.error("Failed to create bounty", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (bountyId: string) => {
    setClaimingId(bountyId);
    try {
      const response = await fetch(`/api/bounties/${bountyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });

      if (response.ok) {
        fetchBounties();
      }
    } catch (err) {
      console.error("Failed to claim bounty", err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleReward = async (bountyId: string, claimedBy?: BountyItem["claimedBy"]) => {
    setRewardingId(bountyId);
    try {
      const response = await fetch(`/api/bounties/${bountyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reward",
          rewardedTo: claimedBy
        }),
      });

      if (response.ok) {
        fetchBounties();
      }
    } catch (err) {
      console.error("Failed to reward bounty", err);
    } finally {
      setRewardingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Open</span>;
      case "claimed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Claimed</span>;
      case "rewarded":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Rewarded</span>;
      default:
        return null;
    }
  };

  const currentUserId = (session?.user as any)?.id || session?.user?.email;

  return (
    <Card className="border-border shadow-sm bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 h-[450px]">
      <CardHeader className="pb-4 pt-6 px-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">Bounties</CardTitle>
                {bounties.filter(b => b.status === "open").length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {bounties.filter(b => b.status === "open").length}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Social rewards for helping out</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
                <Plus className="h-4 w-4" />
                Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" />
                  Post a Bounty
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">What needs doing?</label>
                  <Input
                    placeholder="Fix the login bug, Review my PR..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Details (optional)</label>
                  <Textarea
                    placeholder="Any additional context..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reward</label>
                    <Input
                      placeholder="Coffee, Beer, Lunch..."
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Jira Key (optional)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-sm text-muted-foreground font-medium">RAL-</span>
                      <Input
                        placeholder="123"
                        value={jiraKey}
                        onChange={(e) => setJiraKey(e.target.value.replace(/\D/g, ''))}
                        onFocus={() => jiraSuggestions.length > 0 && setShowJiraSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowJiraSuggestions(false), 200)}
                        className="pl-12"
                      />
                      {isSearchingJira && (
                        <Loader2 className="h-4 w-4 animate-spin absolute right-3 text-muted-foreground" />
                      )}
                    </div>
                    {/* Jira suggestions dropdown */}
                    {showJiraSuggestions && (
                      <div className="absolute z-50 w-[320px] right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-[280px] overflow-y-auto">
                        {isSearchingJira ? (
                          <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching Jira...
                          </div>
                        ) : jiraSuggestions.length > 0 ? (
                          <div className="divide-y divide-border">
                            {jiraSuggestions.map((issue) => (
                              <button
                                key={issue.key}
                                className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  setJiraKey(issue.key.replace("RAL-", ""));
                                  setShowJiraSuggestions(false);
                                }}
                              >
                                {/* Header row: Key + Status */}
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    {issue.issueTypeIcon && (
                                      <img src={issue.issueTypeIcon} alt={issue.issueType} className="h-4 w-4" />
                                    )}
                                    <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">{issue.key}</span>
                                  </div>
                                  {issue.status && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      issue.statusColor === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                      issue.statusColor === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                      issue.statusColor === "yellow" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    }`}>
                                      {issue.status}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Summary */}
                                <p className="text-xs text-foreground line-clamp-2 mb-2">{issue.summary}</p>
                                
                                {/* Footer: Reporter & Assignee */}
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                  {issue.reporter && (
                                    <div className="flex items-center gap-1">
                                      <img src={issue.reporter.avatar} alt="" className="h-4 w-4 rounded-full" />
                                      <span className="truncate max-w-[80px]">{issue.reporter.name.split(" ")[0]}</span>
                                    </div>
                                  )}
                                  {issue.assignee && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground/50">→</span>
                                      <img src={issue.assignee.avatar} alt="" className="h-4 w-4 rounded-full" />
                                      <span className="truncate max-w-[80px]">{issue.assignee.name.split(" ")[0]}</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground">
                            No issues found for RAL-{jiraKey}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!title.trim() || !reward.trim() || isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Post Bounty
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
          </div>
        ) : bounties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <Gift className="h-8 w-8 mb-3 text-amber-500/30" />
            <p className="font-medium text-foreground text-sm">No bounties yet!</p>
            <p className="text-xs">Post one to get help with a tough task</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {bounties.map((item) => (
              <div key={item._id} className="p-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Reward Badge */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20 text-xl shrink-0">
                    🎁
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                      {getStatusBadge(item.status)}
                    </div>

                    {/* Reward text */}
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">🏆 {item.reward}</p>

                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {/* Creator */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.createdBy.image || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {item.createdBy.name?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{item.createdBy.name.split(" ")[0]}</span>
                      </div>

                      {/* Jira Link */}
                      {item.jiraKey && (
                        <a 
                          href={`https://rallycommunity.atlassian.net/browse/${item.jiraKey}`}
                          target="_blank"
                          className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {item.jiraKey}
                        </a>
                      )}

                      {/* Claimed By */}
                      {item.claimedBy && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Hand className="h-3 w-3" />
                          <span>{item.claimedBy.name.split(" ")[0]}</span>
                        </div>
                      )}

                      {/* Rewarded To */}
                      {item.rewardedTo && (
                        <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                          <Trophy className="h-3 w-3" />
                          <span>{item.rewardedTo.name.split(" ")[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {item.status === "open" && item.createdBy.userId !== currentUserId && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleClaim(item._id)}
                        disabled={claimingId === item._id}
                        className="h-7 text-xs border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        {claimingId === item._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Hand className="h-3 w-3 mr-1" />
                            Claim
                          </>
                        )}
                      </Button>
                    )}
                    {item.status === "claimed" && item.createdBy.userId === currentUserId && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleReward(item._id, item.claimedBy)}
                        disabled={rewardingId === item._id}
                        className="h-7 text-xs border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        {rewardingId === item._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trophy className="h-3 w-3 mr-1" />
                            Reward
                          </>
                        )}
                      </Button>
                    )}
                    {item.status === "rewarded" && (
                      <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
