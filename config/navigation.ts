import {
  Figma,
  FileText,
  Database,
  Cloud,
  Flame,
  Trello,
  BookOpen,
  Github,
  Smartphone,
  HardDrive,
  Server,
  Globe,
  type LucideIcon,
} from "lucide-react";

export interface QuickLink {
  title: string;
  description: string;
  url: string;
  iconName: string;
}

export interface LinkCategory {
  title: string;
  description: string;
  links: QuickLink[];
}

// Icon lookup map for client-side rendering
export const iconMap: Record<string, LucideIcon> = {
  Figma,
  FileText,
  Database,
  Cloud,
  Flame,
  Trello,
  BookOpen,
  Github,
  Smartphone,
  HardDrive,
  Server,
  Globe,
};

export const navigationConfig: LinkCategory[] = [
  {
    title: "General",
    description: "Main Rally resources",
    links: [
      {
        title: "Rally Website",
        description: "Main domain website",
        url: "https://www.rally-go.com/",
        iconName: "Globe",
      },
    ],
  },
  {
    title: "Design",
    description: "Design system and wireframes",
    links: [
      {
        title: "Figma Design System",
        description: "Components & styles",
        url: "https://www.figma.com/design/JysAlx123tm6bs6DldkCZN/Rally?t=2H3dMraeNnNDaGEh-0",
        iconName: "Figma",
      },
    ],
  },
  {
    title: "Documentation",
    description: "API docs and architecture",
    links: [
      {
        title: "DBdocs.io",
        description: "Database schema",
        url: "https://dbdocs.io/thanh.ha/Rally",
        iconName: "Database",
      },
      {
        title: "Structurizr",
        description: "C4 diagrams",
        url: "https://c4-struct.rally-go.com/",
        iconName: "BookOpen",
      },
    ],
  },
  {
    title: "Cloud & Infrastructure",
    description: "Infrastructure management",
    links: [
      {
        title: "Backend API",
        description: "Development Environment",
        url: "https://api.rally-go.com/",
        iconName: "Server",
      },
      {
        title: "Build Artifacts (OneDrive)",
        description: "Frontend Builds",
        url: "https://rally294-my.sharepoint.com/shared?id=%2Fsites%2FRally%2FShared%20Documents%2FFrontend%2FBuilds&listurl=https%3A%2F%2Frally294%2Esharepoint%2Ecom%2Fsites%2FRally%2FShared%20Documents",
        iconName: "HardDrive",
      },
      {
        title: "Google Cloud Run",
        description: "Backend services",
        url: "https://console.cloud.google.com/run",
        iconName: "Cloud",
      },
    ],
  },
  {
    title: "Project Management",
    description: "Tickets and documentation",
    links: [
      {
        title: "Jira Board",
        description: "Sprint backlog",
        url: "https://rally-app.atlassian.net/jira",
        iconName: "Trello",
      },
      {
        title: "Confluence",
        description: "Team wiki",
        url: "https://rally-app.atlassian.net/wiki",
        iconName: "BookOpen",
      },
    ],
  },
];

export const buildMonitorConfig = {
  backend: {
    title: "Go API (Backend)",
    description: "GitHub Actions",
    iconName: "Github",
    apiEndpoint: "/api/github/status",
  },
  frontend: {
    title: "Flutter App (Frontend)",
    description: "CodeMagic",
    iconName: "Smartphone",
    apiEndpoint: "/api/codemagic/status",
  },
};
