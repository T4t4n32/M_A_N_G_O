/* ================= NAVBAR DINÁMICA ================= */
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
    navbar.classList.toggle("bg-black", window.scrollY > 60);
});

/* ================= INTERSECTION OBSERVER ================= */
const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    },
    { threshold: 0.2 }
);

document.querySelectorAll(
    ".feature-card, .section-title, .section-text, .creator-highlight"
).forEach(el => observer.observe(el));

/* ================= TYPING HERO ================= */
const heroText = "Monitoreo Ambiental Oceánico Inteligente";
const heroTitle = document.querySelector(".hero-title");
let index = 0;

heroTitle.textContent = "";

(function type() {
    if (index < heroText.length) {
        heroTitle.textContent += heroText.charAt(index++);
        setTimeout(type, 55);
    }
})();

/* ================= PARALLAX HERO ================= */
const hero = document.querySelector(".hero-section");

window.addEventListener("scroll", () => {
    hero.style.backgroundPositionY = `${window.scrollY * 0.25}px`;
});
