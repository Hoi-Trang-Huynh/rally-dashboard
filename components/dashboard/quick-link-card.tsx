"use client";

import { ExternalLink, ArrowUpRight } from "lucide-react";
import { iconMap } from "@/config/navigation";

interface QuickLinkCardProps {
  title: string;
  description: string;
  url: string;
  iconName: string;
}

export function QuickLinkCard({
  title,
  description,
  url,
  iconName,
}: QuickLinkCardProps) {
  const Icon = iconMap[iconName] || ExternalLink;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-pink-500/50 hover:bg-card/80 hover:shadow-lg hover:shadow-pink-500/5">
        {/* Gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="relative flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-orange-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-500/25">
            <Icon className="h-5 w-5" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-pink-500 transition-colors">
                {title}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 transition-all duration-300 group-hover:text-pink-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </a>
  );
}
