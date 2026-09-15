import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { start } from "repl";

function createWindow() {
    const window = new BrowserWindow({
        height: 600,
        width: 600,
        webPreferences: {
            preload: '/Users/nachiketamlekar/App_Dev/Projects/desktop_app/desk-4/DESK-4-IPC-LAB/app/preload.js'
        }
    })

    window.loadURL('http://localhost:5174/');
    window.webContents.openDevTools();
}

app.whenReady().then(createWindow);

ipcMain.handle('start', (event, args) => {
    console.log(args)
    startMusic()
})

let musicProcess = null;

function startMusic() {
    const randomNumber = Math.floor(Math.random() * 3);
    const songs = ['first.mp3', 'second.mp3', 'third.mp3'];

    musicProcess = spawn('vlc', [`./songs/${songs[randomNumber]}`]);
}

function pausePlayMusic() {
    if (!musicProcess) {
        console.log('no music is playing');
        return
    }

    musicProcess.stdin.write('pause\n');
}
