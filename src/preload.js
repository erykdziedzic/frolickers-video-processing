const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: async () => await ipcRenderer.invoke('openFile'),
  processDesktopFile: async (filePath) => await ipcRenderer.invoke('processDesktopFile', filePath),
});
