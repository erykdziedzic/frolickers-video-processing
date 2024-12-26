export interface IElectronAPI {
  openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
