export interface IElectronAPI {
  openDirectory: () => Promise<{ canceled: boolean; path?: string }>;
  openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  processDesktopFile: (filePath: string, outputPath?: string) => Promise<void>;
  processMobileFile: (filePath: string, outputPath?: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
