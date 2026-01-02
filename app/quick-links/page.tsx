"use client";

import { QuickLinkCard } from "@/components/dashboard/quick-link-card";
import { navigationConfig } from "@/config/navigation";
import { Bookmark, Search } from "lucide-react";
import { useState } from "react";

export default function QuickLinksPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all links for search
  const allLinks = navigationConfig.flatMap(cat => 
    cat.links.map(link => ({ ...link, category: cat.title }))
  );

  // Filter links based on search
  const filteredCategories = searchQuery 
    ? [{
        title: "Search Results",
        links: allLinks.filter(link => 
          link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }]
    : navigationConfig;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-6 pt-8 pb-6 gap-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/20">
            <Bookmark className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Quick Links</h1>
            <p className="text-lg text-muted-foreground">Access all team resources and tools</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8 flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        {filteredCategories.map((category) => (
          <div key={category.title}>
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-1 rounded-full bg-pink-500" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {category.title}
              </h2>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground/70">{category.links.length} links</span>
            </div>
            
            {/* Links Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.links.map((link) => (
                <QuickLinkCard
                  key={link.title}
                  title={link.title}
                  description={link.description}
                  url={link.url}
                  iconName={link.iconName}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {searchQuery && filteredCategories[0]?.links.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No links found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
