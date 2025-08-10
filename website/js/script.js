// ===== Dynamic Greeting =====
function setGreeting() {
    const greetingEl = document.getElementById('greeting');
    const hour = new Date().getHours();
    let greetingText = "";

    if (hour < 12) {
        greetingText = "Good Morning, Welcome to My Portfolio!";
    } else if (hour < 18) {
        greetingText = "Good Afternoon, Welcome to My Portfolio!";
    } else {
        greetingText = "Good Evening, Welcome to My Portfolio!";
    }

    greetingEl.textContent = greetingText;
}
setGreeting();

// ===== Typing Effect =====
const roles = ["Web Developer", "App Creator", "UI Designer"];
let roleIndex = 0;
let charIndex = 0;
const typingEl = document.querySelector(".typing");

function typeEffect() {
    if (charIndex < roles[roleIndex].length) {
        typingEl.textContent += roles[roleIndex].charAt(charIndex);
        charIndex++;
        setTimeout(typeEffect, 100);
    } else {
        setTimeout(eraseEffect, 1500);
    }
}

function eraseEffect() {
    if (charIndex > 0) {
        typingEl.textContent = roles[roleIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(eraseEffect, 50);
    } else {
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(typeEffect, 300);
    }
}
typeEffect();

// ===== Theme Toggle =====
const themeToggle = document.querySelector(".theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");

    // Change icon
    const icon = themeToggle.querySelector("i");
    if (document.body.classList.contains("dark-theme")) {
        icon.classList.replace("fa-moon", "fa-sun");
        localStorage.setItem("theme", "dark");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
        localStorage.setItem("theme", "light");
    }
});

// Load theme from localStorage
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    themeToggle.querySelector("i").classList.replace("fa-moon", "fa-sun");
}

// ===== Scroll Reveal Animation =====
const featureCards = document.querySelectorAll(".feature-card");

function revealOnScroll() {
    const triggerBottom = window.innerHeight * 0.85;

    featureCards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < triggerBottom) {
            card.classList.add("show");
        } else {
            card.classList.remove("show");
        }
    });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();
