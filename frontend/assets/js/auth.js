// M.A.N.G.O - Sistema de Autenticación

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Manejar login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        remember: remember
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Guardar información del usuario
                    localStorage.setItem('mango_user', username);
                    localStorage.setItem('mango_remember', remember.toString());
                    
                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Credenciales incorrectas. Por favor, intenta de nuevo.');
                }
            } catch (error) {
                console.error('Error en login:', error);
                alert('Error al conectar con el servidor. Por favor, intenta de nuevo.');
            }
        });
    }
    
    // Manejar logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                // Limpiar almacenamiento local
                localStorage.removeItem('mango_user');
                localStorage.removeItem('mango_remember');
                
                // Redirigir al login
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error en logout:', error);
                window.location.href = 'login.html';
            }
        });
    }
    
    // Verificar sesión al cargar dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        checkSession();
    }
});

// Verificar sesión
async function checkSession() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'login.html';
        } else {
            // Mostrar nombre de usuario
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.textContent = data.user.full_name || data.user.username;
            }
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        window.location.href = 'login.html';
    }
}