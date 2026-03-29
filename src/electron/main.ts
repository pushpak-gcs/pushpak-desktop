process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path'
import { isDev } from './utils';
import { MavlinkManager } from './mavlink-manager';
import { setupMavlinkIPC } from './electron-ipc-handlers';

const mavlinkManager = new MavlinkManager();

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.maximize();

    setupMavlinkIPC(ipcMain, mavlinkManager, mainWindow);
    // Don't auto-connect - wait for user to click connect button
    // mavlinkManager.start();

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5123');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('before-quit', () => {
    mavlinkManager.stop();
});