// ================= REDIRECCIÓN AUTOMÁTICA =================
(function() {
    'use strict';

    // Tiempo de espera antes de redirigir (en milisegundos)
    const REDIRECT_DELAY = 3000; // 3 segundos

    // URL destino (carpeta lovable)
    const DESTINATION_URL = '../var/www/mango-ui/index.html';

    // Contador visual
    let countdown = Math.floor(REDIRECT_DELAY / 1000);
    const countdownElement = document.querySelector('.loading-message');

    // Actualizar mensaje de cuenta regresiva
    function updateCountdown() {
        if (countdown > 0) {
            countdownElement.textContent = `Redirigiendo en ${countdown}...`;
            countdown--;
            setTimeout(updateCountdown, 1000);
        } else {
            countdownElement.textContent = 'Redirigiendo ahora...';
            performRedirect();
        }
    }

    // Realizar redirección
    function performRedirect() {
        setTimeout(() => {
            window.location.href = DESTINATION_URL;
        }, 300);
    }

    // Iniciar cuenta regresiva después de un breve delay
    setTimeout(updateCountdown, 1000);

    // ================= BOTÓN MANUAL (OPCIONAL) =================
    // Si quieres agregar un botón para redirigir manualmente:
    /*
    const manualRedirectBtn = document.createElement('button');
    manualRedirectBtn.textContent = 'Ir a la plataforma ahora';
    manualRedirectBtn.style.cssText = `
        margin-top: 20px;
        padding: 12px 30px;
        background: linear-gradient(90deg, var(--mango-gold), var(--mango-green));
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.3s ease;
    `;
    manualRedirectBtn.onmouseover = () => manualRedirectBtn.style.transform = 'scale(1.05)';
    manualRedirectBtn.onmouseout = () => manualRedirectBtn.style.transform = 'scale(1)';
    manualRedirectBtn.onclick = performRedirect;
    
    document.querySelector('.redirect-info').parentNode.appendChild(manualRedirectBtn);
    */

    // ================= PREVENT BACK BUTTON =================
    // Evitar que el usuario vuelva atrás después de redirigir
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            window.location.reload();
        }
    });

    // ================= CONSOLE MESSAGE =================
    // Mensaje en consola para desarrolladores
    console.log('%cM.A.N.G.O. Redirect', 'color: #f6b01e; font-weight: bold; font-size: 16px;');
    console.log('Redirigiendo a la plataforma principal...');
    console.log(`Destino: ${DESTINATION_URL}`);
    console.log(`Tiempo: ${REDIRECT_DELAY}ms`);

})();