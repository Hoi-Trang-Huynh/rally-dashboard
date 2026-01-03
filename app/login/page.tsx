import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Full Screen Gradient Background */}
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 via-purple-600/20 to-orange-600/30" />
      
      {/* Animated Floating Orbs */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-pink-500/30 rounded-full blur-3xl animate-float-orb" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-orange-500/30 rounded-full blur-3xl animate-float-orb-delayed" />
      <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-3xl animate-float-orb-slow" />

      {/* Floating Particles */}
      <div className="particle" style={{ left: '10%', bottom: '0%', animationDelay: '0s' }} />
      <div className="particle" style={{ left: '20%', bottom: '0%', animationDelay: '2s' }} />
      <div className="particle" style={{ left: '35%', bottom: '0%', animationDelay: '4s' }} />
      <div className="particle" style={{ left: '50%', bottom: '0%', animationDelay: '1s' }} />
      <div className="particle" style={{ left: '50%', bottom: '0%', animationDelay: '1s' }} />
      <div className="particle" style={{ left: '65%', bottom: '0%', animationDelay: '6s' }} />
      <div className="particle" style={{ left: '80%', bottom: '0%', animationDelay: '3s' }} />
      <div className="particle" style={{ left: '90%', bottom: '0%', animationDelay: '5s' }} />
      <div className="particle" style={{ left: '90%', bottom: '0%', animationDelay: '5s' }} />


      {/* Swirling Team Photos */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src="/rally_group_fun_1.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '400px', '--orbit-duration': '35s', animationDelay: '0s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_2.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '400px', '--orbit-duration': '40s', animationDelay: '-8s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_3.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '500px', '--orbit-duration': '45s', animationDelay: '-16s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_4.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '500px', '--orbit-duration': '38s', animationDelay: '-24s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_5.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '500px', '--orbit-duration': '42s', animationDelay: '-32s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_6.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '500px', '--orbit-duration': '50s', animationDelay: '-40s' } as React.CSSProperties}
        />
        <img 
          src="/rally_group_fun_7.png" 
          alt="" 
          className="floating-photo"
          style={{ '--orbit-radius': '250px', '--orbit-duration': '50s', animationDelay: '-40s' } as React.CSSProperties}
        />
      </div>

      {/* Centered Login Card with Glow Pulse */}
      <div className="relative z-10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 flex flex-col items-center gap-6 animate-glow-pulse">
          {/* Logo with Shine Effect */}
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/10 logo-shine-container">
            <img 
              src="/rally_logo_light_inverse.png" 
              alt="Rally Logo" 
              className="h-full w-full object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Rally Dashboard</h1>
            <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
          </div>

          {/* Sign In Form */}
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/" });
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-6 w-6" viewBox="0 0 21 21" fill="currentColor">
                <path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z" />
              </svg>
              Sign in with Microsoft
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Use your organization Microsoft account to sign in.
          </p>
        </div>
      </div>

      {/* Footer: Version & System Status */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-between items-center px-6">
        {/* Version Badge */}
        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <span>v1.0.0</span>
        </div>

        {/* System Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}
