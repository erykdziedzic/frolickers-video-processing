const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const os = require('os');

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
    filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov'] }],
  });
  return { canceled, filePath: filePaths[0] };
});

const ffmpegPath =
  os.platform() === 'darwin'
    ? './bin/ffmpeg-macos'
    : './bin/ffmpeg-windows.exe';

ipcMain.handle('processDesktopFile', async (_event, filePath) => {
  const command = `"${ffmpegPath}" -i "${filePath}" \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -vf "format=yuv420p,scale=1280x720" -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -b:v:0 400k -s:v:0 1280x720 -maxrate 440k -bufsize 800k -b:a:0 64k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -vf "format=yuv420p,scale=1280x720" -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -b:v:1 800k -s:v:1 1280x720 -maxrate 880k -bufsize 1600k -b:a:1 96k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -vf "format=yuv420p,scale=1920x1080" -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -b:v:2 2000k -s:v:2 1920x1080 -maxrate 2200k -bufsize 4000k -b:a:2 96k \
        -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
        -hls_time 4 -hls_playlist_type vod \
        -hls_segment_filename "./v%v/streamv_%03d.ts" \
        -master_pl_name master.m3u8 \
        -f hls ./v%v/stream.m3u8`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
});
