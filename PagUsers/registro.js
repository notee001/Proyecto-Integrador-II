let map = null;
let marker = null;
let rolesSeleccionados = [];

const MAPBOX_CONFIG = {
  accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycW1lNnRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
  center: [-75.5, 4.5],
  zoom: 5
};

document.addEventListener('DOMContentLoaded', function() {
  // Verificar que el elemento map exista antes de inicializar
  const mapElement = document.getElementById('map');
  if (mapElement) {
    setTimeout(inicializarMapa, 500);
  }
  configurarCheckboxesRol();
  configurarBotones();
});

function inicializarMapa() {
  const mapContainer = document.getElementById('map');
  
  if (!mapContainer) {
    console.error('Elemento map no encontrado');
    return;
  }

  try {
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom
    });

    map.on('load', function() {
      console.log('Mapa cargado correctamente');
    });

    map.on('click', function(e) {
      const { lng, lat } = e.lngLat;
      agregarMarcador(lat, lng);
    });

    map.on('error', function(error) {
      console.error('Error en el mapa:', error);
    });
  } catch (error) {
    console.error('Error al inicializar mapa:', error);
  }
}

function configurarCheckboxesRol() {
  const checkboxes = document.querySelectorAll('.rol-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      rolesSeleccionados = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      console.log('Roles seleccionados:', rolesSeleccionados);
    });
  });
}

function configurarBotones() {
  // Obtener ubicación actual
  document.getElementById('btnObtenerUbicacion').addEventListener('click', function(e) {
    e.preventDefault();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const { latitude, longitude } = position.coords;
        agregarMarcador(latitude, longitude);
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 15 });
        }
      }, function() {
        alert('No se pudo obtener la ubicación');
      });
    } else {
      alert('Geolocalización no soportada');
    }
  });

  // Cerrar sesión
  document.getElementById('btnLogout').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('¿Deseas cerrar sesión?')) {
      cerrarSesion();
    }
  });

  // Enviar formulario
  document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await guardarRegistro();
  });
}

function agregarMarcador(lat, lng) {
  if (marker) {
    marker.remove();
  }

  const el = document.createElement('div');
  el.style.backgroundImage = `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>')`;
  el.style.backgroundSize = '100%';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.cursor = 'pointer';

  marker = new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .addTo(map);

  document.getElementById('latitud').value = lat.toFixed(6);
  document.getElementById('longitud').value = lng.toFixed(6);
}

async function guardarRegistro() {
  try {
    const latitud = parseFloat(document.getElementById('latitud').value);
    const longitud = parseFloat(document.getElementById('longitud').value);

    if (rolesSeleccionados.length === 0) {
      mostrarError('Por favor selecciona al menos un rol');
      return;
    }

    if (!latitud || !longitud) {
      mostrarError('Por favor selecciona una ubicación en el mapa');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser(localStorage.getItem('userToken'));
    
    if (!user) {
      mostrarError('Error al obtener datos del usuario');
      return;
    }

    console.log('Procesando ubicación para:', user.email);

    // Verificar si el usuario existe
    const { data: usuarioExistente, error: errorBusqueda } = await supabase
      .from('usuarios')
      .select('id, Nombre, Correo, Latitud, Longitud')
      .eq('Correo', user.email)
      .single();

    // Solo actualiza si el usuario existe Y tiene nombre
    const puedeActualizar = usuarioExistente && 
                           usuarioExistente.Correo === user.email && 
                           usuarioExistente.Nombre && 
                           usuarioExistente.Nombre.trim() !== '';

    if (!puedeActualizar) {
      mostrarError('Error: Usuario no encontrado o sin nombre asignado');
      return;
    }

    console.log('Actualizando coordenadas...');

    const { data: usuarioActualizado, error: errorActualizar } = await supabase
      .from('usuarios')
      .update({
        Latitud: latitud,
        Longitud: longitud
      })
      .eq('Correo', user.email)
      .select();

    if (errorActualizar) {
      console.error('Error al actualizar:', errorActualizar);
      mostrarError('Error: ' + errorActualizar.message);
      return;
    }

    console.log('Coordenadas guardadas:', usuarioActualizado);

    // Guardar roles solo si no existen
    const { data: rolesExistentes } = await supabase
      .from('Rol')
      .select('tipo')
      .eq('Correo', user.email);

    let rolesAGuardar = rolesSeleccionados;

    if (rolesExistentes && rolesExistentes.length > 0) {
      const rolesYaExistentes = rolesExistentes.map(r => r.tipo);
      rolesAGuardar = rolesSeleccionados.filter(rol => !rolesYaExistentes.includes(rol));
    }

    if (rolesAGuardar.length > 0) {
      const rolesData = rolesAGuardar.map(rol => ({
        Correo: user.email,
        tipo: rol,
        creado_en: new Date().toISOString()
      }));

      const { error: errorRoles } = await supabase
        .from('Rol')
        .insert(rolesData);

      if (errorRoles) {
        console.error('Error al guardar roles:', errorRoles);
        mostrarError('Error al guardar roles: ' + errorRoles.message);
        return;
      }

      console.log('Roles guardados');
    }

    mostrarExito('Registro completado exitosamente');
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error: ' + error.message);
  }
}

function mostrarError(mensaje) {
  document.getElementById('errorGeneral').textContent = mensaje;
  document.getElementById('successMessage').textContent = '';
}

function mostrarExito(mensaje) {
  document.getElementById('successMessage').textContent = mensaje;
  document.getElementById('errorGeneral').textContent = '';
}

function cerrarSesion() {
  localStorage.removeItem('userToken');
  window.location.href = 'http://localhost:3000';
}
