let usuarioVerificado = false;

document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM cargado');

  // Verificar usuario una sola vez
  if (!usuarioVerificado) {
    const isAdmin = await verificarUsuarioPorToken();
    usuarioVerificado = true;

    if (!isAdmin) {
      console.log('Usuario no es administrador');
      return;
    }

    // Mostrar elementos de admin solo si está verificado
    document.getElementById('generar').style.display = 'block';
    document.getElementById('saveButton').style.display = 'block';
    document.getElementById('dropdownBtn').style.display = 'block';
    document.getElementById('registroBtn').style.display = 'block';
  }

  // Inicializar Mapbox solo si el usuario es válido
  mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: MAPBOX_CONFIG.center,
    zoom: MAPBOX_CONFIG.zoom
  });

  // Pasar el mapa al manager
  coordinatesManager.setMap(map);

  // Evento cuando el mapa carga
  map.on('load', () => {
    console.log('Mapa cargado correctamente');
  });

  // Event listeners para botones
  document.getElementById("generar").addEventListener("click", () => {
    coordinatesManager.generarCoordenadas();
  });

  document.getElementById("saveButton").addEventListener("click", () => {
    coordinatesManager.guardarCoordenadas();
  });

  // Dropdown y Modal
  const dropdownBtn = document.getElementById("dropdownBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const modal = document.getElementById("coordinatesModal");

  // Mostrar/ocultar dropdown
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-container")) {
      dropdownMenu.classList.remove("show");
    }
  });

  // Ver tabla - Abrir modal de coordenadas
  const verTablaLink = document.getElementById("verTabla");
  verTablaLink.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log('Abriendo modal de coordenadas');
    document.getElementById('coordinatesModal').style.display = 'block';
    await cargarUsuariosParaConglomerados();
    await coordinatesManager.cargarCoordenadas();
  });

  // Botón Registrar nuevo usuario
  const registroBtn = document.getElementById("registroBtn");
  if (registroBtn) {
    registroBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log('Abriendo formulario de registro');
      document.getElementById('registroModal').style.display = 'block';
      dropdownMenu.classList.remove("show");
    });
  }

  // Botón Cerrar sesión
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm('¿Deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }

  // Cerrar modal
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('coordinatesModal').style.display = 'none';
  });

  // Guardar conglomerado
  document.getElementById('guardarConglomerado').addEventListener('click', async () => {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const descripcion = document.getElementById('descripcion').value;
    const usuario1 = document.getElementById('usuarioJefe').value;
    const usuario2 = document.getElementById('usuarioBotanico').value;
    const usuario3 = document.getElementById('usuarioTecnico').value;
    const usuario4 = document.getElementById('usuarioCoinvestigador').value;

    if (!fechaInicio || !descripcion || !usuario1 || !usuario2 || !usuario3 || !usuario4) {
      alert('Por favor completa todos los campos y selecciona todos los roles');
      return;
    }

    const usuarios = [usuario1, usuario2, usuario3, usuario4];


    // Obtener IDs de coordenadas seleccionadas con checkbox
    const coordinatesIds = Array.from(document.querySelectorAll('#tableBody tr'))
      .filter(row => row.querySelector('input[type="checkbox"]')?.checked)
      .map(row => row.dataset.coordinateId)
      .filter(id => id);

    console.log('Coordenadas seleccionadas:', coordinatesIds);

    const success = await guardarConglomerado(fechaInicio, descripcion, usuarios, coordinatesIds);
    
    if (success) {
      // Limpiar formulario
      document.getElementById('fechaInicio').value = '';
      document.getElementById('descripcion').value = '';
      document.getElementById('usuarioSelect').value = '';
      // Desmarcar todos los checkboxes
      document.querySelectorAll('#tableBody input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});

async function cargarUsuariosParaConglomerados() {
  try {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const latitud = 4.5; // Coordenada por defecto, se actualizará cuando se seleccione
    const longitud = -75.5;

    // Cargar usuarios para cada rol
    const rolesRequeridos = [
      'Jefe de brigada',
      'Botanico',
      'Tecnico auxiliar',
      'Coinvestigador'
    ];

    const usuariosPorRol = {};

    for (const rol of rolesRequeridos) {
      const usuarios = await obtenerUsuariosDisponibles(rol, latitud, longitud, fechaInicio);
      usuariosPorRol[rol] = usuarios;
    }

    // Llenar selectores
    const rolSelectores = {
      'Jefe de brigada': 'usuarioJefe',
      'Botanico': 'usuarioBotanico',
      'Tecnico auxiliar': 'usuarioTecnico',
      'Coinvestigador': 'usuarioCoinvestigador'
    };

    for (const [rol, selectId] of Object.entries(rolSelectores)) {
      const select = document.getElementById(selectId);
      if (select) {
        select.innerHTML = '<option value="">Seleccione un usuario</option>';
        
        if (usuariosPorRol[rol]) {
          usuariosPorRol[rol].forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = `${usuario.Nombre} (${(usuario.distancia || 0).toFixed(2)} km)`;
            select.appendChild(option);
          });
        }
      }
    }

    console.log('Usuarios cargados para conglomerados:', usuariosPorRol);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}
