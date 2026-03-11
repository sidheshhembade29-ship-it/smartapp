/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Thermometer, 
  Lock, 
  Camera, 
  Power, 
  Settings, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  MessageSquare,
  Filter,
  X,
  Clock,
  Zap,
  Sliders,
  Bell,
  Palette,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Device, User, Automation, HistoryEntry, Notification, UserSettings } from './types';
import { GoogleGenAI } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const NotificationCenter = ({ notifications, onRead }: { notifications: Notification[], onRead: () => void }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative group">
      <button className="relative p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
      
      <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Notifications</h3>
          <button onClick={onRead} className="text-xs text-emerald-500 font-bold hover:underline">Mark all as read</button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No notifications</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-2xl border ${n.read ? 'bg-white/5 border-white/5 opacity-60' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="flex items-start gap-3">
                  {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-1" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />}
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{n.title}</h4>
                    <p className="text-xs text-white/60 mt-1">{n.message}</p>
                    <span className="text-[10px] text-white/30 mt-2 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DeviceDetails = ({ device, onToggle, onClose }: { device: Device, onToggle: (id: string, newState: any) => void, onClose: () => void }) => {
  const [brightness, setBrightness] = useState(device.state.brightness || 100);
  const [temp, setTemp] = useState(device.state.temp || 22);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch(`/api/devices/${device.id}/history`)
      .then(res => res.json())
      .then(data => setHistory(data.reverse()));
  }, [device.id]);

  const chartData = history.map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: device.type === 'light' ? h.state.brightness : h.state.temp
  }));

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBrightness(val);
    onToggle(device.id, { ...device.state, brightness: val });
  };

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTemp(val);
    onToggle(device.id, { ...device.state, temp: val });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/5">
        <div className={`p-4 rounded-2xl ${device.state.on || !device.state.locked || device.state.active ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white'}`}>
          {device.type === 'light' && <Lightbulb className="w-8 h-8" />}
          {device.type === 'thermostat' && <Thermometer className="w-8 h-8" />}
          {device.type === 'lock' && <Lock className="w-8 h-8" />}
          {device.type === 'camera' && <Camera className="w-8 h-8" />}
        </div>
        <div>
          <h4 className="text-2xl font-bold">{device.name}</h4>
          <p className="text-white/40">{device.room} • {device.type.charAt(0).toUpperCase() + device.type.slice(1)}</p>
        </div>
      </div>

      {(device.type === 'light' || device.type === 'thermostat') && (
        <div className="h-48 w-full">
          <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Activity History</h5>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-6">
        {device.type === 'light' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold">Brightness</span>
              <span className="text-emerald-500 font-bold">{brightness}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={brightness} 
              onChange={handleBrightnessChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        {device.type === 'thermostat' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold">Temperature</span>
              <span className="text-emerald-500 font-bold">{temp}°C</span>
            </div>
            <input 
              type="range" 
              min="16" max="30" 
              value={temp} 
              onChange={handleTempChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="grid grid-cols-3 gap-2">
              {['cool', 'heat', 'eco'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => onToggle(device.id, { ...device.state, mode })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${device.state.mode === mode ? 'bg-emerald-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-white/5 flex gap-4">
          <button 
            onClick={() => {
              let newState = { ...device.state };
              if (device.type === 'light') newState.on = !newState.on;
              if (device.type === 'lock') newState.locked = !newState.locked;
              if (device.type === 'camera') newState.active = !newState.active;
              onToggle(device.id, newState);
            }}
            className="flex-1 bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-colors"
          >
            Toggle Power
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ username, settings, onUpdate }: { username: string, settings: UserSettings, onUpdate: (s: UserSettings) => void }) => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Settings</h2>
        <p className="text-white/40">Personalize your Lumina experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold">Appearance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Theme</span>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => onUpdate({ ...settings, theme: 'dark' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => onUpdate({ ...settings, theme: 'light' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}
                >
                  Light
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Accent Color</span>
              <div className="flex gap-2">
                {['#10b981', '#6366f1', '#f59e0b', '#ef4444'].map(color => (
                  <button 
                    key={color}
                    onClick={() => onUpdate({ ...settings, accentColor: color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${settings.accentColor === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold">Notifications</h3>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium block">Push Notifications</span>
              <span className="text-xs text-white/30">Get alerts for security events</span>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.notificationsEnabled ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const AddDeviceForm = ({ onAdd, onClose }: { onAdd: (device: Partial<Device>) => void, onClose: () => void }) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('Living Room');
  const [type, setType] = useState<'light' | 'thermostat' | 'lock' | 'camera'>('light');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${type}-${Date.now()}`;
    const initialState = type === 'light' ? { on: false, brightness: 100 } :
                        type === 'thermostat' ? { temp: 22, mode: 'cool' } :
                        type === 'lock' ? { locked: true } :
                        { active: true };
    onAdd({ id, name, room, type, state: initialState });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Device Name</label>
        <input 
          type="text" 
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
          placeholder="e.g. Desk Lamp"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Room</label>
          <select 
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
          >
            {['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Outdoor', 'Hallway'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Type</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
          >
            {['light', 'thermostat', 'lock', 'camera'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-4 flex gap-4">
        <button type="submit" className="flex-1 bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400">
          Add Device
        </button>
        <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10">
          Cancel
        </button>
      </div>
    </form>
  );
};

const AutomationsTab = ({ role }: { role: 'admin' | 'user' }) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      setAutomations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: number, enabled: boolean) => {
    if (role !== 'admin') return; // Extra safety check
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
    try {
      await fetch(`/api/automations/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
    } catch (err) {
      fetchAutomations();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Automations</h2>
          <p className="text-white/40">Set rules to make your home smarter.</p>
        </div>
        {role === 'admin' && (
          <button className="bg-emerald-500 text-black p-3 rounded-2xl hover:bg-emerald-400 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(2).fill(0).map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)
        ) : (
          automations.map(auto => (
            <div key={auto.id} className="bg-[#1a1a1a] border border-white/10 p-6 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${auto.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{auto.name}</h4>
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{auto.trigger} → {auto.action}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleAutomation(auto.id, !auto.enabled)}
                disabled={role !== 'admin'}
                className={`w-12 h-6 rounded-full relative transition-colors ${auto.enabled ? 'bg-emerald-500' : 'bg-white/10'} ${role !== 'admin' ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${auto.enabled ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Lumina</h1>
          <p className="text-white/50 text-sm">Smart Home Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-white/30 text-xs">Demo: admin / password</p>
        </div>
      </motion.div>
    </div>
  );
};

const DeviceCard = ({ device, onToggle }: { device: Device, onToggle: (id: string, newState: any) => void }) => {
  const getIcon = () => {
    switch (device.type) {
      case 'light': return <Lightbulb className="w-6 h-6" />;
      case 'thermostat': return <Thermometer className="w-6 h-6" />;
      case 'lock': return <Lock className="w-6 h-6" />;
      case 'camera': return <Camera className="w-6 h-6" />;
    }
  };

  const isActive = () => {
    if (device.type === 'light') return device.state.on;
    if (device.type === 'lock') return !device.state.locked;
    if (device.type === 'thermostat') return true;
    if (device.type === 'camera') return device.state.active;
    return false;
  };

  const handleToggle = () => {
    let newState = { ...device.state };
    if (device.type === 'light') newState.on = !newState.on;
    if (device.type === 'lock') newState.locked = !newState.locked;
    if (device.type === 'camera') newState.active = !newState.active;
    onToggle(device.id, newState);
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-5 rounded-3xl border transition-all cursor-pointer ${
        isActive() 
          ? 'bg-emerald-500 border-emerald-400 text-black' 
          : 'bg-white/5 border-white/10 text-white'
      }`}
      onClick={handleToggle}
    >
      <div className="flex justify-between items-start mb-8">
        <div className={`p-3 rounded-2xl ${isActive() ? 'bg-black/10' : 'bg-white/5'}`}>
          {getIcon()}
        </div>
        <div className={`w-10 h-5 rounded-full relative transition-colors ${isActive() ? 'bg-black/20' : 'bg-white/10'}`}>
          <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${isActive() ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg leading-tight">{device.name}</h3>
        <p className={`text-xs font-medium uppercase tracking-wider opacity-60`}>
          {device.room}
        </p>
      </div>
      {device.type === 'thermostat' && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-2xl font-bold">{device.state.temp}°C</span>
          <span className="text-xs uppercase font-bold opacity-60">{device.state.mode}</span>
        </div>
      )}
    </motion.div>
  );
};

const SmartAssistant = ({ devices }: { devices: Device[] }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Lumina, a smart home assistant. Current devices: ${JSON.stringify(devices)}. User says: ${prompt}. Provide a helpful, concise response about the home state or suggestions.`,
      });
      const res = await model;
      setResponse(res.text || 'No response');
    } catch (err) {
      setResponse('AI service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold">Smart Assistant</h2>
      </div>
      <div className="space-y-4">
        {response && (
          <div className="bg-white/5 rounded-2xl p-4 text-sm text-white/80 border border-white/5">
            {response}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about your home..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button 
            onClick={askAI}
            disabled={loading}
            className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automations' | 'settings'>('dashboard');
  const [roomFilter, setRoomFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ theme: 'dark', accentColor: '#10b981', notificationsEnabled: true });

  useEffect(() => {
    fetchDevices();
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/settings/${user.username}`);
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      await fetch(`/api/settings/${user.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDevice = async (id: string, state: any) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, state } : d));
    if (selectedDevice?.id === id) {
      setSelectedDevice(prev => prev ? { ...prev, state } : null);
    }
    
    try {
      await fetch(`/api/devices/${id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      fetchNotifications(); // Refresh notifications in case an alert was triggered
    } catch (err) {
      fetchDevices();
    }
  };

  const addDevice = async (device: Partial<Device>) => {
    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      });
      setIsAddModalOpen(false);
      fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDevices = devices.filter(d => {
    const roomMatch = roomFilter === 'All' || d.room === roomFilter;
    const typeMatch = typeFilter === 'All' || d.type === typeFilter;
    return roomMatch && typeMatch;
  });

  const rooms = ['All', ...new Set(devices.map(d => d.room))];
  const types = ['All', 'light', 'thermostat', 'lock', 'camera'];

  return (
    <div className={`min-h-screen flex transition-colors ${settings.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'}`} style={{ '--emerald-500': settings.accentColor } as any}>
      {/* Sidebar */}
      <aside className={`w-20 md:w-64 border-r flex flex-col p-6 ${settings.theme === 'light' ? 'bg-white border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">Lumina</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'automations', icon: Zap, label: 'Automations' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${
                activeTab === item.id ? 'bg-emerald-500/10 text-emerald-500' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-medium hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span className="font-medium hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Welcome back, {user.name}</h2>
            <p className="text-white/40">Everything is running smoothly today. {user.role === 'admin' ? '(Admin Access)' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter notifications={notifications} onRead={markNotificationsRead} />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="font-bold">24°C</span>
            </div>
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Devices Grid */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold">Devices</h3>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Filter className="w-4 h-4 ml-2 text-white/40" />
                        <select 
                          value={roomFilter}
                          onChange={(e) => setRoomFilter(e.target.value)}
                          className="bg-transparent text-xs font-bold py-1 pr-2 focus:outline-none"
                        >
                          {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <Sliders className="w-4 h-4 ml-2 text-white/40" />
                        <select 
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="bg-transparent text-xs font-bold py-1 pr-2 focus:outline-none"
                        >
                          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                      </div>
                      {user.role === 'admin' && (
                        <button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-emerald-500 text-black p-2 rounded-xl hover:bg-emerald-400 shrink-0"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 animate-pulse rounded-3xl" />
                      ))
                    ) : (
                      filteredDevices.map(device => (
                        <div key={device.id} onClick={() => setSelectedDevice(device)}>
                          <DeviceCard device={device} onToggle={toggleDevice} />
                        </div>
                      ))
                    )}
                    {!loading && filteredDevices.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-white/40">No devices found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-500 mb-2">Security System</h3>
                    <p className="text-white/60 text-sm max-w-md">Your home is currently protected. All windows and doors are locked.</p>
                  </div>
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="w-10 h-10 text-black" />
                  </div>
                </section>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                <SmartAssistant devices={devices} />
                
                <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6">
                  <h3 className="font-bold mb-4">Energy Usage</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-white/40 uppercase font-bold">This Month</span>
                      <span className="text-2xl font-bold">142 kWh</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[65%]" />
                    </div>
                    <p className="text-xs text-white/40">12% less than last month. Great job!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'automations' ? (
            <motion.div 
              key="automations-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AutomationsTab role={user.role} />
            </motion.div>
          ) : (
            <motion.div 
              key="settings-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsTab username={user.username} settings={settings} onUpdate={updateSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Device"
      >
        <AddDeviceForm onAdd={addDevice} onClose={() => setIsAddModalOpen(false)} />
      </Modal>

      <Modal 
        isOpen={!!selectedDevice} 
        onClose={() => setSelectedDevice(null)} 
        title="Device Control"
      >
        {selectedDevice && (
          <DeviceDetails 
            device={selectedDevice} 
            onToggle={toggleDevice} 
            onClose={() => setSelectedDevice(null)} 
          />
        )}
      </Modal>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="font-sans selection:bg-emerald-500 selection:text-black">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <Dashboard user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
