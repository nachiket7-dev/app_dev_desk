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
    }
})
