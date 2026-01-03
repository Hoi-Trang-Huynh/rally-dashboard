"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, DownloadCloud, Pencil, Trash2, Plus } from "lucide-react";
import { Expense } from "@/types";
import { cn } from "@/lib/utils";
import { AddExpenseDialog } from "@/components/manager/add-expense-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function BudgetView() {
    const [month, setMonth] = useState("08-2025");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const [monthsList, setMonthsList] = useState<{label: string, value: string}[]>([]);
    
    // Edit State
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [tenantUsers, setTenantUsers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Tenant Users
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/users");
                if (res.ok) {
                    const data = await res.json();
                    setTenantUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchUsers();

        // Generate months
        const start = new Date(2025, 6, 1); // July 2025
        const end = new Date();
        end.setFullYear(end.getFullYear() + 1); // 1 year ahead
        
        const list = [];
        let current = new Date(start);
        
        while (current <= end) {
            const monthStr = String(current.getMonth() + 1).padStart(2, '0');
            const yearStr = current.getFullYear();
            const value = `${monthStr}-${yearStr}`;
            const label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            list.push({ label, value });
            current.setMonth(current.getMonth() + 1);
        }
        
        list.unshift({ label: "All Time", value: "all" });
        setMonthsList(list);
    }, []);

    const fetchBudget = async () => {
        setIsLoading(true);
        try {
            const url = month === "all" ? "/api/manager/budget" : `/api/manager/budget?month=${month}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Failed to fetch budget", error);
        } finally {
            setIsLoading(false);
        }
    };

    const runMigration = async () => {
        if (!confirm("This will migrate data from CSV files on the server. Continue?")) return;
        setIsMigrating(true);
        try {
            const res = await fetch("/api/manager/budget/migrate", { method: "POST" });
            const data = await res.json();
            alert(`Migrated ${data.migrated} items!`);
            fetchBudget();
        } catch (e) {
            alert("Migration failed");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            const res = await fetch(`/api/manager/budget?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchBudget();
            } else {
                alert("Failed to delete");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsDialogOpen(true);
    };
    
    const handleAdd = () => {
        setEditingExpense(null);
        setIsDialogOpen(true);
    };

    useEffect(() => {
        fetchBudget();
    }, [month]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // Helper to match user avatar
    const getUserAvatar = (shortName: string) => {
        const map: Record<string, string> = {
            "Bob": "hoang.nguyen",
            "Thanh": "thanh.ha",
            "Tuan": "tuan.bui",
            "Khue": "khue",
            "Khang": "khang",
            "Chau": "chau"
        };
        const key = map[shortName];
        if (!key) return null;
        const user = tenantUsers.find(u => u.email?.toLowerCase().includes(key));
        return user ? `/api/users/${user.id}/avatar` : null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Monthly Expenses</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={runMigration} disabled={isMigrating}>
                            {isMigrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DownloadCloud className="h-4 w-4 mr-2" />}
                            Import CSV
                        </Button>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" /> Add Expense
                        </Button>
                        <AddExpenseDialog 
                            open={isDialogOpen} 
                            onOpenChange={setIsDialogOpen} 
                            onSuccess={fetchBudget} 
                            tenantUsers={tenantUsers} 
                            expenseToEdit={editingExpense} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 w-full">
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border text-sm text-muted-foreground bg-card">
                        <div className="flex w-max space-x-2 p-2">
                            {monthsList.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setMonth(m.value)}
                                    className={cn(
                                        "px-4 py-2 rounded-full transition-all text-sm font-medium",
                                        month === m.value 
                                            ? "bg-foreground text-background shadow-sm ring-1 ring-border" 
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>

            {/* Summary Section */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <div className="text-muted-foreground text-xs">{month}</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary ? formatCurrency(summary.totalCost) : "..."}</div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">User Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary && (
                            <div className="flex flex-wrap gap-6">
                                {Object.entries(summary.contributions).sort((a:any, b:any) => b[1] - a[1]).map(([user, amount]: any) => {
                                    const avatarUrl = getUserAvatar(user);
                                    return (
                                        <div key={user} className="flex flex-col items-center gap-2">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                    <AvatarImage src={avatarUrl || ""} />
                                                    <AvatarFallback>{user.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-[10px] text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                                                    {((amount / summary.totalCost) * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs font-medium">{user}</div>
                                                <div className="text-sm font-bold text-muted-foreground">{formatCurrency(amount)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {month === "all" && expenses.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(expenses.reduce((acc, curr) => { 
                                acc[curr.category] = (acc[curr.category] || 0) + curr.amount; 
                                return acc; 
                            }, {} as Record<string, number>))
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, amt]) => (
                                <div key={cat} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium">{cat}</span>
                                        <span className="text-muted-foreground">{formatCurrency(amt)} ({((amt / (summary?.totalCost || 1)) * 100).toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(amt / (summary?.totalCost || 1)) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <Card className="col-span-1">
                         <CardHeader>
                            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[180px] p-2">
                            {(() => {
                                const totals = expenses.reduce((acc, curr) => {
                                    const m = curr.month || "Unknown";
                                    acc[m] = (acc[m] || 0) + curr.amount;
                                    return acc;
                                }, {} as Record<string, number>);
                                
                                const sorted = Object.entries(totals).sort(([mA], [mB]) => {
                                    const [moA, yA] = mA.split('-').map(Number);
                                    const [moB, yB] = mB.split('-').map(Number);
                                    return (yA - yB) || (moA - moB);
                                });

                                if (sorted.length < 2) {
                                    return <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Not enough data for trend</div>;
                                }

                                const maxVal = Math.max(...sorted.map(([, v]) => v), 1);
                                const data = sorted.map(([m, val]) => ({
                                     label: monthsList.find(x => x.value === m)?.label.split(' ')[0] || m,
                                     val
                                }));

                                const width = 500;
                                const height = 150;
                                const padL = 50; const padR = 15; const padT = 15; const padB = 25;
                                const chartW = width - padL - padR;
                                const chartH = height - padT - padB;

                                const points = data.map((d, i) => {
                                    const x = padL + (i / (data.length - 1)) * chartW;
                                    const y = padT + chartH - (d.val / maxVal) * chartH;
                                    return { x, y, ...d };
                                });

                                let pathD = "";
                                points.forEach((p, i) => {
                                    pathD += `${i === 0 ? "M" : " L"}${p.x},${p.y}`;
                                });

                                return (
                                    <div className="w-full h-full">
                                         <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible text-primary" preserveAspectRatio="none"> 
                                              {/* Grid Lines & Y Labels */}
                                              {[0, 0.5, 1].map(t => {
                                                  const val = maxVal * t;
                                                  const y = padT + chartH - (t * chartH);
                                                  return (
                                                      <g key={t}>
                                                          <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4 4" />
                                                  <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor" className="text-foreground text-[10px] font-medium select-none">
                                                              {val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`}
                                                          </text>
                                                      </g>
                                                  )
                                              })}
                                              
                                              {/* X Axis Labels */}
                                              {points.map((p, i) => (
                                                  <text key={i} x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fill="currentColor" className="text-foreground text-[10px] font-medium select-none">
                                                      {p.label}
                                                  </text>
                                              ))}

                                              {/* Trend Line */}
                                              <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                              
                                              {/* Data Points and Tooltips */}
                                              {points.map((p, i) => (
                                                  <g key={i} className="group">
                                                      <circle cx={p.x} cy={p.y} r="3" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" className="transition-all group-hover:r-5 cursor-pointer" />
                                                      <title>{`${p.label}: ${formatCurrency(p.val)}`}</title>
                                                  </g>
                                              ))}
                                         </svg>
                                    </div>
                                )
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Expenses Table */}
            {month !== "all" && (
            <div className="rounded-md border bg-card">
                 <Table className="table-fixed w-full text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm border-b border-border">
                        <TableRow className="hover:bg-transparent border-0">
                            <TableHead className="w-[200px] pl-6 h-10">Item</TableHead>
                            <TableHead className="w-[150px] h-10">Category</TableHead>
                            <TableHead className="w-[120px] h-10">Date</TableHead>
                            <TableHead className="w-[150px] h-10">Paid By</TableHead>
                            <TableHead className="w-[120px] text-right h-10">Amount</TableHead>
                            <TableHead className="w-auto text-right h-10 pr-8">Shares</TableHead>
                            <TableHead className="w-[80px] text-right h-10 pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No expenses found for this month.
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => {
                                const payerShort = expense.paidBy === "Split" ? "Split" : expense.paidBy;
                                const payerAvatar = getUserAvatar(payerShort);
                                
                                return (
                                    <TableRow key={expense._id?.toString()} className="border-border/50 hover:bg-muted/40 transition-colors">
                                        <TableCell className="pl-6 py-3 font-medium truncate" title={expense.title}>
                                            {expense.title}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="secondary" className="font-normal text-[10px] px-2 py-0 h-5 whitespace-nowrap bg-muted/60 text-muted-foreground border-border">
                                                {expense.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-muted-foreground whitespace-nowrap">
                                            {new Date(expense.date || expense.createdAt || "").toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                {expense.paidBy !== "Split" && payerAvatar && (
                                                    <Avatar className="h-5 w-5"><AvatarImage src={payerAvatar} /></Avatar>
                                                )}
                                                <span className="truncate">{expense.paidBy}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono py-3 font-medium">
                                            {formatCurrency(expense.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground py-3 pr-8">
                                            <div className="flex flex-col items-end gap-1">
                                                {Object.entries(expense.shares).map(([name, val]) => {
                                                    const shareAvatar = getUserAvatar(name);
                                                    return (
                                                        <div key={name} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity" title={name}>
                                                            {shareAvatar ? (
                                                                <Avatar className="h-4 w-4"><AvatarImage src={shareAvatar} /></Avatar>
                                                            ) : (
                                                                <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                                                                    {name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span>{formatCurrency(val)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(expense)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(expense._id?.toString() || "")}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            )}
        </div>
    );
}
