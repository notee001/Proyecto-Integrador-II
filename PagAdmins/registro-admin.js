document.addEventListener('DOMContentLoaded', function() {
  configurarEventosRegistro();
  configurarCheckboxesRoles();
  
  const registroModal = document.getElementById('registroModal');
  if (registroModal) {
    registroModal.addEventListener('click', function() {
      setTimeout(() => {
        if (!mapRegistro && document.getElementById('mapRegistro')) {
          inicializarMapaRegistro();
        }
      }, 100);
    });
  }
});

let mapRegistro = null;
let markerRegistro = null;
let coordenadas = { lat: null, lng: null };
let rolesSeleccionados = [];

const MAPBOX_CONFIG_NUE = {
  accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycW1lNnRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
  center: [-75.5, 4.5],
  zoom: 5
};

function alternarUbicacionYRoles() {
  const tipoUsuario = document.getElementById('tipoRegistro').value;
  const ubicacionSection = document.getElementById('ubicacionSection');
  const rolesSection = document.getElementById('rolesSection');

  if (tipoUsuario === 'usuario') {
    ubicacionSection.style.display = 'block';
    rolesSection.style.display = 'block';
    setTimeout(() => {
      if (!mapRegistro && document.getElementById('mapRegistro')) {
        inicializarMapaRegistro();
      }
    }, 100);
  } else {
    ubicacionSection.style.display = 'none';
    rolesSection.style.display = 'none';
    if (mapRegistro) {
      mapRegistro.remove();
      mapRegistro = null;
    }
    if (markerRegistro) {
      markerRegistro.remove();
      markerRegistro = null;
    }
    coordenadas = { lat: null, lng: null };
  }
}

function configurarCheckboxesRoles() {
  const checkboxes = document.querySelectorAll('.rol-check');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      rolesSeleccionados = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      console.log('Roles seleccionados:', rolesSeleccionados);
    });
  });
}

function configurarEventosRegistro() {
  // Cerrar modal de registro
  const closeRegistroModal = document.getElementById('closeRegistroModal');
  if (closeRegistroModal) {
    closeRegistroModal.addEventListener('click', () => {
      document.getElementById('registroModal').style.display = 'none';
    });
  }

  // Enviar formulario de registro
  const formularioRegistro = document.getElementById('formularioRegistroAdmin');
  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      await guardarNuevoUsuario();
    });
  }
}

function inicializarMapaRegistro() {
  const mapContainer = document.getElementById('mapRegistro');
  
  if (!mapContainer) {
    console.error('Elemento mapRegistro no encontrado');
    return;
  }

  try {
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
    mapRegistro = new mapboxgl.Map({
      container: 'mapRegistro',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom
    });

    mapRegistro.on('click', function(e) {
      const { lng, lat } = e.lngLat;
      agregarMarcadorRegistro(lat, lng);
    });

    mapRegistro.on('error', function(error) {
      console.error('Error en mapa registro:', error);
    });
  } catch (error) {
    console.error('Error al inicializar mapa:', error);
  }
}

function agregarMarcadorRegistro(lat, lng) {
  if (markerRegistro) {
    markerRegistro.remove();
  }

  const el = document.createElement('div');
  el.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>')`;
  el.style.backgroundSize = '100%';
  el.style.width = '32px';
  el.style.height = '32px';

  markerRegistro = new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .addTo(mapRegistro);

  coordenadas = { lat, lng };
  document.getElementById('latitudRegistro').value = lat.toFixed(6);
  document.getElementById('longitudRegistro').value = lng.toFixed(6);
}

async function guardarNuevoUsuario() {
  try {
    const email = document.getElementById('emailRegistro').value;
    const nombre = document.getElementById('nombreRegistro').value;
    const tipo = document.getElementById('tipoRegistro').value;
    const password = document.getElementById('passwordRegistro').value;

    // Validaciones básicas
    if (!email || !nombre || !tipo || !password) {
      mostrarErrorRegistro('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      mostrarErrorRegistro('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    let latitud = null;
    let longitud = null;

    // Si es usuario, validar ubicación y roles
    if (tipo === 'usuario') {
      latitud = parseFloat(document.getElementById('latitudRegistro').value);
      longitud = parseFloat(document.getElementById('longitudRegistro').value);

      if (!latitud || !longitud) {
        mostrarErrorRegistro('Por favor selecciona una ubicación en el mapa');
        return;
      }

      if (rolesSeleccionados.length === 0) {
        mostrarErrorRegistro('Por favor selecciona al menos un rol');
        return;
      }
    }

    console.log('Registrando nuevo usuario:', { email, nombre, tipo, latitud, longitud });

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre: nombre,
          tipo: tipo
        }
      }
    });

    if (error) {
      console.error('Error al crear usuario en Auth:', error);
      mostrarErrorRegistro('Error: ' + error.message);
      return;
    }

    console.log('Usuario creado en Auth:', data);

    // Guardar en tabla usuarios
    const { data: usuarioData, error: errorUsuario } = await supabase
      .from('usuarios')
      .insert([
        {
          Correo: email,
          Nombre: nombre,
          tipo: tipo,
          Latitud: latitud,
          Longitud: longitud,
          creado_en: new Date().toISOString()
        }
      ]);

    if (errorUsuario) {
      console.error('Error al guardar en tabla usuarios:', errorUsuario);
      mostrarErrorRegistro('Error al guardar usuario en base de datos: ' + errorUsuario.message);
      return;
    }

    console.log('Usuario guardado en tabla usuarios:', usuarioData);

    // Si es usuario, guardar roles
    if (tipo === 'usuario' && rolesSeleccionados.length > 0) {
      const rolesAGuardar = rolesSeleccionados.map(rol => ({
        Correo: email,
        Tipo: rol
      }));

      const { error: errorRoles } = await supabase
        .from('Rol')
        .insert(rolesAGuardar);

      if (errorRoles) {
        console.error('Error al guardar roles:', errorRoles);
        mostrarErrorRegistro('Error al guardar roles: ' + errorRoles.message);
        return;
      }

      console.log('Roles guardados:', rolesAGuardar);
    }

    mostrarExitoRegistro('Usuario registrado exitosamente');

    // Limpiar formulario
    document.getElementById('formularioRegistroAdmin').reset();
    document.getElementById('tipoRegistro').value = '';
    document.getElementById('latitudRegistro').value = '';
    document.getElementById('longitudRegistro').value = '';
    rolesSeleccionados = [];
    document.querySelectorAll('.rol-check').forEach(cb => cb.checked = false);
    
    if (markerRegistro) markerRegistro.remove();
    coordenadas = { lat: null, lng: null };
    alternarUbicacionYRoles();

    setTimeout(() => {
      document.getElementById('registroModal').style.display = 'none';
    }, 2000);

  } catch (error) {
    console.error('Error:', error);
    mostrarErrorRegistro('Error: ' + error.message);
  }
}

function mostrarErrorRegistro(mensaje) {
  document.getElementById('errorRegistro').textContent = mensaje;
  document.getElementById('successRegistro').textContent = '';
}

function mostrarExitoRegistro(mensaje) {
  document.getElementById('successRegistro').textContent = mensaje;
  document.getElementById('errorRegistro').textContent = '';
}
