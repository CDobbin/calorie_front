const API_URL = 'https://calorie-api-e5my.onrender.com';

window.addEventListener('DOMContentLoaded', () => {
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const message = document.getElementById('message');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      loginBtn.disabled = true;
      message.textContent = 'Logging in...';
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.value.trim(), password: password.value })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          message.textContent = 'Login successful! Redirecting...';
          setTimeout(() => { window.location.href = 'app.html'; }, 1000);
        } else {
          message.textContent = data.error || 'Login failed';
        }
      } catch (error) {
        message.textContent = 'Error: Unable to connect to server';
      } finally {
        loginBtn.disabled = false;
      }
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      registerBtn.disabled = true;
      message.textContent = 'Registering...';
      try {
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
      } catch (error) {
        message.textContent = 'Error: Unable to connect to server';
      } finally {
        registerBtn.disabled = false;
      }
    });
  }
});