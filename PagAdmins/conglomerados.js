async function obtenerUsuarios() {
  try {
    console.log('Consultando usuarios no administradores...');
    console.log('Supabase disponible:', !!window.supabaseClient);

    const supabase = window.supabaseClient; 

    if (!supabase) {
      console.error('Supabase no está inicializado');
      return [];
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, Nombre, Correo, tipo')
      .neq('tipo', 'admin');

    if (error) throw error;

    console.log('Usuarios obtenidos:', data);
    return data || [];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    alert('Error al cargar usuarios: ' + error.message);
    return [];
  }
}



async function guardarConglomerado(fechaInicio, descripcion, usuarioId, coordinatesIds) {
  try {
    if (!coordinatesIds || coordinatesIds.length === 0) {
      alert('Por favor selecciona al menos una coordenada');
      return false;
    }

    if (!supabase) {
      console.error('Supabase no inicializado');
      return false;
    }

    console.log('Guardando conglomerado:', { fechaInicio, descripcion, usuarioId, coordinatesIds });

    const { data, error } = await supabase
      .from('Conglomerados')
      .insert([
        {
          Fecha_Inicio: fechaInicio,
          Descripción: descripcion,
          Usuario: usuarioId,
          IDCoor: Number(coordinatesIds[0])
        }
      ]);

    if (error) {
      console.error('Error al guardar conglomerado:', error);
      throw error;
    }
    
    console.log('Conglomerado guardado:', data);
    alert('Conglomerado guardado exitosamente');
    return true;
  } catch (error) {
    console.error('Error al guardar conglomerado:', error);
    alert('Error al guardar conglomerado: ' + error.message);
    return false;
  }
}


async function cargarUsuariosEnSelect() {
  const select = document.getElementById('usuarioSelect');
  
  if (!select) {
    console.error('El elemento usuarioSelect no existe en el DOM');
    return;
  }
  
  // Limpiar opciones previas excepto la primera
  while (select.options.length > 1) {
    select.remove(1);
  }

  const usuarios = await obtenerUsuarios();

  // Agregar los usuarios al select
  usuarios.forEach(usuario => {
    const option = document.createElement('option');
    option.value = usuario.id;
    option.textContent = `${usuario.Nombre || 'Sin nombre'} — ${usuario.Correo || 'Sin correo'}`;
    select.appendChild(option);
  });
  
  console.log(`Se cargaron ${usuarios.length} usuarios no administradores`);
}
