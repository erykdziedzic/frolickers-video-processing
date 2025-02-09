const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');

let win;

app.on('ready', () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
});

ipcMain.handle('openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Videos',
        extensions: ['mp4', 'mkv', 'avi', 'mov', 'm4v', 'flv', 'wmv', 'webm', 'mpeg', 'mpg', '3gp', 'ogv'],
      },
    ],
  });
  return { canceled, filePath: filePaths[0] };
});

ipcMain.handle('openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return { canceled, path: filePaths[0] };
});

const ffmpegPath = path.join(__dirname, app.isPackaged ? '../../bin' : '../bin', 'ffmpeg-macos');

const getOutputPath = (outputPath, screenDirName) => {
  const dirName = path.join(outputPath, screenDirName);
  const hlsSegmentFilename = path.join(dirName, '/v%v/streamv_%03d.ts');
  const output = path.join(dirName, '/v%v/stream.m3u8');
  return { hlsSegmentFilename, output };
};

const DESKTOP_DIR_NAME = 'desktopVideo';
const MOBILE_DIR_NAME = 'mobileVideo';

const processFile = (filePath, outputPath, dirName, videoConfigs) => {
  const { hlsSegmentFilename, output } = getOutputPath(outputPath, dirName);

  // prettier-ignore
  const args = 
    ['-i', filePath].concat(videoConfigs.flatMap((config, index) => [
    '-map', '0:v', '-map', '0:a',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-profile:v', 'high',
    '-level:v', '5.2',
    '-vf', `format=yuv420p,scale=${config.scale}`,
    '-x264opts', 'no-scenecut',
    '-g', '48',
    '-keyint_min', '48',
    '-sc_threshold', '0',
    `-b:v:${index}`, config.bitrate,
    `-s:v:${index}`, config.scale,
    `-maxrate:${index}`, config.maxrate,
    `-bufsize:${index}`, config.bufsize,
    `-b:a:${index}`, config.audioBitrate,
  ])).concat([
    '-var_stream_map', videoConfigs.map((_, i) => `v:${i},a:${i}`).join(' '),
    '-hls_time', '4',
    '-hls_playlist_type', 'vod',
    '-progress', '-',
    '-nostats',
    '-hls_segment_filename', hlsSegmentFilename,
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls', output,
  ]);

  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args);
    let duration = 0;

    process.stderr.on('data', (data) => {
      const match = data.toString().match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        duration = hours * 3600 + minutes * 60 + seconds;
      }
    });

    process.stdout.on('data', (data) => {
      const progress = data.toString();
      const timeMatch = progress.match(/out_time_ms=(\d+)/);
      if (timeMatch) {
        const timeMs = parseInt(timeMatch[1]) / 1000000;
        const percentage = (timeMs / duration) * 100;
        win.webContents.send('ffmpeg-progress', {
          percentage: Math.min(100, Math.round(percentage)),
          timeProcessed: timeMs,
          duration,
        });
      }
    });

    process.on('error', (error) => reject(error.message));
    process.on('close', (code) => {
      if (code === 0) {
        resolve('Success');
      } else {
        reject(`FFmpeg process exited with code ${code}`);
      }
    });
  });
};

ipcMain.handle('processDesktopFile', (_event, filePath, outputPath) => {
  const videoConfigs = [
    { scale: '1280x720', bitrate: '400k', maxrate: '440k', bufsize: '800k', audioBitrate: '64k' },
    { scale: '1280x720', bitrate: '800k', maxrate: '880k', bufsize: '1600k', audioBitrate: '96k' },
    { scale: '1920x1080', bitrate: '2000k', maxrate: '2200k', bufsize: '4000k', audioBitrate: '96k' },
  ];
  return processFile(filePath, outputPath, DESKTOP_DIR_NAME, videoConfigs);
});

ipcMain.handle('processMobileFile', (_event, filePath, outputPath) => {
  const videoConfigs = [
    { scale: '480x852', bitrate: '200k', maxrate: '220k', bufsize: '400k', audioBitrate: '48k' },
    { scale: '720x1280', bitrate: '400k', maxrate: '440k', bufsize: '800k', audioBitrate: '64k' },
    { scale: '720x1280', bitrate: '800k', maxrate: '880k', bufsize: '1600k', audioBitrate: '96k' },
    { scale: '1080x1920', bitrate: '2000k', maxrate: '2200k', bufsize: '4000k', audioBitrate: '96k' },
  ];
  return processFile(filePath, outputPath, MOBILE_DIR_NAME, videoConfigs);
});
