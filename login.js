// Login logic matching React design

document.getElementById('login-form').onsubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      window.location.href = 'dashboard.html';
    } else {
      const data = await res.json();
      errorDiv.textContent = data.message || 'Login failed.';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error.';
  }
};
