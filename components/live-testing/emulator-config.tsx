"use client";

import { useState } from "react";
import { Smartphone, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DevicePlatform = "android" | "ios";

interface DeviceModel {
  id: string;
  name: string;
  osVersions: string[];
}

const ANDROID_DEVICES: DeviceModel[] = [
  { id: "pixel7pro", name: "Pixel 7 Pro", osVersions: ["14", "13", "12"] },
  { id: "pixel6", name: "Pixel 6", osVersions: ["14", "13", "12", "11"] },
  { id: "samsungs23", name: "Samsung Galaxy S23", osVersions: ["14", "13"] },
  { id: "samsungs21", name: "Samsung Galaxy S21", osVersions: ["13", "12", "11"] },
];

const IOS_DEVICES: DeviceModel[] = [
  { id: "iphone15pro", name: "iPhone 15 Pro", osVersions: ["17.0", "17.1"] },
  { id: "iphone14", name: "iPhone 14", osVersions: ["17.0", "16.0", "15.0"] },
  { id: "iphone13", name: "iPhone 13", osVersions: ["17.0", "16.0", "15.0"] },
  { id: "ipadpro", name: "iPad Pro 12.9\"", osVersions: ["17.0", "16.0"] },
];

const APP_VERSIONS = [
  { id: "latest", name: "Latest (v1.3.0 - Build 512)" },
  { id: "v1.2.3", name: "v1.2.3 (Build 489)" },
  { id: "v1.2.0", name: "v1.2.0 (Build 456)" },
  { id: "v1.1.0", name: "v1.1.0 (Build 401)" },
];

interface EmulatorConfigProps {
  onLaunch?: (config: EmulatorConfiguration) => void;
  disabled?: boolean;
}

export interface EmulatorConfiguration {
  platform: DevicePlatform;
  deviceId: string;
  osVersion: string;
  appVersion: string;
}

export function EmulatorConfig({ onLaunch, disabled = true }: EmulatorConfigProps) {
  const [platform, setPlatform] = useState<DevicePlatform>("android");
  const [deviceId, setDeviceId] = useState<string>("");
  const [osVersion, setOsVersion] = useState<string>("");
  const [appVersion, setAppVersion] = useState<string>("latest");
  const [isLaunching, setIsLaunching] = useState(false);

  const devices = platform === "android" ? ANDROID_DEVICES : IOS_DEVICES;
  const selectedDevice = devices.find((d) => d.id === deviceId);

  const handlePlatformChange = (newPlatform: DevicePlatform) => {
    setPlatform(newPlatform);
    setDeviceId("");
    setOsVersion("");
  };

  const handleDeviceChange = (newDeviceId: string) => {
    setDeviceId(newDeviceId);
    const device = devices.find((d) => d.id === newDeviceId);
    if (device && device.osVersions.length > 0) {
      setOsVersion(device.osVersions[0]);
    }
  };

  const handleLaunch = async () => {
    if (!deviceId || !osVersion || !appVersion || !onLaunch) return;
    
    setIsLaunching(true);
    try {
      await onLaunch({
        platform,
        deviceId,
        osVersion,
        appVersion,
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const canLaunch = deviceId && osVersion && appVersion && !disabled;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Smartphone className="h-4 w-4 text-white" />
          </div>
          Configuration
        </CardTitle>
        <CardDescription>Select device and app version to test</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Device Platform</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handlePlatformChange("android")}
              disabled={disabled}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
                platform === "android"
                  ? "border-pink-500 bg-pink-500/10 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 bg-muted/20",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                platform === "android" ? "bg-pink-500/20" : "bg-muted"
              )}>
                <Smartphone className={cn(
                  "h-5 w-5",
                  platform === "android" ? "text-pink-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Android</p>
                <p className="text-xs text-muted-foreground">Pixel, Samsung</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handlePlatformChange("ios")}
              disabled={disabled}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
                platform === "ios"
                  ? "border-slate-400 bg-slate-500/10 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 bg-muted/20",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                platform === "ios" ? "bg-slate-500/20" : "bg-muted"
              )}>
                <Smartphone className={cn(
                  "h-5 w-5",
                  platform === "ios" ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">iOS</p>
                <p className="text-xs text-muted-foreground">iPhone, iPad</p>
              </div>
            </button>
          </div>
        </div>

        {/* Device Model */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Device Model</label>
          <Select value={deviceId} onValueChange={handleDeviceChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select a device..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* OS Version */}
        <div className="space-y-2">
          <label className="text-sm font-medium">OS Version</label>
          <Select 
            value={osVersion} 
            onValueChange={setOsVersion} 
            disabled={disabled || !selectedDevice}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedDevice ? "Select version..." : "Select device first"} />
            </SelectTrigger>
            <SelectContent>
              {selectedDevice?.osVersions.map((version) => (
                <SelectItem key={version} value={version}>
                  {platform === "android" ? `Android ${version}` : `iOS ${version}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* App Version */}
        <div className="space-y-2">
          <label className="text-sm font-medium">App Version</label>
          <Select value={appVersion} onValueChange={setAppVersion} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select app version..." />
            </SelectTrigger>
            <SelectContent>
              {APP_VERSIONS.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  {version.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Launch Button */}
        <Button
          onClick={handleLaunch}
          disabled={!canLaunch || isLaunching}
          className="w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium shadow-lg shadow-pink-500/20"
        >
          {isLaunching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Launch Emulator
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
