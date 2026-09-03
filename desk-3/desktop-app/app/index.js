import { app, BrowserWindow } from "electron";

function createWindow() {
    const window = new BrowserWindow({
        title: "Groq Multi-LLM Studio",
        height: 850,
        width: 1280,
        minWidth: 960,
        minHeight: 650,
        backgroundColor: '#09090b',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    window.loadURL('http://localhost:5174/')
}

app.whenReady().then(createWindow);