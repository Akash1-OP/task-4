// js/contact.js

const form = document.getElementById('contact-form');
const successMessage = document.getElementById('form-success');

form.addEventListener('submit', e => {
  e.preventDefault();

  clearErrors();

  let valid = true;

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();

  if (name === '') {
    showError('name', 'Name is required');
    valid = false;
  }

  if (email === '') {
    showError('email', 'Email is required');
    valid = false;
  } else if (!validateEmail(email)) {
    showError('email', 'Please enter a valid email');
    valid = false;
  }

  if (subject === '') {
    showError('subject', 'Subject is required');
    valid = false;
  }

  if (message === '') {
    showError('message', 'Message is required');
    valid = false;
  }

  if (!valid) return;

  // Simulate submission delay
  setTimeout(() => {
    form.reset();
    successMessage.style.display = 'block';
  }, 500);
});

function showError(fieldName, message) {
  const field = form[fieldName];
  const errorElem = field.nextElementSibling;
  errorElem.textContent = message;
}

function clearErrors() {
  const errors = form.querySelectorAll('.error-message');
  errors.forEach(e => (e.textContent = ''));
  successMessage.style.display = 'none';
}

function validateEmail(email) {
  // Simple regex for email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
