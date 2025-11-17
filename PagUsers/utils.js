import { supabase } from "./supabase-client.js";

console.log("Supabase inicializado");


// -------------------------------------------------------
// 1. VERIFICACIÓN GLOBAL DE SESIÓN
// -------------------------------------------------------
async function verificarUsuarioPorToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    // Guardar token recibido de tu backend
    localStorage.setItem("jwt", token);

    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const jwt = localStorage.getItem("jwt");

  // SI NO HAY TOKEN → REDIRIGE
  if (!jwt) return redirigirLogin();

  // Convertir token externo a sesión interna Supabase
  const { error } = await supabase.auth.setSession({
    access_token: jwt,
    refresh_token: jwt
  });

  if (error) return redirigirLogin();

  const userData = await supabase.auth.getUser();

  if (!userData.data.user) return redirigirLogin();

  return true;
}


function redirigirLogin() {
  localStorage.removeItem("jwt");

  // Redirige INMEDIATAMENTE
  window.location.href = "http://localhost:3000/";

  return false;
}

async function verificarUsuarioEnBaseDatos(email) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("Correo", email)
    .single();

  if (error) {
    console.error("Error buscando usuario:", error);
    return null;
  }

  return data;
}


function cerrarSesion() {
  supabase.auth.signOut();
  localStorage.removeItem("jwt");
  window.location.href = "http://localhost:3000/";
}

