process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { app, BrowserWindow } from 'electron';
import path from 'path'
import { isDev } from './utils';

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.maximize();

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