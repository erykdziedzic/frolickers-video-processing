export interface FFmpegProgress {
  percentage: number;
  timeProcessed: number;
  duration: number;
}

export interface IElectronAPI {
  openDirectory: () => Promise<{ canceled: boolean; path?: string }>;
  openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
  processDesktopFile: (filePath: string, outputPath?: string) => Promise<void>;
  processMobileFile: (filePath: string, outputPath?: string) => Promise<void>;
  onProgress: (callback: (progress: FFmpegProgress) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
