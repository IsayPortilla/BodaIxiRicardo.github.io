const slider = document.querySelector(".slider");
let startX = 0;
let index = 0;

slider.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

slider.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (diff < -50) index++;
  if (diff > 50) index--;
  index = Math.max(0, Math.min(index, slider.children.length - 1));
  slider.style.transform = `translateX(-${index * 100}%)`;
});
