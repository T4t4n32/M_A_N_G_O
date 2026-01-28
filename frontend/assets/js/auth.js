// frontend/assets/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');
  const errorContainer = document.getElementById('error-container');
  const errorText = document.getElementById('error-text');
  const offlineWarning = document.getElementById('offline-warning');
  const connectionIndicator = document.getElementById('connection-indicator');
  const connectionStatus = document.getElementById('connection-status');

  // Verificar estado de conexión al cargar
  checkBackendConnection();

  // Alternar visibilidad de contraseña
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  // Manejar envío del formulario
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username')?.value.trim();
      const password = document.getElementById('password')?.value;
      const remember = document.getElementById('remember')?.checked || false;

      if (!username || !password) {
        showError('Por favor ingrese usuario y contraseña');
        return;
      }

      // Deshabilitar botón durante el proceso
      if (submitBtn) {
        submitBtn.disabled = true;
        const originalText = submitBtn.querySelector('#btn-text')?.textContent || 'Ingresar';
        if (submitBtn.querySelector('#btn-text')) {
          submitBtn.querySelector('#btn-text').textContent = 'Iniciando sesión...';
        }

        try {
          // Intentar login usando mangoAPI
          const response = await mangoAPI.login(username, password);
          
          if (response.success) {
            // Guardar preferencia de recordar sesión
            if (remember) {
              localStorage.setItem('mango_remember_me', 'true');
            }
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
          } else {
            showError(response.error || 'Error en el inicio de sesión');
          }
        } catch (error) {
          console.error('Error en login:', error);
          if (error.message === 'No autorizado') {
            showError('Credenciales inválidas. Verifique usuario y contraseña.');
          } else if (error.message.includes('Failed to fetch')) {
            showError('No se pudo conectar con el servidor. Verifique su conexión.');
            showOfflineWarning();
          } else {
            showError('Error del servidor. Intente nuevamente.');
          }
        } finally {
          // Re-enable button
          submitBtn.disabled = false;
          if (submitBtn.querySelector('#btn-text')) {
            submitBtn.querySelector('#btn-text').textContent = 'Ingresar al dashboard';
          }
        }
      }
    });
  }

  // Verificar conexión periódicamente
  setInterval(checkBackendConnection, 30000);

  // Funciones auxiliares
  function showError(message) {
    if (errorContainer && errorText) {
      errorText.textContent = message;
      errorContainer.style.display = 'block';
      
      // Ocultar error después de 5 segundos
      setTimeout(() => {
        if (errorContainer) {
          errorContainer.style.display = 'none';
        }
      }, 5000);
    }
  }

  function showOfflineWarning() {
    if (offlineWarning && connectionIndicator && connectionStatus) {
      offlineWarning.style.display = 'block';
      connectionIndicator.className = 'status-indicator offline';
      connectionStatus.textContent = 'Backend: Offline';
      connectionStatus.style.color = '#dc3545';
    }
  }

  async function checkBackendConnection() {
    try {
      const response = await fetch('/health', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        if (connectionIndicator && connectionStatus) {
          connectionIndicator.className = 'status-indicator online';
          connectionStatus.textContent = 'Backend: Conectado';
          connectionStatus.style.color = '';
        }
        if (offlineWarning) {
          offlineWarning.style.display = 'none';
        }
        return true;
      } else {
        showOfflineWarning();
        return false;
      }
    } catch (error) {
      console.error('Error checking backend connection:', error);
      showOfflineWarning();
      return false;
    }
  }

  // Verificar si hay sesión activa
  checkAuthStatus();
});

async function checkAuthStatus() {
  try {
    const response = await mangoAPI.checkAuthStatus();
    if (response.authenticated) {
      // Si ya está autenticado, redirigir al dashboard
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    // No autenticado, mostrar formulario de login
  }
}