export type BuildStatus = 
  | "success" 
  | "failed" 
  | "canceled" 
  | "running" 
  | "queued" 
  | "skipped" 
  | "unknown";

export interface BuildArtifact {
  name: string;
  type?: string;
  url: string;
  size?: number;
}

export interface BuildInfo {
  id: string | number;
  appId?: string; // Codemagic specific
  appName: string; // or Repo name for GitHub
  
  // Status & Timing
  status: string; // Raw status from provider
  conclusion?: string; // GitHub specific
  normalizedStatus?: BuildStatus; // For consistent UI
  
  // Git Info
  branch: string;
  version?: string; // Tag or version
  commitHash?: string;
  commitMessage?: string;
  
  // User Info
  author: string;
  authorAvatar?: string;
  startedBy?: string; // Triggered by
  
  // Links
  url?: string; // Link to build page
  
  // Timing
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number; // in seconds
  
  // Metadata
  workflow?: string;
  instanceType?: string;
  
  // Artifacts
  mainArtifact?: BuildArtifact; // e.g. APK/IPA
  artifacts?: BuildArtifact[];
}

export interface BuildsResponse {
  builds: BuildInfo[];
  pagination?: {
    page: number;
    limit: number;
    total?: number;
  };
  error?: string;
}
