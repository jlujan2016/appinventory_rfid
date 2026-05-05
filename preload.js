const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendLogin: (username, password) => ipcRenderer.invoke('login', username, password),
        // 👉 NUEVO: datos del dashboard
    getDashboardData: () => 
        ipcRenderer.invoke('dashboard-data'),
        // 🆕 RFID WINDOW
    openRFID: () =>
        ipcRenderer.invoke('open-rfid-window')
});