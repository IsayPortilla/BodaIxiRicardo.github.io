var music = null;

function togglePlay() {
    if (!music) {
        music = new Audio("assets/audio/musica.mp3");
        music.loop = true;
        music.preload = "auto";
    }
    if (music.paused) {
        music.play().catch(function () {});
    } else {
        music.pause();
    }
}

(function initCountdown() {
    var targetDate = new Date("April 17, 2027 17:00:00").getTime();
    setInterval(function () {
        var now = new Date().getTime();
        var distance = targetDate - now;
        var d = Math.floor(distance / (1000 * 60 * 60 * 24));
        var h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var days = document.getElementById("days");
        var hours = document.getElementById("hours");
        var minutes = document.getElementById("minutes");
        if (days) days.innerText = String(d).padStart(2, "0");
        if (hours) hours.innerText = String(h).padStart(2, "0");
        if (minutes) minutes.innerText = String(m).padStart(2, "0");
        if (distance < 0) {
            var cd = document.getElementById("countdown");
            if (cd) cd.innerHTML = "<p class='playfair text-3xl font-bold'>¡Llegó el gran día!</p>";
        }
    }, 1000);
})();
