// Esperar a que CONFIG esté disponible
function obtenerConfiguracion() {
  while (!CONFIG) {
    // Esperar a que la configuración se cargue
  }
  return CONFIG;
}

// Obtener variables del .env
let SUPABASE_URL = 'https://mukghsrmrtjfuesfiine.supabase.co';
let SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2doc3JtcnRqZnVlc2ZpaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTc3NjEsImV4cCI6MjA3Mzk5Mzc2MX0.UHsI7kQG1qFDx5xrbH6nrSeNAmv7-tnDDjcgEt7Ylus';

// Si hay configuración disponible, usarla
if (typeof CONFIG !== 'undefined' && CONFIG) {
  SUPABASE_URL = CONFIG.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  SUPABASE_KEY = CONFIG.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || SUPABASE_KEY;
}

// Inicializar Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


window.supabaseClient = supabase;
window.supabase = supabase; // opcional, para compatibilidad con otros archivos

console.log('Supabase inicializado en utils.js');
console.log('URL:', SUPABASE_URL);

console.log('Supabase inicializado en utils.js');
console.log('URL:', SUPABASE_URL);

// Configuración de Supabase
const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY
};

// Configuración de Mapbox
const MAPBOX_CONFIG = {
  accessToken: 'pk.eyJ1Ijoibm90ZWUwMDEiLCJhIjoiY21naWh5NHlpMDlpejJxcHU1Nm41b3RyaCJ9.PFvWLe45FTx6XXJqYcpq0A',
  center: [-74, 4.5],
  zoom: 4.5
};

// Zonas geográficas
const ZONAS = [
  [[-69.94783, -4.22671], [-79.25914, 1.07880], [-77.63382, 9.12124], [-70.82115, 12.55210]],
  [[-72.02043, 7.03256], [-67.27637, 6.34109], [-66.84027, 1.21853], [-69.82685, -4.13150]],
  [[-81.74912, 12.48359], [-81.72282, 12.47914], [-81.68144, 12.58151], [-81.70178, 12.61299]],
  [[-81.40236, 13.32037], [-81.36602, 13.31578], [-81.33161, 13.38948], [-81.38683, 13.40564]]
];

// Verificar token JWT
async function verificarToken(token) {
  try {
    console.log('Verificando token...');
    const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_CONFIG.key
      }
    });

    if (!response.ok) {
      console.error('Error en la respuesta:', response.status);
      throw new Error("Token inválido o expirado");
    }

    const user = await response.json();
    console.log('Usuario verificado:', user);
    return user;
  } catch (error) {
    console.error('Error al verificar token:', error);
    throw error;
  }
}

// Verificar usuario por token y obtener sus datos
async function verificarUsuarioPorToken() {
  try {
    console.log('Iniciando verificación...');
    
    // Obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    console.log('Token encontrado en URL:', token ? 'Sí' : 'No');

    if (token) {
      // Guardar token en localStorage
      localStorage.setItem('adminToken', token);
      
      // Limpiar la URL para evitar recargas con token
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Obtener token de localStorage
    const storedToken = localStorage.getItem('adminToken');

    if (!storedToken) {
      console.log('No hay token guardado');
      mostrarMensajeError('Sesión inválida. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = '../loginproyecto/login.html';
      }, 2000);
      return false;
    }

    // Verificar el token con Supabase
    const { data, error } = await supabase.auth.getUser(storedToken);

    if (error || !data.user) {
      console.error('Error al verificar usuario:', error);
      
      // Limpiar token inválido
      localStorage.removeItem('adminToken');
      
      mostrarMensajeError('Sesión expirada. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = '../loginproyecto/login.html';
      }, 2000);
      return false;
    }

    console.log('Usuario verificado:', data.user.email);
    
    // Mostrar información del usuario
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
      userInfoDiv.textContent = `Bienvenido: ${data.user.email}`;
    }

    return true;
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    
    localStorage.removeItem('adminToken');
    mostrarMensajeError('Error en la verificación. Redirigiendo al login...');
    
    setTimeout(() => {
      window.location.href = '../loginproyecto/login.html';
    }, 2000);
    return false;
  }
}

function mostrarMensajeError(mensaje) {
  const output = document.getElementById('output');
  if (output) {
    output.textContent = mensaje;
    output.style.color = 'red';
  }
}
