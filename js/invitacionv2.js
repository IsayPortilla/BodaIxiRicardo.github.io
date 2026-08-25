const music = document.getElementById("musica");

function togglePlay() {
    if (!music) return;
    music.paused ? music.play().catch(() => {}) : music.pause();
}

const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

document.documentElement.classList.add("aos-ready");

document.addEventListener("DOMContentLoaded", () => {
    if (!isMobile && typeof AOS !== "undefined") {
        AOS.init({ duration: 1200, once: true });
    }
});

const targetDate = new Date("April 17, 2027 17:00:00").getTime();
const updateCountdown = setInterval(function () {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    const days = document.getElementById("days");
    const hours = document.getElementById("hours");
    const minutes = document.getElementById("minutes");
    if (days) days.innerText = d.toString().padStart(2, "0");
    if (hours) hours.innerText = h.toString().padStart(2, "0");
    if (minutes) minutes.innerText = m.toString().padStart(2, "0");

    if (distance < 0) {
        clearInterval(updateCountdown);
        const cd = document.getElementById("countdown");
        if (cd) cd.innerHTML = "<p class='playfair text-3xl font-bold'>¡Llegó el gran día!</p>";
    }
}, 1000);
