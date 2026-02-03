const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("active");
  });
}, { threshold: 0.5 });

document.querySelectorAll(".scene, .event")
  .forEach(el => observer.observe(el));
