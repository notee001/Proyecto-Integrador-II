async function cargarDatosUsuarioYConglomerados() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.log("No hay sesión");
      return;
    }

    const emailUsuario = session.user.email;
    console.log("Correo autenticado:", emailUsuario);

    // Buscar el usuario dentro de la tabla
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

    // Cargar conglomerados donde participa en cualquiera de las columnas
    const { data: conglomerados, error: errorConglo } = await supabase
      .from("Conglomerados")
      .select("id, IDCoor, Fecha_Inicio, Descripción, Usuario1, Usuario2, Usuario3, Usuario4")
      .or(
        `Usuario1.eq.${usuario.id},Usuario2.eq.${usuario.id},Usuario3.eq.${usuario.id},Usuario4.eq.${usuario.id}`
      );

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
