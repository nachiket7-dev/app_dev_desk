// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("athena", {
    registerListenerForTimerTickFromMain: (callback) => {
        // callback is setTimer
        const fn = (event, message) => {
            callback(message);
        }

        ipcRenderer.on('timer', fn);

        return () => {
            ipcRenderer.removeListener('timer', fn);
        }
    },
    startTimerOnMain: () => {
        try {
            return ipcRenderer.invoke('start-timer');
        } catch (error) {
            throw "error";
        }
    },

    // New Preload Functions

    // Functions related to capturing camera snaps of user
    registerListenerForCameraSnapFromMain: (callback) => {
        ipcRenderer.on('camera-shot', callback);

        return () => {
            ipcRenderer.removeListener('camera-shot', callback);
        }
    },

    storeCameraSnapImageOnDisk: (data) => {
        ipcRenderer.invoke('store-camera-snap-image-on-disk', data);
    },

    // Functions related to showing Contest Rules in a new Dialog
    showRules: () => {
        ipcRenderer.send("show-rules");
    },

    // Task 1: Show checkbox dialog and get button + checkbox result
    showCheckboxDialog: () => {
        return ipcRenderer.invoke('show-checkbox-dialog');
    },

    // Task 2: Open folder picker and set camera save folder
    selectCameraSaveFolder: () => {
        return ipcRenderer.invoke('select-camera-save-folder');
    },

    // Task 3: Open file picker and get the selected file path
    selectFile: () => {
        return ipcRenderer.invoke('select-file');
    },

    // Native theme: get current OS theme ('dark' | 'light')
    getTheme: () => {
        return ipcRenderer.invoke('get-theme');
    },

    // Native theme: listen for OS theme changes
    onThemeChange: (callback) => {
        const fn = (_event, theme) => callback(theme);
        ipcRenderer.on('theme-changed', fn);
        return () => ipcRenderer.removeListener('theme-changed', fn);
    },

    // Screen capture: get the desktop source ID from main
    getScreenSource: () => {
        return ipcRenderer.invoke('get-screen-source');
    },

    // Screen capture: listen for screen-shot trigger from main
    registerListenerForScreenShotFromMain: (callback) => {
        ipcRenderer.on('screen-shot', callback);
        return () => ipcRenderer.removeListener('screen-shot', callback);
    },

    // Screen capture: save screenshot to disk via main
    storeScreenSnapImageOnDisk: (data) => {
        ipcRenderer.invoke('store-screen-snap-image-on-disk', data);
    }
})
