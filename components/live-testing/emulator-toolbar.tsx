"use client";

import {
  Power,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  RotateCw,
  Smartphone,
  Home,
  ArrowLeft,
  Square,
  MapPin,
  Wifi,
  Battery,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface EmulatorToolbarProps {
  disabled?: boolean;
  onAction?: (action: EmulatorAction) => void;
}

export type EmulatorAction =
  | "power"
  | "restart"
  | "rotate_left"
  | "rotate_right"
  | "home"
  | "back"
  | "recent"
  | "volume_up"
  | "volume_down"
  | "mute"
  | "screenshot"
  | "location"
  | "settings";

interface ToolButton {
  action: EmulatorAction;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "destructive";
}

const NAVIGATION_TOOLS: ToolButton[] = [
  { action: "home", icon: <Home className="h-4 w-4" />, label: "Home" },
  { action: "back", icon: <ArrowLeft className="h-4 w-4" />, label: "Back" },
  { action: "recent", icon: <Square className="h-4 w-4" />, label: "Recent Apps" },
];

const DEVICE_TOOLS: ToolButton[] = [
  { action: "power", icon: <Power className="h-4 w-4" />, label: "Power", variant: "destructive" },
  { action: "restart", icon: <RotateCcw className="h-4 w-4" />, label: "Restart" },
  { action: "rotate_left", icon: <RotateCw className="h-4 w-4 -scale-x-100" />, label: "Rotate Left" },
  { action: "rotate_right", icon: <RotateCw className="h-4 w-4" />, label: "Rotate Right" },
];

const UTILITY_TOOLS: ToolButton[] = [
  { action: "volume_up", icon: <Volume2 className="h-4 w-4" />, label: "Volume Up" },
  { action: "mute", icon: <VolumeX className="h-4 w-4" />, label: "Mute" },
  { action: "screenshot", icon: <Camera className="h-4 w-4" />, label: "Screenshot" },
  { action: "location", icon: <MapPin className="h-4 w-4" />, label: "Set Location" },
  { action: "settings", icon: <Settings className="h-4 w-4" />, label: "Device Settings" },
];

export function EmulatorToolbar({ disabled = true, onAction }: EmulatorToolbarProps) {
  const handleAction = (action: EmulatorAction) => {
    if (onAction && !disabled) {
      onAction(action);
    }
  };

  const renderToolButton = (tool: ToolButton) => (
    <Tooltip key={tool.action}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => handleAction(tool.action)}
          className={cn(
            "h-9 w-9 rounded-lg transition-all",
            tool.variant === "destructive" && "hover:bg-red-500/10 hover:text-red-500",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {tool.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        <p className="text-xs">{tool.label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Device Icon */}
        <div className="p-2 mb-1">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
        </div>

        <Separator className="w-6 mb-1" />

        {/* Navigation Tools */}
        <div className="flex flex-col gap-1">
          {NAVIGATION_TOOLS.map(renderToolButton)}
        </div>

        <Separator className="w-6 my-1" />

        {/* Device Tools */}
        <div className="flex flex-col gap-1">
          {DEVICE_TOOLS.map(renderToolButton)}
        </div>

        <Separator className="w-6 my-1" />

        {/* Utility Tools */}
        <div className="flex flex-col gap-1">
          {UTILITY_TOOLS.map(renderToolButton)}
        </div>

        {/* Status Indicators */}
        <Separator className="w-6 my-1" />
        <div className="flex flex-col gap-2 py-2 text-muted-foreground/50">
          <Wifi className="h-3.5 w-3.5 mx-auto" />
          <Battery className="h-3.5 w-3.5 mx-auto" />
        </div>
      </div>
    </TooltipProvider>
  );
}
