import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from "electron";
import path from "path";
import fs from "fs";

let electronWindow = null;
let startTimestamp = null;
let cameraSaveFolder = null; // custom folder chosen by user

function createWindow() {
    electronWindow = new BrowserWindow({
        height: 1000,
        width: 1000,
        webPreferences: {
            devTools: true,
            preload: path.join(import.meta.dirname, 'preload.js')
        }
    })

    electronWindow.loadURL('http://localhost:5174');

    // Push OS theme changes to the renderer
    nativeTheme.on('updated', () => {
        electronWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    });
}

ipcMain.handle('start-timer', (event) => {
    startTimestamp = Date.now();

    // Send Timer Tick every 1s
    setInterval(() => {
        electronWindow.webContents.send('timer', (Date.now() - startTimestamp) / 1000);
    }, 1000);

    // Capture user's camera snap every 5s
    setInterval(() => {
        electronWindow.webContents.send('camera-shot')
    }, 5000);
})


ipcMain.handle('store-camera-snap-image-on-disk', (_event, data) => {
    const saveDir = cameraSaveFolder
        ? cameraSaveFolder
        : path.join(import.meta.dirname, "user-camera-snap");

    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
    }

    const filePath = path.join(saveDir, `${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(data));
})



// Native theme: return current OS theme to renderer on request
ipcMain.handle('get-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});


ipcMain.on("show-rules", () => {
    dialog.showMessageBox(electronWindow, {
        type: "info",
        title: "Athena Exam Rules",
        message: "Exam Rules",
        detail:
            "1. Stay on the exam screen.\n" +
            "2. Camera must remain enabled.\n" +
            "3. Do not leave the exam.\n" +
            "4. Do not use external assistance.\n" +
            "5. Click Exit Exam when finished."
    });
});


// Task 1: Show a checkbox dialog with buttons and call a function based on result
ipcMain.handle('show-checkbox-dialog', async () => {
    const result = await dialog.showMessageBox(electronWindow, {
        type: 'question',
        title: 'Exam Preferences',
        message: 'Select your preferences before starting:',
        checkboxLabel: 'I agree to the exam rules and conditions',
        checkboxChecked: false,
        buttons: ['Start Exam', 'More Info', 'Cancel'],
        defaultId: 0,
        cancelId: 2
    });

    // result.response = button index (0=Start Exam, 1=More Info, 2=Cancel)
    // result.checkboxChecked = true/false
    if (result.response === 0 && result.checkboxChecked) {
        console.log('User agreed and clicked Start Exam');
    } else if (result.response === 1) {
        console.log('User clicked More Info');
    } else {
        console.log('User cancelled or did not check the box');
    }

    return { buttonIndex: result.response, checkboxChecked: result.checkboxChecked };
});


// Task 2: Select folder where camera shots will be stored
ipcMain.handle('select-camera-save-folder', async () => {
    const result = await dialog.showOpenDialog(electronWindow, {
        title: 'Select Folder to Save Camera Shots',
        properties: ['openDirectory', 'createDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        cameraSaveFolder = result.filePaths[0];
        return cameraSaveFolder;
    }

    return null;
});


// Task 3: Select a file using dialog box and get its path
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(electronWindow, {
        title: 'Select a File',
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }

    return null;
});


app.whenReady().then(createWindow);