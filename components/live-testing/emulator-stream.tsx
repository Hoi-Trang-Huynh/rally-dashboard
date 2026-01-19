"use client";

import { useState } from "react";
import { Monitor, Loader2, AlertCircle, RefreshCw, Maximize2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmulatorConfiguration } from "./emulator-config";

type StreamState = "idle" | "loading" | "connected" | "error";

interface EmulatorStreamProps {
  configuration?: EmulatorConfiguration;
  publicKey?: string;
}

export function EmulatorStream({ configuration, publicKey }: EmulatorStreamProps) {
  const [state, setState] = useState<StreamState>("idle");
  const [error, setError] = useState<string | null>(null);

  const isConfigured = !!publicKey;
  const hasConfiguration = !!configuration;

  const handleRetry = () => {
    setError(null);
    setState("loading");
    // Simulate connection attempt
    setTimeout(() => {
      if (!publicKey) {
        setState("error");
        setError("API key not configured");
      }
    }, 1500);
  };

  const handleFullscreen = () => {
    // TODO: Implement fullscreen mode
    console.log("Fullscreen requested");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Monitor className="h-4 w-4 text-white" />
              </div>
              Device Stream
            </CardTitle>
            <CardDescription className="mt-1">
              {hasConfiguration 
                ? `${configuration.platform === "android" ? "Android" : "iOS"} Emulator`
                : "Live emulator view"
              }
            </CardDescription>
          </div>
          {state === "connected" && (
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-4">
        {/* Phone Frame */}
        <div className={cn(
          "relative w-full max-w-[300px] aspect-[9/19] rounded-[2.5rem] border-4 bg-slate-900 p-2 shadow-2xl transition-all duration-300",
          state === "connected" 
            ? "border-pink-500/50 shadow-pink-500/20" 
            : "border-slate-700 dark:border-slate-600"
        )}>
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-10" />
          
          {/* Screen Content */}
          <div className="h-full w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex flex-col items-center justify-center relative">
            {!isConfigured && (
              <div className="text-center p-6 space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-300">Not Configured</p>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                    Add APPETIZE_PUBLIC_KEY to your environment to enable streaming
                  </p>
                </div>
              </div>
            )}

            {isConfigured && state === "idle" && !hasConfiguration && (
              <div className="text-center p-6 space-y-3">
                <Loader2 className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
                <p className="text-xs text-slate-500">Select configuration and launch</p>
              </div>
            )}

            {isConfigured && state === "loading" && (
              <div className="text-center p-6 space-y-3">
                <Loader2 className="h-10 w-10 text-pink-500 mx-auto animate-spin" />
                <p className="text-xs text-pink-400">Connecting to emulator...</p>
              </div>
            )}

            {state === "error" && (
              <div className="text-center p-6 space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-400">Connection Failed</p>
                  <p className="text-xs text-slate-500">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {state === "connected" && (
              <iframe
                src={`https://appetize.io/embed/${publicKey}?device=${configuration?.deviceId}&osVersion=${configuration?.osVersion}`}
                className="absolute inset-0 w-full h-full rounded-[2rem]"
                allow="autoplay; fullscreen"
                title="Appetize.io Emulator"
              />
            )}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
