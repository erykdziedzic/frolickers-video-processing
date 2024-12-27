const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: async () => await ipcRenderer.invoke('openDirectory'),
  openFile: async () => await ipcRenderer.invoke('openFile'),
  processDesktopFile: async (filePath, outputPath) =>
    await ipcRenderer.invoke('processDesktopFile', filePath, outputPath),
  processMobileFile: async (filePath, outputPath) =>
    await ipcRenderer.invoke('processMobileFile', filePath, outputPath),
});
