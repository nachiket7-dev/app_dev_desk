import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

let window = null;
let startTimestamp = null;
let timerInterval = null;

const AUTO_QUIT_DURATION_MS = 60 * 1000; 

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function createWindow() {
    window = new BrowserWindow({
        height: 1000,
        width: 1000,
        webPreferences: {
            devTools: true,
            preload: path.join(import.meta.dirname, 'preload.js')
        }
    });

    window.loadURL('http://localhost:5176');

    window.on('closed', () => {
        stopTimer();
        window = null;
    });
}

ipcMain.handle('start-timer', () => {
    stopTimer();
    startTimestamp = Date.now();

    timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startTimestamp) / 1000);

        if (window && !window.isDestroyed()) {
            window.webContents.send('timer', elapsedSec);
        }

        if (Date.now() - startTimestamp >= AUTO_QUIT_DURATION_MS) {
            stopTimer();
            if (window && !window.isDestroyed()) {
                window.close();
            } else {
                app.quit();
            }
        }
    }, 1000);
});

ipcMain.handle('quit-app', () => {
    stopTimer();
    if (window && !window.isDestroyed()) {
        window.close();
    } else {
        app.quit();
    }
});

app.on('window-all-closed', () => {
    app.quit();
});

app.whenReady().then(createWindow);