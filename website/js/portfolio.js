document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector(".theme-toggle");
  const body = document.body;
  const icon = themeToggle.querySelector("i");

  // Initialize theme from localStorage or system preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    body.classList.add("dark-theme");
    icon.classList.replace("fa-moon", "fa-sun");
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
    if (body.classList.contains("dark-theme")) {
      icon.classList.replace("fa-moon", "fa-sun");
      localStorage.setItem("theme", "dark");
    } else {
      icon.classList.replace("fa-sun", "fa-moon");
      localStorage.setItem("theme", "light");
    }
  });

  // Smooth scrolling for nav links
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
      if (link.hash) {
        e.preventDefault();
        document.querySelector(link.hash).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Portfolio cards animation on scroll
  const cards = document.querySelectorAll('.portfolio-card');

  function revealOnScroll() {
    const triggerBottom = window.innerHeight * 0.85;
    cards.forEach(card => {
      const cardTop = card.getBoundingClientRect().top;
      if (cardTop < triggerBottom) {
        card.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // initial check

  // Filter projects by category
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category;

      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'flex';
          // Trigger animation again if needed
          setTimeout(() => card.classList.add('visible'), 50);
        } else {
          card.style.display = 'none';
          card.classList.remove('visible');
        }
      });
    });
  });

  // Particle background (simple floating dots)
  const particlesContainer = document.createElement('canvas');
  particlesContainer.classList.add('particles');
  document.querySelector('.portfolio-hero').appendChild(particlesContainer);

  const ctx = particlesContainer.getContext('2d');
  let particlesArray;

  function initParticles() {
    particlesContainer.width = window.innerWidth;
    particlesContainer.height = document.querySelector('.portfolio-hero').offsetHeight;
    particlesArray = [];
    const numberOfParticles = 50;
    for(let i=0; i<numberOfParticles; i++) {
      particlesArray.push({
        x: Math.random() * particlesContainer.width,
        y: Math.random() * particlesContainer.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
      });
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, particlesContainer.width, particlesContainer.height);
    particlesArray.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if(p.x < 0 || p.x > particlesContainer.width) p.speedX = -p.speedX;
      if(p.y < 0 || p.y > particlesContainer.height) p.speedY = -p.speedY;
    });
    requestAnimationFrame(animateParticles);
  }

  initParticles();
  animateParticles();

  window.addEventListener('resize', () => {
    initParticles();
  });
});
