import { 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    Clock, 
    AlertCircle, 
    HelpCircle,
    MinusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BuildStatus } from "@/types";

interface StatusIconProps {
    status?: BuildStatus; // Our normalized status
    rawStatus?: string;   // Original status string for display/tooltip
    conclusion?: string;  // GitHub specific conclusion
    className?: string;
}

export function StatusIcon({ status, rawStatus, className = "h-4 w-4" }: StatusIconProps) {
    if (status === "success") return <CheckCircle2 className={`${className} text-emerald-500`} />;
    if (status === "failed") return <XCircle className={`${className} text-red-500`} />;
    if (status === "running") return <RefreshCw className={`${className} animate-spin text-amber-500`} />;
    if (status === "queued") return <Clock className={`${className} text-blue-500`} />;
    if (status === "canceled") return <MinusCircle className={`${className} text-muted-foreground`} />;
    if (status === "skipped") return <MinusCircle className={`${className} text-muted-foreground`} />;
    
    return <HelpCircle className={`${className} text-muted-foreground`} />;
}

export function StatusBadge({ status, rawStatus }: StatusIconProps) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    if (status === "success") variant = "outline"; // Green not standard, use outline
    if (status === "failed") variant = "destructive";
    if (status === "running") variant = "secondary";
    
    return (
        <Badge variant={variant} className="font-mono text-[10px] h-5 capitalize">
            {rawStatus || status}
        </Badge>
    );
}

export function DurationBadge({ duration }: { duration?: number }) {
    if (duration === undefined || duration === null) return <span className="text-muted-foreground">-</span>;
    return <span>{Math.round(duration / 60)}m</span>;
}

export function UserAvatar({ name, avatarUrl, className = "h-5 w-5" }: { name: string, avatarUrl?: string, className?: string }) {
    if (avatarUrl) {
        return <img src={avatarUrl} alt={name} className={`${className} rounded-full border border-border bg-muted`} />;
    }
    
    return (
        <div className={`${className} rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border`}>
            {name?.charAt(0).toUpperCase() || "?"}
        </div>
    );
}
