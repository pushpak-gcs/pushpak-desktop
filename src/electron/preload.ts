/**
 * Preload script for Electron
 * Exposes secure IPC communication to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Store listeners for proper cleanup
const listeners = new Map<string, Map<Function, (event: any, ...args: any[]) => void>>();

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(...args);
    
    // Store the subscription for later removal
    if (!listeners.has(channel)) {
      listeners.set(channel, new Map());
    }
    listeners.get(channel)!.set(callback, subscription);
    
    ipcRenderer.on(channel, subscription);
  },
  
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    const channelListeners = listeners.get(channel);
    if (channelListeners) {
      const subscription = channelListeners.get(callback);
      if (subscription) {
        ipcRenderer.removeListener(channel, subscription);
        channelListeners.delete(callback);
      }
    }
  }
});
