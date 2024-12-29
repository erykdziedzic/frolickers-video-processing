const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
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

ipcMain.handle('openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return { canceled, path: filePaths[0] };
});

const ffmpegPath =
  os.platform() === 'darwin'
    ? './bin/ffmpeg-macos'
    : './bin/ffmpeg-windows.exe';

const getOutputPath = (outputPath, screenDirName) => {
  const dirName = path.join(outputPath, screenDirName);
  const hlsSegmentFilename = path.join(dirName, '/v%v/streamv_%03d.ts');
  const output = path.join(dirName, '/v%v/stream.m3u8');
  return { hlsSegmentFilename, output: output };
};

const DESKTOP_DIR_NAME = 'desktopVideo';

ipcMain.handle('processDesktopFile', async (_event, filePath, outputPath) => {
  const { hlsSegmentFilename, output } = getOutputPath(
    outputPath,
    DESKTOP_DIR_NAME
  );

  // prettier-ignore
  const args = [
    // Input
    '-i', filePath,
  
    // Stream 0 (400k - 720p)
    '-map', '0:v', '-map', '0:a',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-profile:v', 'high',
    '-level:v', '5.2',
    '-vf', 'format=yuv420p,scale=1280x720',
    '-x264opts', 'no-scenecut',
    '-g', '48',
    '-keyint_min', '48',
    '-sc_threshold', '0',
    '-b:v:0', '400k',
    '-s:v:0', '1280x720',
    '-maxrate', '440k',
    '-bufsize', '800k',
    '-b:a:0', '64k',
  
    // Stream 1 (800k - 720p)
    '-map', '0:v', '-map', '0:a',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-profile:v', 'high',
    '-level:v', '5.2',
    '-vf', 'format=yuv420p,scale=1280x720',
    '-x264opts', 'no-scenecut',
    '-g', '48',
    '-keyint_min', '48',
    '-sc_threshold', '0',
    '-b:v:1', '800k',
    '-s:v:1', '1280x720',
    '-maxrate', '880k',
    '-bufsize', '1600k',
    '-b:a:1', '96k',
  
    // Stream 2 (2000k - 1080p)
    '-map', '0:v', '-map', '0:a',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-profile:v', 'high',
    '-level:v', '5.2',
    '-vf', 'format=yuv420p,scale=1920x1080',
    '-x264opts', 'no-scenecut',
    '-g', '48',
    '-keyint_min', '48',
    '-sc_threshold', '0',
    '-b:v:2', '2000k',
    '-s:v:2', '1920x1080',
    '-maxrate', '2200k',
    '-bufsize', '4000k',
    '-b:a:2', '96k',
  
    // HLS specific settings
    '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
    '-hls_time', '4',
    '-hls_playlist_type', 'vod',
    '-progress', '-',
    '-nostats',
    '-hls_segment_filename', hlsSegmentFilename,
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls', output
  ];

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
});

const MOBILE_DIR_NAME = 'mobileVideo';

ipcMain.handle('processMobileFile', async (_event, filePath, outputPath) => {
  const { hlsSegmentFilename, output } = getOutputPath(
    outputPath,
    MOBILE_DIR_NAME
  );
  const command = `"${ffmpegPath}" -i "${filePath}" \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=480x852"   -b:v:0 200k  -s:v:0 480x852   -maxrate 220k -bufsize 400k -b:a:0 48k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=720x1280"  -b:v:1 400k  -s:v:1 720x1280  -maxrate 440k -bufsize 800k -b:a:1 64k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=720x1280"  -b:v:2 800k  -s:v:2 720x1280  -maxrate 880k -bufsize 1600k -b:a:2 96k \
        -map 0:v -map 0:a -c:v libx264 -c:a aac -profile:v high -level:v 5.2 -x264opts no-scenecut -g 48 -keyint_min 48 -sc_threshold 0 -vf "format=yuv420p,scale=1080x1920" -b:v:3 2000k -s:v:3 1080x1920 -maxrate 2200k -bufsize 4000k -b:a:3 96k \
        -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
        -hls_time 4 -hls_playlist_type vod \
        -hls_segment_filename "${hlsSegmentFilename}" \
        -master_pl_name master.m3u8 \
        -f hls "${output}"`;

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
