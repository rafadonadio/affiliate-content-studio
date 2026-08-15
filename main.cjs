const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Disable hardware acceleration to prevent black screens on some systems
app.disableHardwareAcceleration();

let mainWindow;

// You can change this URL once you deploy to Render.
const RENDER_URL = 'https://afs-manager.onrender.com';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "Affiliate Content Studio"
  });

  const loadUrl = () => {
    const url = app.isPackaged ? RENDER_URL : 'http://localhost:5199';
    mainWindow.loadURL(url).catch(() => {
      // If server isn't up yet, retry in 500ms
      setTimeout(loadUrl, 500);
    });
  };
  
  loadUrl();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
