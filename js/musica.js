const music = document.getElementById("bgMusic");
const btn = document.getElementById("musicBtn");
let playing = false;

btn.onclick = () => {
  if (!playing) {
    music.volume = 0;
    music.play();
    fade(0, 1);
  } else {
    fade(1, 0);
  }
  playing = !playing;
};

function fade(from, to) {
  let v = from;
  const step = (to - from) / 20;
  const i = setInterval(() => {
    v += step;
    music.volume = Math.max(0, Math.min(1, v));
    if ((step > 0 && v >= to) || (step < 0 && v <= to)) {
      if (to === 0) music.pause();
      clearInterval(i);
    }
  }, 100);
}
