// Variables de Supabase
const SUPABASE_URL = 'https://mukghsrmrtjfuesfiine.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2doc3JtcnRqZnVlc2ZpaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTc3NjEsImV4cCI6MjA3Mzk5Mzc2MX0.UHsI7kQG1qFDx5xrbH6nrSeNAmv7-tnDDjcgEt7Ylus';

// Inicializar Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase inicializado en utils.js');
console.log('URL:', SUPABASE_URL);

// Verificar token del usuario
async function verificarUsuarioPorToken() {
  try {
    console.log('Iniciando verificación de usuario...');
    
    // Obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    console.log('Token encontrado en URL:', token ? 'Sí' : 'No');

    if (token) {
      localStorage.setItem('userToken', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = localStorage.getItem('userToken');

    if (!storedToken) {
      console.log('No hay token guardado');
      mostrarMensajeError('Sesión inválida. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = 'http://localhost:3000';
      }, 2000);
      return false;
    }

    // Verificar el token con Supabase
    const { data, error } = await supabase.auth.getUser(storedToken);

    if (error || !data.user) {
      console.error('Error al verificar usuario:', error);
      localStorage.removeItem('userToken');
      
      mostrarMensajeError('Sesión expirada. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = 'http://localhost:3000/';
      }, 2000);
      return false;
    }

    console.log('Usuario verificado:', data.user.email);
    
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
      userInfoDiv.textContent = `Bienvenido: ${data.user.email}`;
    }

    return true;
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    localStorage.removeItem('userToken');
    mostrarMensajeError('Error en la verificación. Redirigiendo al login...');
    
    setTimeout(() => {
      window.location.href = 'http://localhost:3000';
    }, 2000);
    return false;
  }
}

// Verificar que el usuario exista en la tabla usuarios
async function verificarUsuarioEnBaseDatos(email) {
  try {
    console.log('Verificando usuario en base de datos:', email);

    if (!supabase) {
      console.error('Supabase no está inicializado');
      return false;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, Nombre, Correo, Latitud, Longitud')
      .eq('Correo', email)
      .single();

    if (error) {
      console.log('Usuario no encontrado en tabla usuarios:', error.message);
      return false;
    }

    if (!data) {
      console.warn('Usuario no existe en la tabla usuarios');
      return false;
    }

    console.log('Usuario encontrado en base de datos:', data);

    // Si el usuario existe, tiene nombre Y tiene coordenadas, está completamente registrado
    if (data.Nombre && data.Nombre.trim() !== '' && data.Latitud && data.Longitud) {
      console.log('Usuario completamente registrado');
      return data;
    }

    // Si el usuario existe pero le faltan datos, retornar para que complete
    if (!data.Nombre || data.Nombre.trim() === '' || !data.Latitud || !data.Longitud) {
      console.log('Usuario incompleto, necesita completar datos');
      return data;
    }

    return data;
  } catch (error) {
    console.log('Error verificando usuario:', error.message);
    return false;
  }
}

// Cargar conglomerados del usuario
async function cargarConglomeradosDelUsuario(usuarioId) {
  try {
    console.log('Cargando conglomerados del usuario:', usuarioId);

    if (!supabase) {
      console.error('Supabase no está inicializado');
      return [];
    }

    const { data, error } = await supabase
      .from('Conglomerados')
      .select('id, Fecha_Inicio, Descripción, Usuario')
      .eq('Usuario', usuarioId)
      .order('Fecha_Inicio', { ascending: false });

    if (error) {
      console.error('Error al cargar conglomerados:', error);
      throw error;
    }

    console.log('Conglomerados obtenidos:', data);
    return data || [];
  } catch (error) {
    console.error('Error al cargar conglomerados:', error);
    alert('Error al cargar conglomerados: ' + error.message);
    return [];
  }
}

function mostrarMensajeError(mensaje) {
  const output = document.getElementById('output');
  if (output) {
    output.textContent = mensaje;
    output.style.color = 'red';
  }
}

function cerrarSesion() {
  localStorage.removeItem('userToken');
  window.location.href = 'http://localhost:3000/';
}
