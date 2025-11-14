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
    await cargarUsuariosEnSelect();
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

  // Cerrar modal
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('coordinatesModal').style.display = 'none';
  });

  // Guardar conglomerado
  document.getElementById('guardarConglomerado').addEventListener('click', async () => {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const descripcion = document.getElementById('descripcion').value;
    const usuarioId = document.getElementById('usuarioSelect').value;

    if (!fechaInicio || !descripcion || !usuarioId) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Obtener IDs de coordenadas seleccionadas con checkbox
    const coordinatesIds = Array.from(document.querySelectorAll('#tableBody tr'))
      .filter(row => row.querySelector('input[type="checkbox"]')?.checked)
      .map(row => row.dataset.coordinateId)
      .filter(id => id);

    console.log('Coordenadas seleccionadas:', coordinatesIds);

    const success = await guardarConglomerado(fechaInicio, descripcion, usuarioId, coordinatesIds);
    
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
