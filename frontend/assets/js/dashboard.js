document.addEventListener("DOMContentLoaded", () => {

    /* Loader */
    setTimeout(() => {
        document.querySelector(".dashboard-loader").style.display = "none";
    }, 1200);

    /* Animaciones */
    const animated = document.querySelectorAll(".fade-up, .fade-left, .fade-right");

    animated.forEach(el => {
        setTimeout(() => el.classList.add("active"), 400);
    });

    /* Simulación de datos (reemplazable por API real) */
    function random(min, max) {
        return (Math.random() * (max - min) + min).toFixed(2);
    }

    setInterval(() => {
        document.getElementById("temp").textContent = random(18, 26);
        document.getElementById("turb").textContent = random(2, 7);
        document.getElementById("ph").textContent = random(7.6, 8.3);
    }, 3000);

});
