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



async function guardarConglomerado(fechaInicio, descripcion, usuarios, coordinatesIds) {
  try {
    if (!coordinatesIds || coordinatesIds.length === 0) {
      alert('Por favor selecciona al menos una coordenada');
      return false;
    }

    if (!supabase) {
      console.error('Supabase no inicializado');
      return false;
    }

    console.log('Guardando conglomerado:', { fechaInicio, descripcion, usuarios, coordinatesIds });

    const { data, error } = await supabase
      .from('Conglomerados')
      .insert([
        {
          Fecha_Inicio: fechaInicio,
          Descripción: descripcion,
          Usuario1: usuarios[0],
          Usuario2: usuarios[1],
          Usuario3: usuarios[2],
          Usuario4: usuarios[3],
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

// Obtener usuarios disponibles filtrados por rol, distancia y disponibilidad
async function obtenerUsuariosDisponibles(rolRequired, latitudConglo, longitudConglo, fechaConglo) {
  try {
    console.log(`Obteniendo usuarios disponibles para rol: ${rolRequired}`);

    if (!supabase) {
      console.error('Supabase no está inicializado');
      return [];
    }

    // Obtener usuarios con el rol especificado
    const { data: usuariosConRol, error: errorRol } = await supabase
      .from('Rol')
      .select('Correo')
      .eq('Tipo', rolRequired);

    if (errorRol) {
      console.error('Error al obtener usuarios con rol:', errorRol);
      return [];
    }

    if (!usuariosConRol || usuariosConRol.length === 0) {
      console.warn('No hay usuarios con rol:', rolRequired);
      return [];
    }

    const correosConRol = [...new Set(usuariosConRol.map(u => u.Correo))];
    console.log(`Usuarios con rol ${rolRequired}:`, correosConRol);

    // Obtener datos completos de usuarios
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, Correo, Nombre, Latitud, Longitud')
      .in('Correo', correosConRol);

    if (errorUsuarios) {
      console.error('Error al obtener usuarios:', errorUsuarios);
      return [];
    }

    // Filtrar por disponibilidad (no tener conglomerado en la semana)
    const usuariosDisponibles = [];
    
    for (const usuario of usuarios) {
      const disponible = await verificarDisponibilidadUsuario(usuario.Correo, fechaConglo);
      
      if (disponible) {
        // Calcular distancia
        const distancia = calcularDistancia(latitudConglo, longitudConglo, usuario.Latitud, usuario.Longitud);
        usuariosDisponibles.push({
          ...usuario,
          distancia: distancia
        });
      }
    }

    // Ordenar por distancia (cercanos primero)
    usuariosDisponibles.sort((a, b) => a.distancia - b.distancia);
    
    console.log('Usuarios disponibles ordenados por distancia:', usuariosDisponibles);
    return usuariosDisponibles;
  } catch (error) {
    console.error('Error al obtener usuarios disponibles:', error);
    return [];
  }
}

// Verificar si el usuario está disponible (sin conglomerado en la semana)
async function verificarDisponibilidadUsuario(correoUsuario, fechaNueva) {
  try {
    const { data: usuario, error: errorBuscarUsuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('Correo', correoUsuario)
      .maybeSingle();

    if (errorBuscarUsuario || !usuario) {
      return false;
    }

    const { data: conglomerados, error: errorConglo } = await supabase
      .from('Conglomerados')
      .select('Fecha_Inicio')
      .or(`Usuario1.eq.${usuario.id},Usuario2.eq.${usuario.id},Usuario3.eq.${usuario.id},Usuario4.eq.${usuario.id}`);

    if (errorConglo) {
      console.error("Error consultando conglomerados:", errorConglo);
      return false;
    }

    if (!conglomerados || conglomerados.length === 0) {
      return true;
    }

    const fechaNuevaObj = new Date(fechaNueva);

    for (const conglo of conglomerados) {
      const fechaConglo = new Date(conglo.Fecha_Inicio);
      const diferenciaDias = Math.abs((fechaNuevaObj - fechaConglo) / (1000 * 60 * 60 * 24));

      if (diferenciaDias <= 7) {
        console.log(`Usuario ${correoUsuario} NO disponible`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return false;
  }
}


// Calcular distancia entre dos coordenadas (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}
