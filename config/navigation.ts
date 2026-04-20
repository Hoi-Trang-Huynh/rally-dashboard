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
  Shield,
  Image,
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
  Shield,
  Image,
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
        title: "Design System",
        description: "Components & styles",
        url: "https://www.figma.com/design/JysAlx123tm6bs6DldkCZN/Rally?t=2H3dMraeNnNDaGEh-0",
        iconName: "Figma",
      },
      {
        title: "UX Process",
        description: "User Experience workflow",
        url: "https://www.figma.com/board/Bl98rLotYNyhg4SmmgNUzD/UX-Process---Rally",
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
        title: "Google Cloud Run",
        description: "Backend services hosting",
        url: "https://console.cloud.google.com/run",
        iconName: "Cloud",
      },
      {
        title: "Cloudflare",
        description: "DNS & CDN management",
        url: "https://dash.cloudflare.com/6737fbba39245953e5c6b491776b4eed/rally-go.com",
        iconName: "Shield",
      },
      {
        title: "MongoDB Atlas",
        description: "Database cluster",
        url: "https://cloud.mongodb.com/v2/68b847951c0b306f9afedeee#/overview",
        iconName: "Database",
      },
      {
        title: "Firebase",
        description: "Auth & backend services",
        url: "https://console.firebase.google.com/u/1/project/rally-go-6/overview?pli=1",
        iconName: "Flame",
      },
      {
        title: "Cloudinary",
        description: "Media storage & delivery",
        url: "https://console.cloudinary.com/app/c-52a532852992713b0c645b4f162485/home/dashboard",
        iconName: "Image",
      },
      {
        title: "Build Artifacts (OneDrive)",
        description: "Frontend builds",
        url: "https://rally294-my.sharepoint.com/shared?id=%2Fsites%2FRally%2FShared%20Documents%2FFrontend%2FBuilds&listurl=https%3A%2F%2Frally294%2Esharepoint%2Ecom%2Fsites%2FRally%2FShared%20Documents",
        iconName: "HardDrive",
      },
    ],
  },
  {
    title: "CI/CD & Source Control",
    description: "Build pipelines and repositories",
    links: [
      {
        title: "GitHub",
        description: "Source code repositories",
        url: "https://github.com/Hoi-Trang-Huynh",
        iconName: "Github",
      },
      {
        title: "Codemagic",
        description: "CI/CD for Flutter",
        url: "https://codemagic.io/builds?app_id=68b8665fe6fd5d559045c22d",
        iconName: "Smartphone",
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
