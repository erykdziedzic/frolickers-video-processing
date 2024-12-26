const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const os = require('os');

let win;

app.on('ready', () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
});

ipcMain.handle('process-file', async (_event: unknown, filePath: string) => {
  const ffmpegPath =
    os.platform() === 'darwin'
      ? './bin/ffmpeg-macos'
      : './bin/ffmpeg-windows.exe';

  const command = `"${ffmpegPath}" -i "${filePath}" \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=480x852" -b:v:0 200k -s:v:0 480x852 -maxrate 220k -bufsize 400k -b:a:0 48k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=720x1280" -b:v:1 400k -s:v:1 720x1280 -maxrate 440k -bufsize 800k -b:a:1 64k \
        -var_stream_map "v:0,a:0 v:1,a:1" \
        -hls_time 4 -hls_playlist_type vod \
        -hls_segment_filename "./output/v%v/streamv_%03d.ts" \
        -master_pl_name master.m3u8 \
        -f hls ./output/v%v/stream.m3u8`;

  return new Promise((resolve, reject) => {
    exec(command, (error: Error, stdout: string, stderr: string) => {
      if (error) {
        reject(error.message);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
});
