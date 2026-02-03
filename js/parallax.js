window.addEventListener("scroll", () => {
  document.querySelectorAll(".parallax img").forEach(img => {
    const speed = img.dataset.speed;
    img.style.transform = `translateY(${window.scrollY * speed}px)`;
  });
});
