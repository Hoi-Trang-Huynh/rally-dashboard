"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface User {
    id: string;
    name: string;
    email: string;
    jobTitle?: string | null;
    avatarUrl?: string;
    managerId?: string | null;
}

interface OrgChartProps {
    users: User[];
}

// Helper to determine hierarchy level based on job title
const getLevel = (title: string): number => {
    if (!title) return 4;
    const t = title.toLowerCase();
    // Executive Leadership (Level 0)
    if (t.includes("ceo") || t.includes("founder") || t.includes("president")) return 0;
    
    // Senior Leadership / C-Level (Level 1)
    if (t.includes("cto") || t.includes("cpo") || t.includes("chief") || t.includes("vp") || t.includes("director") || t.includes("head")) return 1;
    
    // Management & Leads (Level 2)
    if (t.includes("lead") || t.includes("manager") || t.includes("product owner")) return 2;
    
    // Senior ICs (Level 3)
    if (t.includes("senior")) return 3;
    
    // Members / Associates (Level 4)
    return 4;
};

// Tree structure helper
interface TreeNode {
    user: User;
    children: TreeNode[];
    level: number;
}

const buildTree = (users: User[]): TreeNode[] => {
    // Filter out potential service accounts (no job title or explicitly service-like)
    const validUsers = users.filter(u => u.jobTitle && u.jobTitle.trim() !== "");

    const userMap = new Map<string, TreeNode>();
    const nameMap = new Map<string, string>(); // Name -> ID
    const roots: TreeNode[] = [];

    // Initialize all nodes
    validUsers.forEach(user => {
        userMap.set(user.id, { user, children: [], level: 4 }); // Default to 4
        nameMap.set(user.name, user.id);
    });

    // Hardcoded Hierarchy Overrides (Name -> Manager Name)
    const HierarchyOverrides: Record<string, string> = {
        "Hoang Nguyen": "Ha Thanh",
        "Khang Nguyen": "Ha Thanh",
        "Tuan Bui": "Ha Thanh",
        "Chau Bao": "Tuan Bui", // As per matrix request, defaulting to PM
        "Khue Le": "Hoang Nguyen", // Balancing tree, UI/UX reports to CPO
    };

    // Build relationships
    validUsers.forEach(user => {
        const node = userMap.get(user.id)!;
        let managerId = user.managerId;

        // Check overrides
        if (HierarchyOverrides[user.name]) {
            const managerName = HierarchyOverrides[user.name];
            const overrideId = nameMap.get(managerName);
            if (overrideId) {
                managerId = overrideId;
            }
        }

        if (managerId && userMap.has(managerId)) {
            const parent = userMap.get(managerId)!;
            parent.children.push(node);
        } else {
            // It's a root (no manager found in the set)
            // Use Heuristic to place it
            node.level = getLevel(user.jobTitle || "");
            roots.push(node);
        }
    });

    // Assign levels recursively for children
    const assignLevels = (nodes: TreeNode[], startLevel: number) => {
        nodes.forEach(node => {
            // Only update level if we are traversing (override initial heuristic if it's a child)
            // For children, it's parent.level + 1.
            node.level = startLevel;
            assignLevels(node.children, startLevel + 1);
        });
    };

    // Process roots: Each root starts at its Heuristic Level
    roots.forEach(root => {
        assignLevels(root.children, root.level + 1);
    });
    
    return roots;
};

export function OrgChart({ users }: OrgChartProps) {
    const roots = useMemo(() => buildTree(users), [users]);

    return (
        <div className="w-full overflow-auto p-12 bg-dot-pattern">
            <div className="min-w-max flex justify-center">
                 <div className="flex gap-12">
                    {roots.map(root => (
                        <TreeNodeRenderer key={root.user.id} node={root} />
                    ))}
                 </div>
            </div>
        </div>
    );
}

function TreeNodeRenderer({ node }: { node: TreeNode }) {
    const hasChildren = node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            <NodeContent user={node.user} />

            {hasChildren && (
                <>
                    {/* Vertical Line Down from Parent */}
                    <div className="h-8 w-px bg-border"></div>

                    {/* Children Container */}
                    <div className="flex justify-center relative">
                        {node.children.map((child, index) => {
                            const isFirst = index === 0;
                            const isLast = index === node.children.length - 1;
                            const isOnly = node.children.length === 1;

                            return (
                                <div key={child.user.id} className="flex flex-col items-center relative px-4">
                                    {/* Top Horizontal Connector Lines */}
                                    {!isOnly && (
                                        <>
                                            {/* Line to the Right (for first & middle) */}
                                            <div className={`absolute top-0 right-0 h-px bg-border ${isLast ? 'w-1/2' : 'w-full'} ${isFirst ? 'left-1/2' : 'left-0'}`}></div>
                                        </>
                                    )}

                                    {/* Vertical Line Up to the Horizontal Bus */}
                                    <div className="h-8 w-px bg-border"></div>

                                    {/* The Child Node Itself */}
                                    <TreeNodeRenderer node={child} />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function NodeContent({ user }: { user: User }) {
    // Generate initials
    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="z-10"
        >
            <Card className="w-64 h-52 border-muted-foreground/20 shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2 flex-1 justify-center">
                    <div className="flex flex-col items-center gap-2 w-full">
                        <Avatar className="h-14 w-14 border-2 border-primary/10">
                            <AvatarImage src={`/api/users/${user.id}/avatar`} />
                            <AvatarFallback className="bg-primary/5 text-primary text-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1 w-full">
                            <h3 className="font-semibold text-base leading-tight truncate px-2" title={user.name}>{user.name}</h3>
                            <div className="text-xs text-muted-foreground font-medium line-clamp-3 h-[3.5em] flex items-center justify-center" title={user.jobTitle || "Team Member"}>
                                {user.jobTitle || "Team Member"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

    );
}
