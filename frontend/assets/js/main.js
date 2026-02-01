// M.A.N.G.O - Funciones Principales

document.addEventListener('DOMContentLoaded', function() {
    console.log('M.A.N.G.O - Sistema de Monitoreo Ambiental');
    
    // Smooth scroll para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Efecto de scroll para navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            navbar.style.background = 'rgba(14, 26, 31, 0.95)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
            navbar.style.background = '';
        }
    });
});