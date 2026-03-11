// Notifications logic

async function loadNotifications() {
  const res = await fetch('/api/notifications');
  const notifications = await res.json();
  const notifList = document.getElementById('notif-list');
  notifList.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.type}">
      <strong>${n.title}</strong><br>
      <span>${n.message}</span><br>
      <span style="font-size:0.85rem;color:#aaa;">${new Date(n.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join('');
}

document.getElementById('mark-read').onclick = async () => {
  await fetch('/api/notifications/read', { method: 'POST' });
  loadNotifications();
};
document.getElementById('close-notif').onclick = () => {
  window.location.href = 'dashboard.html';
};

window.onload = loadNotifications;
