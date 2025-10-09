import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-green-50 to-green-100 relative">
      {/* Decorative Trees */}
      <div className="absolute left-0 top-0 h-full w-1/4 bg-contain bg-left bg-no-repeat opacity-30" style={{ backgroundImage: "url('/trees-left.png')" }}></div>
      <div className="absolute right-0 top-0 h-full w-1/4 bg-contain bg-right bg-no-repeat opacity-30" style={{ backgroundImage: "url('/trees-right.png')" }}></div>
      
      <div className="w-full max-w-sm z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-green-100">
          <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">Actualiza tu contraseña</h1>
          <p className="text-green-600 text-center mb-6">Por favor, ingresa tu nueva contraseña</p>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
