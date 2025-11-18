"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Iniciando proceso de login...");

      // Iniciar sesión
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;
      if (!signInData?.session) throw new Error("No se pudo iniciar sesión");

      const userId = signInData.session.user.id;
      console.log("ID de usuario:", userId);

      // Consultar tipo de usuario
      const { data: userCheck, error: checkError } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("Correo", email)
        .maybeSingle();


      if (checkError) throw checkError;
      if (!userCheck) throw new Error("Usuario no encontrado en el sistema");

      const tipoUsuario = userCheck.tipo?.toLowerCase();
      const token = signInData.session.access_token;

      console.log("Tipo de usuario detectado:", tipoUsuario);

      if (tipoUsuario === "admin") {
        console.log("Redirigiendo a puerto 3001 (admin)...");
        window.location.href = `http://localhost:3001?token=${token}`;
      } else {
        console.log("Redirigiendo a puerto 3002 (usuario)...");
        window.location.href = `http://localhost:3002?token=${token}`;
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }
      setError(
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
          ? (error as { message: string }).message
          : "Error desconocido"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

