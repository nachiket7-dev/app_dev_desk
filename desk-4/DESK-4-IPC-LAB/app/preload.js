// import { contextBridge, ipcRenderer } from 'electron';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musicAPI', {
  start: (message) => {
    ipcRenderer.invoke('start', 'Start the songs', message);
  }
});