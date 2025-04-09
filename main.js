const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('download-playlist', async (event, url) => {
  const outputDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const command = `yt-dlp -o "${outputDir}/%(title)s.%(ext)s" -x --audio-format mp3 "${url}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      event.reply('download-error', stderr);
      return;
    }

    const outputZip = path.join(__dirname, 'playlist.zip');
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      event.reply('download-complete', outputZip);
    });

    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  });
});
