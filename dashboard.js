// Dashboard logic for device list, notifications, and settings

// Fetch devices from backend
async function loadDevices() {
  const res = await fetch('/api/devices');
  const devices = await res.json();
  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';
  devices.forEach(device => {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.innerHTML = `
      <div class="device-title">${device.name} (${device.type})</div>
      <div>Room: ${device.room}</div>
      <div class="device-controls">
        ${device.type === 'light' ? `<label>Brightness: <input type="range" min="0" max="100" value="${device.state.brightness || 100}" data-id="${device.id}" data-type="brightness"></label>` : ''}
        ${device.type === 'thermostat' ? `<label>Temperature: <input type="range" min="16" max="30" value="${device.state.temp || 22}" data-id="${device.id}" data-type="temp"></label>` : ''}
        <button data-id="${device.id}" data-type="toggle">Toggle Power</button>
      </div>
    `;
    deviceList.appendChild(card);
  });
}

// Handle device control events
function setupDeviceControls() {
  document.getElementById('device-list').addEventListener('input', async e => {
    if (e.target.dataset.type === 'brightness' || e.target.dataset.type === 'temp') {
      const id = e.target.dataset.id;
      const value = e.target.value;
      const type = e.target.dataset.type;
      await fetch(`/api/devices/${id}/state`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ [type]: value })
      });
    }
  });
  document.getElementById('device-list').addEventListener('click', async e => {
    if (e.target.dataset.type === 'toggle') {
      const id = e.target.dataset.id;
      await fetch(`/api/devices/${id}/toggle`, { method: 'POST' });
      loadDevices();
    }
  });
}

// Fetch notifications
async function loadNotifications() {
  const res = await fetch('/api/notifications');
  const notifications = await res.json();
  const center = document.getElementById('notification-center');
  center.innerHTML = `<button id="show-notifications">Notifications (${notifications.filter(n => !n.read).length})</button>`;
  document.getElementById('show-notifications').onclick = () => {
    alert(notifications.map(n => `${n.title}: ${n.message}`).join('\n'));
  };
}

// Settings tab
function renderSettingsTab() {
  const tab = document.getElementById('settings-tab');
  tab.innerHTML = `
    <div class="settings-section">
      <h2>Settings</h2>
      <label>Theme:
        <select id="theme-select">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      <label>Accent Color:
        <input type="color" id="accent-color" value="#10b981">
      </label>
    </div>
  `;
  document.getElementById('theme-select').onchange = e => {
    document.body.style.background = e.target.value === 'dark' ? '#0a0a0a' : '#fff';
    document.body.style.color = e.target.value === 'dark' ? '#fff' : '#222';
  };
  document.getElementById('accent-color').oninput = e => {
    document.documentElement.style.setProperty('--accent-color', e.target.value);
  };
}

window.onload = () => {
  loadDevices();
  setupDeviceControls();
  loadNotifications();
  renderSettingsTab();
};
