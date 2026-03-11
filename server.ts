import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("smarthome.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    state TEXT,
    room TEXT
  );

  CREATE TABLE IF NOT EXISTS automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    trigger TEXT,
    action TEXT,
    enabled INTEGER
  );

  CREATE TABLE IF NOT EXISTS device_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    state TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    username TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    accentColor TEXT DEFAULT '#10b981',
    notificationsEnabled INTEGER DEFAULT 1
  );

  -- Add role column if it doesn't exist
  PRAGMA table_info(users);
`);

// Check if role column exists, if not add it
const tableInfo = db.prepare("PRAGMA table_info(users)").all();
if (!tableInfo.find((col: any) => col.name === 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
}

// Update admin role if not set
db.prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();

// Seed initial devices if empty
const deviceCount = db.prepare("SELECT COUNT(*) as count FROM devices").get() as { count: number };
if (deviceCount.count === 0) {
  const insert = db.prepare("INSERT INTO devices (id, name, type, state, room) VALUES (?, ?, ?, ?, ?)");
  insert.run("light-1", "Living Room Light", "light", JSON.stringify({ on: false, brightness: 80 }), "Living Room");
  insert.run("light-2", "Kitchen Light", "light", JSON.stringify({ on: true, brightness: 100 }), "Kitchen");
  insert.run("thermostat-1", "Main Thermostat", "thermostat", JSON.stringify({ temp: 22, mode: "cool" }), "Hallway");
  insert.run("lock-1", "Front Door", "lock", JSON.stringify({ locked: true }), "Entry");
  insert.run("camera-1", "Backyard Camera", "camera", JSON.stringify({ active: true }), "Outdoor");
  
  // Seed some history
  const histInsert = db.prepare("INSERT INTO device_history (device_id, state, timestamp) VALUES (?, ?, ?)");
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const time = new Date(now.getTime() - i * 3600000).toISOString();
    histInsert.run("thermostat-1", JSON.stringify({ temp: 20 + Math.random() * 5 }), time);
    histInsert.run("light-1", JSON.stringify({ brightness: 50 + Math.random() * 50 }), time);
  }
}

// Seed initial automations if empty
const autoCount = db.prepare("SELECT COUNT(*) as count FROM automations").get() as { count: number };
if (autoCount.count === 0) {
  const insert = db.prepare("INSERT INTO automations (name, trigger, action, enabled) VALUES (?, ?, ?, ?)");
  insert.run("Night Mode", "At 10:00 PM", "Lock all doors and turn off lights", 1);
  insert.run("Welcome Home", "When Front Door unlocks", "Turn on living room lights", 0);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password") {
      res.json({ success: true, user: { username: "admin", name: "Alex", role: "admin" } });
    } else if (username === "user" && password === "password") {
      res.json({ success: true, user: { username: "user", name: "Guest", role: "user" } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Devices API
  app.get("/api/devices", (req, res) => {
    const devices = db.prepare("SELECT * FROM devices").all();
    res.json(devices.map((d: any) => ({ ...d, state: JSON.parse(d.state) })));
  });

  app.get("/api/devices/:id/history", (req, res) => {
    const { id } = req.params;
    const history = db.prepare("SELECT * FROM device_history WHERE device_id = ? ORDER BY timestamp DESC LIMIT 20").all(id);
    res.json(history.map((h: any) => ({ ...h, state: JSON.parse(h.state) })));
  });

  app.post("/api/devices", (req, res) => {
    const { id, name, type, state, room } = req.body;
    db.prepare("INSERT INTO devices (id, name, type, state, room) VALUES (?, ?, ?, ?, ?)")
      .run(id, name, type, JSON.stringify(state), room);
    res.json({ success: true });
  });

  app.post("/api/devices/:id/state", (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    db.prepare("UPDATE devices SET state = ? WHERE id = ?").run(JSON.stringify(state), id);
    // Log history
    db.prepare("INSERT INTO device_history (device_id, state) VALUES (?, ?)").run(id, JSON.stringify(state));
    
    // Trigger notification for locks
    if (id.includes('lock') && state.locked === false) {
      db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)")
        .run("Security Alert", "Front Door was unlocked", "warning");
    }
    
    res.json({ success: true });
  });

  // Notifications API
  app.get("/api/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 10").all();
    res.json(notifications.map((n: any) => ({ ...n, read: !!n.read })));
  });

  app.post("/api/notifications/read", (req, res) => {
    db.prepare("UPDATE notifications SET read = 1").run();
    res.json({ success: true });
  });

  // Settings API
  app.get("/api/settings/:username", (req, res) => {
    const { username } = req.params;
    let settings = db.prepare("SELECT * FROM user_settings WHERE username = ?").get(username) as any;
    if (!settings) {
      db.prepare("INSERT INTO user_settings (username) VALUES (?)").run(username);
      settings = db.prepare("SELECT * FROM user_settings WHERE username = ?").get(username);
    }
    res.json({ ...settings, notificationsEnabled: !!settings.notificationsEnabled });
  });

  app.post("/api/settings/:username", (req, res) => {
    const { username } = req.params;
    const { theme, accentColor, notificationsEnabled } = req.body;
    db.prepare("UPDATE user_settings SET theme = ?, accentColor = ?, notificationsEnabled = ? WHERE username = ?")
      .run(theme, accentColor, notificationsEnabled ? 1 : 0, username);
    res.json({ success: true });
  });

  // Automations API
  app.get("/api/automations", (req, res) => {
    const autos = db.prepare("SELECT * FROM automations").all();
    res.json(autos.map((a: any) => ({ ...a, enabled: !!a.enabled })));
  });

  app.post("/api/automations/:id/toggle", (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;
    db.prepare("UPDATE automations SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
