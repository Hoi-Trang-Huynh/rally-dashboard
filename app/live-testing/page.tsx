import { Smartphone, Settings, Monitor, Play, Loader2, Clock, Zap, Bug, FileText, Share2, WifiOff, Battery, Link } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmulatorToolbar } from "@/components/live-testing/emulator-toolbar";
import { LogPanel } from "@/components/live-testing/log-panel";

export default function LiveTestingPage() {
  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-6 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Live Testing</h1>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 font-semibold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Test Rally on real device emulators via Appetize.io</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          
          {/* Main Workspace Grid - 2 columns */}
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            
            {/* Left Side - Configuration + Session Info */}
            <div className="flex flex-col gap-4">
              {/* Configuration */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/30 opacity-50" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4 text-pink-500" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3 pt-0">
                  {/* Device Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Platform</label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded-lg border-2 border-pink-500/50 bg-pink-500/10 flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-pink-500" />
                        <span className="text-xs font-medium">Android</span>
                      </div>
                      <div className="flex-1 p-2 rounded-lg border border-border bg-muted/30 flex items-center gap-2 opacity-50">
                        <Smartphone className="h-4 w-4 text-slate-400" />
                        <span className="text-xs">iOS</span>
                      </div>
                    </div>
                  </div>

                  {/* Device Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Device</label>
                    <div className="h-8 rounded-md border border-border bg-background/50 px-2 flex items-center text-xs text-muted-foreground">
                      Pixel 7 Pro
                    </div>
                  </div>

                  {/* App Version */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">App Version</label>
                    <div className="h-8 rounded-md border border-border bg-background/50 px-2 flex items-center text-xs text-muted-foreground">
                      v1.2.3 (Build 456)
                    </div>
                  </div>

                  {/* Launch Button */}
                  <button disabled className="w-full h-9 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed mt-1">
                    <Play className="h-3.5 w-3.5" />
                    Launch Emulator
                  </button>
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/30 opacity-50" />
                <CardHeader className="relative py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-pink-500" />
                    Session Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center gap-1">
                      <WifiOff className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-500 font-medium">Not Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Session Time</span>
                    <span className="font-mono text-[10px]">--:--:--</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Battery</span>
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">--%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="relative overflow-hidden flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/30 opacity-50" />
                <CardHeader className="relative py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-pink-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] px-2" disabled>
                      <Bug className="h-3 w-3 mr-1" />
                      Report Bug
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] px-2" disabled>
                      <FileText className="h-3 w-3 mr-1" />
                      Export Logs
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] px-2" disabled>
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] px-2" disabled>
                      <Link className="h-3 w-3 mr-1" />
                      Join Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center - Emulator + Toolbar */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/30 opacity-50" />
              <CardHeader className="relative pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-pink-500" />
                  Device Stream
                </CardTitle>
                <CardDescription>Live emulator view</CardDescription>
              </CardHeader>
              <CardContent className="relative min-h-[520px]">
                <div className="flex items-start gap-4 h-full">
                  {/* Phone Frame */}
                  <div className="flex-1 flex justify-center items-center">
                    <div className="relative w-[300px] aspect-[9/19] rounded-[2.5rem] border-4 border-slate-700 dark:border-slate-600 bg-slate-900 p-2 shadow-2xl">
                      <div className="h-full w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-center p-6">
                        <Loader2 className="h-10 w-10 text-muted-foreground/30 mb-4 animate-pulse" />
                        <p className="text-base text-muted-foreground/50 font-medium">Emulator Preview</p>
                        <p className="text-sm text-muted-foreground/30 mt-1">Configure API key to enable</p>
                      </div>
                      {/* Notch */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full" />
                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
                    </div>
                  </div>

                  {/* Vertical Toolbar */}
                  <div className="shrink-0">
                    <EmulatorToolbar disabled={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Width Log Panel */}
          <LogPanel disabled={true} />

          {/* Features Coming - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What's Coming</CardTitle>
              <CardDescription className="text-xs">Features planned for the Live Testing integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Real Devices", desc: "Test on actual Android & iOS emulators" },
                  { title: "App Versions", desc: "Switch between different builds instantly" },
                  { title: "Debug Tools", desc: "Access logs and debugging features" },
                  { title: "Team Sharing", desc: "Share sessions with team members" },
                ].map((feature) => (
                  <div key={feature.title} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
