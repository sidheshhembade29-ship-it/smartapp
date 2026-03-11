export interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera';
  state: any;
  room: string;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export interface HistoryEntry {
  id: number;
  device_id: string;
  state: any;
  timestamp: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  accentColor: string;
  notificationsEnabled: boolean;
}

export interface Automation {
  id: number;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}
