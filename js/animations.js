document.querySelectorAll('.letra-animada').forEach(el => {
  const text = el.innerText;
  el.innerHTML = '';
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.opacity = 0;
    span.style.animation = `fadeLetter .4s ease forwards`;
    span.style.animationDelay = `${i * 0.1}s`;
    el.appendChild(span);
  });
});

const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeLetter {
  to { opacity: 1; }
}`;
document.head.appendChild(style);
