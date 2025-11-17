import { supabase } from "./supabase-client.js";


let usuarioVerificado = false;
let usuarioActual = null;


// =====================================================================
// 👇 VERIFICACIÓN AL ABRIR LA PÁGINA
// =====================================================================

document.addEventListener('DOMContentLoaded', async function () {

  // 🚨 PRIMER FILTRO: si NO hay token → REDIRIGE al login (3000)
  const ok = await verificarUsuarioPorToken();
  if (!ok) return; // ya redirigió automáticamente

  console.log('DOM cargado');

  // Solo validar una vez
  if (!usuarioVerificado) {

    // Obtener usuario de supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      mostrarMensajeError("No se pudo obtener el usuario");
      return redirigirLogin();
    }

    // Verificar que exista en tu tabla usuarios
    const usuarioData = await verificarUsuarioEnBaseDatos(user.email);

    if (!usuarioData) {
      mostrarMensajeError("No tienes permiso para acceder. Usuario no registrado.");
      setTimeout(() => {
        cerrarSesion();
      }, 2000);
      return;
    }

    usuarioActual = usuarioData;
    usuarioVerificado = true;

    // Mostrar email
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
      userInfoDiv.textContent = `Bienvenido: ${user.email}`;
    }

    // Cargar datos
    await cargarYMostrarConglomerados(usuarioData.id, user.email);
  }

  // Botón cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm("¿Deseas cerrar sesión?")) {
        cerrarSesion();
      }
    });
  }

});


// =====================================================================
// 👇 VERIFICAR TOKEN EN URL / LOCALSTORAGE
// =====================================================================

async function verificarUsuarioPorToken() {

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // Si viene token en la URL → guardarlo
  if (token) {
    localStorage.setItem("userToken", token);

    // Quitar token de la URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const storedToken = localStorage.getItem("userToken");

  // Si NO hay token → redirigir
  if (!storedToken) return redirigirLogin();

  // Crear sesión interna en Supabase
  const { error } = await supabase.auth.setSession({
    access_token: storedToken,
    refresh_token: storedToken
  });

  if (error) return redirigirLogin();

  const userData = await supabase.auth.getUser();

  if (!userData.data.user) return redirigirLogin();

  return true;
}


async function cargarYMostrarConglomerados(idUsuario, emailUsuario) {
    const grid = document.getElementById("grid");
    const loading = document.getElementById("loading");

    if (!grid) return console.error("No existe el elemento grid en el HTML");

    loading.style.display = "block";
    grid.innerHTML = "";

    // === CONSULTA A SUPABASE ===
    const { data, error } = await supabase
        .from("Conglomerados")
        .select(`
            id,
            IDCoor,
            Fecha_Inicio,
            Descripción,
            Usuario,
            Coordenadas:IDCoor(id, Latitud, Longitud)
        `)
        .eq("Usuario", idUsuario);

    loading.style.display = "none";

    if (error) {
        console.error("Error cargando conglomerados:", error);
        grid.innerHTML = `<p class="empty-message">Error al obtener datos.</p>`;
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = `<p class="empty-message">No tienes conglomerados registrados.</p>`;
        return;
    }

    // === PINTAR TARJETAS ===
    data.forEach(cong => {
        // Extraer datos
        const fecha = cong.Fecha_Inicio
            ? new Date(cong.Fecha_Inicio).toLocaleDateString()
            : "Sin fecha";

        const descripcion = cong["Descripción"] || "Sin descripción";

        const lat = cong.Coordenadas?.Latitud || "N/A";
        const lon = cong.Coordenadas?.Longitud || "N/A";

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <p>${fecha}</p>
            <div class="card-info">ID: ${cong.id}</div>

            <div class="dropdown">Detalles</div>

            <div class="descripcion">
                <p><strong>Dirección:</strong> Lat: ${lat}, Lon: ${lon}</p>
                <p><strong>Descripción:</strong> ${descripcion}</p>
                <p><strong>ID Coordenada:</strong> ${cong.IDCoor}</p>
            </div>
        `;

        // ACTIVAR DROPDOWN
        const dropdown = card.querySelector(".dropdown");
        const descripcionDiv = card.querySelector(".descripcion");

        dropdown.addEventListener("click", () => {
            dropdown.classList.toggle("active");
            descripcionDiv.classList.toggle("active");
        });

        grid.appendChild(card);
    });
}

async function verificarUsuarioEnBaseDatos(email) {
  const { data, error } = await supabase
    .from("usuarios") // ← cambia este nombre si tu tabla es distinta
    .select("*")
    .eq("Correo", email)
    .maybeSingle();

  if (error) {
    console.error("Error verificando usuario en DB:", error);
    return null;
  }

  return data; // null si no existe
}

function mostrarMensajeError(msg) {
  const output = document.getElementById("output");
  if (output) {
    output.textContent = msg;
    output.style.color = "red";
  }
}

function redirigirLogin() {
  localStorage.removeItem("userToken");
  window.location.href = "http://localhost:3000/"; // login principal
  return false;
}

function cerrarSesion() {
  localStorage.removeItem("userToken");
  supabase.auth.signOut();
  window.location.href = "http://localhost:3000/";
}
