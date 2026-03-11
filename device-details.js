// Device details logic

// Get device id from query string
function getDeviceId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadDeviceDetails() {
  const id = getDeviceId();
  if (!id) return;
  const res = await fetch(`/api/devices/${id}`);
  const device = await res.json();
  const details = document.getElementById('device-details');

  let controls = '';
  if (device.type === 'light') {
    controls += `<label>Brightness: <input type="range" min="0" max="100" value="${device.state.brightness || 100}" id="brightness"></label>`;
  }
  if (device.type === 'thermostat') {
    controls += `<label>Temperature: <input type="range" min="16" max="30" value="${device.state.temp || 22}" id="temp"></label>`;
    controls += `<div>Mode: <button id="mode-cool">Cool</button> <button id="mode-heat">Heat</button> <button id="mode-eco">Eco</button></div>`;
  }

  details.innerHTML = `
    <div class="details-title">${device.name} (${device.type})</div>
    <div class="details-room">Room: ${device.room}</div>
    <div class="details-controls">${controls}</div>
    <div class="details-actions">
      <button id="toggle">Toggle Power</button>
      <button id="close">Close</button>
    </div>
    <div class="details-history">
      <div class="details-history-title">Activity History</div>
      <div class="details-history-list" id="history-list"></div>
    </div>
  `;

  // Controls
  if (device.type === 'light') {
    document.getElementById('brightness').oninput = async e => {
      await fetch(`/api/devices/${id}/state`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ brightness: e.target.value })
      });
    };
  }
  if (device.type === 'thermostat') {
    document.getElementById('temp').oninput = async e => {
      await fetch(`/api/devices/${id}/state`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ temp: e.target.value })
      });
    };
    ['cool','heat','eco'].forEach(mode => {
      document.getElementById(`mode-${mode}`).onclick = async () => {
        await fetch(`/api/devices/${id}/state`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ mode })
        });
      };
    });
  }
  document.getElementById('toggle').onclick = async () => {
    await fetch(`/api/devices/${id}/toggle`, { method: 'POST' });
    loadDeviceDetails();
  };
  document.getElementById('close').onclick = () => {
    window.location.href = 'dashboard.html';
  };

  // Load history
  const historyRes = await fetch(`/api/devices/${id}/history`);
  const history = await historyRes.json();
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = history.reverse().map(h => `<div class="details-history-item">${new Date(h.timestamp).toLocaleTimeString()} - ${device.type === 'light' ? h.state.brightness : h.state.temp}</div>`).join('');
}

window.onload = loadDeviceDetails;
