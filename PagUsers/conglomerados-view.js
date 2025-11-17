async function cargarDatosUsuarioYConglomerados() {
  try {
    // 1. Obtener sesión activa
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.log("No hay sesión");
      return;
    }

    const emailUsuario = session.user.email;
    console.log("Correo autenticado:", emailUsuario);

    // 2. Buscar usuario por CORREO en tu tabla
    const { data: usuario, error: errorUsuario } = await supabase
      .from("usuarios")
      .select("*")
      .eq("Correo", emailUsuario)
      .single();

    if (errorUsuario || !usuario) {
      console.log("Usuario no existe en la tabla usuarios");
      return;
    }

    console.log("Usuario encontrado:", usuario);

    // 3. Cargar conglomerados usando tu ID interno
    const { data: conglomerados, error: errorConglo } = await supabase
      .from("Conglomerados")
      .select("*")
      .eq("Usuario", usuario.id); // tu ID propio

    if (errorConglo) {
      console.log("Error cargando conglomerados", errorConglo);
      return;
    }

    console.log("Conglomerados del usuario:", conglomerados);

  } catch (e) {
    console.log("Error general:", e);
  }
}


function toggleDescripcion(element) {
  element.classList.toggle('active');
  const descripcion = element.nextElementSibling;
  if (descripcion) {
    descripcion.classList.toggle('active');
  }
}

function mostrarMensajeError(mensaje) {
  const output = document.getElementById('output');
  if (output) {
    output.textContent = mensaje;
    output.style.color = 'red';
  }
}
