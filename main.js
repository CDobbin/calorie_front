const API_URL = 'https://calorie-api-e5my.onrender.com';

window.addEventListener('DOMContentLoaded', () => {
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const message = document.getElementById('message');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.user_id);
        window.location.href = 'app.html';
      } else {
        message.textContent = data.error || 'Login failed';
      }
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      const data = await res.json();
      if (res.ok) {
        message.textContent = 'Registration successful. Please log in.';
      } else {
        message.textContent = data.error || 'Registration failed';
      }
    });
  }
});