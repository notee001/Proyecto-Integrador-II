import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="flex-1 w-full flex flex-col items-center relative">
        {/* Decorative Trees */}
        <div className="absolute left-0 top-0 h-full w-1/4 bg-contain bg-left bg-no-repeat opacity-30" style={{ backgroundImage: "url('/trees-left.png')" }}></div>
        <div className="absolute right-0 top-0 h-full w-1/4 bg-contain bg-right bg-no-repeat opacity-30" style={{ backgroundImage: "url('/trees-right.png')" }}></div>

        <nav className="w-full flex justify-center bg-green-800/10 backdrop-blur-sm h-16 z-10">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5">
            <div className="flex gap-5 items-center">
              <Link href={"/"} className="text-green-800 text-xl font-semibold hover:text-green-700 transition-colors">
                IDEAM
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col justify-center items-center max-w-md p-5 z-10">
          <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-green-100">
            <h1 className="text-3xl font-bold text-green-800 mb-6 text-center">Bienvenido</h1>
            <p className="text-green-600 text-center mb-8">Inicia sesión para continuar</p>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t border-green-200 mx-auto text-center text-sm gap-8 py-8 text-green-700 bg-white/50 backdrop-blur-sm">
        </footer>
      </div>
    </main>
  );
}
