let usuarioVerificado = false;
let usuarioActual = null;

document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM cargado');

  // Verificar usuario una sola vez
  if (!usuarioVerificado) {
    const isUser = await verificarUsuarioPorToken();
    
    if (!isUser) {
      console.log('Usuario no autenticado');
      return;
    }

    // Obtener email del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser(localStorage.getItem('userToken'));
    
    if (!user) {
      console.log('No se pudo obtener el usuario');
      mostrarMensajeError('Error al obtener datos del usuario');
      return;
    }

    // Verificar que exista en la tabla usuarios
    const usuarioData = await verificarUsuarioEnBaseDatos(user.email);
    
    if (!usuarioData) {
      console.log('Usuario no existe en base de datos');
      mostrarMensajeError('Usuario no registrado en el sistema');
      setTimeout(() => {
        localStorage.removeItem('userToken');
        window.location.href = 'http://localhost:3000/';
      }, 2000);
      return;
    }

    // CONDICIÓN: Si tiene Latitud Y Longitud, está completamente registrado
    // NO importa si tiene nombre o no, va directamente a conglomerados
    const tieneCoordenadas = usuarioData.Latitud && usuarioData.Longitud;

    if (!tieneCoordenadas) {
      // Solo muestra formulario si le faltan coordenadas
      console.log('Usuario sin coordenadas, mostrar formulario para completar ubicación');
      document.getElementById('registroView').style.display = 'block';
      document.getElementById('conglomeradosView').style.display = 'none';
      return;
    }

    // Usuario tiene coordenadas, mostrar conglomerados
    console.log('Usuario con coordenadas completas, mostrar conglomerados');
    usuarioActual = usuarioData;
    usuarioVerificado = true;

    // Mostrar información del usuario
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
      userInfoDiv.textContent = `Bienvenido: ${user.email}`;
    }

    // Mostrar vista de conglomerados
    document.getElementById('conglomeradosView').style.display = 'block';
    document.getElementById('registroView').style.display = 'none';

    // Cargar conglomerados del usuario
    await cargarYMostrarConglomerados();
  }

  // Evento para cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar sesión?')) {
        cerrarSesion();
      }
    });
  }
});

async function cargarYMostrarConglomerados() {
  try {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('grid');

    loading.style.display = 'block';
    grid.innerHTML = '';

    const conglomerados = await cargarConglomeradosDelUsuario(usuarioActual.id);

    loading.style.display = 'none';

    if (conglomerados.length === 0) {
      grid.innerHTML = '<div class="empty-message">No hay conglomerados asignados</div>';
      return;
    }

    conglomerados.forEach((conglomerado, index) => {
      const fecha = new Date(conglomerado.Fecha_Inicio).toLocaleDateString('es-ES');
      
      const card = document.createElement('div');
      card.className = 'card';

      const descripcion = conglomerado.Descripción || 'Sin descripción';

      card.innerHTML = `
        <p>Conglomerado #${index + 1}</p>
        <p class="card-fecha">Fecha: ${fecha}</p>
        <div class="dropdown" onclick="toggleDescripcion(this)">
          <span>Descripción</span>
        </div>
        <div class="descripcion">
          ${descripcion}
        </div>
      `;

      grid.appendChild(card);
    });

    console.log(`Se cargaron ${conglomerados.length} conglomerados`);
  } catch (error) {
    console.error('Error al cargar y mostrar conglomerados:', error);
    mostrarMensajeError('Error al cargar conglomerados');
  }
}

function toggleDescripcion(element) {
  element.classList.toggle('active');
  const descripcion = element.nextElementSibling;
  descripcion.classList.toggle('active');
}
