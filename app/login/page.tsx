import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="/rally_logo_light_inverse.png" 
                alt="Rally Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Rally Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to access the dashboard</p>
            </div>
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
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold text-lg shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
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
    </div>
  );
}
