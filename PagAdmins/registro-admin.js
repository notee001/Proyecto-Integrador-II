document.addEventListener('DOMContentLoaded', function() {
  configurarEventosRegistro();
});

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

async function guardarNuevoUsuario() {
  try {
    const email = document.getElementById('emailRegistro').value;
    const nombre = document.getElementById('nombreRegistro').value;
    const tipo = document.getElementById('tipoRegistro').value;
    const password = document.getElementById('passwordRegistro').value;

    // Validaciones
    if (!email || !nombre || !tipo || !password) {
      mostrarErrorRegistro('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      mostrarErrorRegistro('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log('Registrando nuevo usuario:', { email, nombre, tipo });

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
          creado_en: new Date().toISOString()
        }
      ]);

    if (errorUsuario) {
      console.error('Error al guardar en tabla usuarios:', errorUsuario);
      mostrarErrorRegistro('Error al guardar usuario en base de datos: ' + errorUsuario.message);
      return;
    }

    console.log('Usuario guardado en tabla usuarios:', usuarioData);
    mostrarExitoRegistro('Usuario registrado exitosamente');

    // Limpiar formulario
    document.getElementById('formularioRegistroAdmin').reset();
    document.getElementById('tipoRegistro').value = '';

    // Cerrar modal después de 2 segundos
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
