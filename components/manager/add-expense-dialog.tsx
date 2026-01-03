"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useEffect } from "react";
import { Expense } from "@/types";

interface AddExpenseDialogProps {
  onSuccess: () => void;
  tenantUsers?: any[];
  expenseToEdit?: Expense | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PREDEFINED_USERS = ["Bob", "Thanh", "Tuan", "Khue", "Khang", "Chau"];

export function AddExpenseDialog({ onSuccess, tenantUsers = [], expenseToEdit, open: controlledOpen, onOpenChange }: AddExpenseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
  
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState("Service");
  const [payer, setPayer] = useState("Bob");
  const [shares, setShares] = useState<Record<string, string>>({});

  useEffect(() => {
      if (expenseToEdit) {
          setTitle(expenseToEdit.title);
          setAmount(expenseToEdit.amount.toString());
          
          const targetDate = expenseToEdit.date || expenseToEdit.createdAt;
          if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
               setDate(targetDate);
          } else if (targetDate) {
               try {
                  setDate(new Date(targetDate).toISOString().split('T')[0]);
               } catch (e) {
                  console.error("Invalid date in expense:", targetDate);
               }
          }

          setCategory(expenseToEdit.category);
          setShares(Object.entries(expenseToEdit.shares).reduce((acc, [k, v]) => ({ ...acc, [k]: v.toString() }), {}));
          
          if (expenseToEdit.paidBy !== "Split") {
              setPayer(expenseToEdit.paidBy);
          }
      } else if (isOpen) {
          // Reset for new expense
          setTitle("");
          setAmount("");
          setDate(new Date().toISOString().split('T')[0]);
          setCategory("Service");
          setPayer("Bob");
          setShares({});
      }
  }, [expenseToEdit, isOpen]);

  const handleShareChange = (user: string, val: string) => {
      setShares(prev => ({ ...prev, [user]: val }));
  };

  const handleSplitEvenly = () => {
      const amt = parseFloat(amount);
      if (!amt || isNaN(amt)) return;
      const count = PREDEFINED_USERS.length;
      const val = (amt / count).toFixed(0);
      const newShares: Record<string, string> = {};
      PREDEFINED_USERS.forEach(u => newShares[u] = val);
      setShares(newShares);
  };

  const handleAllToPayer = () => {
       const amt = parseFloat(amount);
       if (!amt || isNaN(amt)) return;
       const newShares: Record<string, string> = { [payer]: amt.toString() };
       PREDEFINED_USERS.forEach(u => {
           if (u !== payer) newShares[u] = "0";
       });
       setShares(newShares);
  };

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
    const user = tenantUsers?.find(u => u.email?.toLowerCase().includes(key));
    return user ? `/api/users/${user.id}/avatar` : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        let finalShares: Record<string, number> = {};
        
        let hasShares = false;
        Object.entries(shares).forEach(([user, val]) => {
            const num = parseFloat(val);
            if (num > 0) {
                finalShares[user] = num;
                hasShares = true;
            }
        });

        // Backup: If no shares defined, assume Payer paid for THEMSELVES (100%)
        if (!hasShares) {
             finalShares[payer] = parseFloat(amount);
        }

        const payload = {
            title,
            amount: parseFloat(amount),
            date,
            category,
            shares: finalShares,
            paidBy: payer, 
            ...(expenseToEdit ? { _id: expenseToEdit._id } : {})
        };
        
        const method = expenseToEdit ? "PUT" : "POST";
        const res = await fetch("/api/manager/budget", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsOpen(false);
            onSuccess();
            if (!expenseToEdit) {
                 setTitle("");
                 setAmount("");
                 setShares({});
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* ... trigger ... */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expenseToEdit ? "Edit Expense" : "Add New Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
             {/* ... Inputs for Title/Amount/Date/Category same as before ... */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Item Name</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. AWS Bill" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount (VND)</Label>
                    <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="1000000" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={!!expenseToEdit} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Personnel">Personnel</SelectItem>
                            <SelectItem value="Trip">Trip</SelectItem>
                            <SelectItem value="Device">Device</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Always Show Payer */}
            <div className="space-y-2">
                <Label>Paid By</Label>
                <Select value={payer} onValueChange={setPayer}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PREDEFINED_USERS.map(u => {
                            const avatarUrl = getUserAvatar(u);
                            return (
                                <SelectItem key={u} value={u}>
                                    <div className="flex items-center gap-2">
                                        {avatarUrl && <Avatar className="h-5 w-5"><AvatarImage src={avatarUrl} /></Avatar>}
                                        {u}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Always Show Shares */}
             <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Share Distribution
                    </Label>
                    <div className="flex gap-2">
                         <Button type="button" variant="ghost" size="sm" onClick={handleAllToPayer} className="h-6 px-2 text-[10px]">All to Payer</Button>
                         <Button type="button" variant="ghost" size="sm" onClick={handleSplitEvenly} className="h-6 px-2 text-[10px]">Split Evenly</Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                    {PREDEFINED_USERS.map(user => {
                        const avatarUrl = getUserAvatar(user);
                        return (
                            <div key={user} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 w-20">
                                     {avatarUrl ? (
                                         <Avatar className="h-6 w-6"><AvatarImage src={avatarUrl} /></Avatar> 
                                     ) : <div className="h-6 w-6" />}
                                    <span className="text-sm truncate" title={user}>{user}</span>
                                </div>
                                <Input 
                                    type="number" 
                                    placeholder="0"
                                    className="h-8 text-xs flex-1"
                                    value={shares[user] || ""}
                                    onChange={e => handleShareChange(user, e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="text-xs text-right text-muted-foreground mt-1">
                    Total: {Object.values(shares).reduce((a, b) => a + (parseFloat(b) || 0), 0).toLocaleString()} / {amount || 0}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Expense"}</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
