const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const expressServer = require('./dist/server.cjs');

// Disable hardware acceleration to prevent black screens on some systems
app.disableHardwareAcceleration();

let mainWindow;

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

  // Since server.cjs starts Express on 5199 natively
  // We just point electron to the localhost URL
  const loadUrl = () => {
    mainWindow.loadURL('http://localhost:5199').catch(() => {
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
  // Start the express server
  expressServer;
  
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
