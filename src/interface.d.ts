export interface IElectronAPI {
  openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  processDesktopFile: (filePath: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
