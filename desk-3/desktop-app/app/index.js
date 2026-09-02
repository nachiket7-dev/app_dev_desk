import { app, BrowserWindow } from "electron";

function createWindow() {
    const window = new BrowserWindow({
        height: 600,
        width: 600,
    })

    window.loadURL('http://localhost:5174/')
    window.webContents.openDevTools();
}

app.whenReady().then(createWindow);