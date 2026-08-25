const music = document.getElementById("musica");

function togglePlay() {
    if (!music) return;
    music.paused ? music.play().catch(() => {}) : music.pause();
}

const isMobile =
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function initCountdown() {
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
}

function loadAosDesktopOnly() {
    if (isMobile) return;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "vendor/aos/aos.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "vendor/aos/aos.js";
    js.onload = function () {
        if (typeof AOS === "undefined") return;
        document.documentElement.classList.add("aos-on");
        AOS.init({ duration: 1200, once: true });
    };
    document.body.appendChild(js);
}

initCountdown();
loadAosDesktopOnly();
