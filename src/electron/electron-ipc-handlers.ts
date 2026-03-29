/**
 * Electron IPC Handlers for pushpak-desktop
 * 
 * Usage in main process:
 * ```typescript
 * import { setupMavlinkIPC } from '@pushpak/mavlink/examples/electron-ipc-handlers';
 * import { MavlinkManager } from '@pushpak/mavlink/examples/mavlink-manager';
 * 
 * const mavlinkManager = new MavlinkManager();
 * setupMavlinkIPC(ipcMain, mavlinkManager, mainWindow);
 * 
 * mavlinkManager.start();
 * ```
 */

import type { IpcMain, BrowserWindow } from 'electron';
import { MavlinkManager } from './mavlink-manager';
import { CopterMode } from '@pushpak/mavlink';

export function setupMavlinkIPC(
  ipcMain: IpcMain,
  manager: MavlinkManager,
  mainWindow: BrowserWindow
): void {
  
  // Forward state changes to renderer
  manager.on('state-changed', (state) => {
    mainWindow.webContents.send('mavlink:state', state);
  });

  manager.on('telemetry-changed', (telemetry) => {
    mainWindow.webContents.send('mavlink:telemetry', telemetry);
  });

  manager.on('vehicle-found', (sysid) => {
    mainWindow.webContents.send('mavlink:vehicle-found', sysid);
  });

  manager.on('vehicle-lost', (sysid) => {
    console.log('[IPC Handler] Vehicle lost:', sysid);
    mainWindow.webContents.send('mavlink:vehicle-lost', sysid);
  });

  manager.on('error', (error) => {
    mainWindow.webContents.send('mavlink:error', error.toString());
  });

  // ==================== IPC Handlers ====================

  // Get current state
  ipcMain.handle('mavlink:getState', () => {
    return manager.getVehicleState();
  });

  ipcMain.handle('mavlink:getTelemetry', () => {
    return manager.getTelemetryState();
  });

  // Connection control
  ipcMain.handle('mavlink:start', () => {
    try {
      manager.start();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('mavlink:stop', () => {
    try {
      manager.stop();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('mavlink:connect', async (_, config: { type: 'udp' | 'serial', port?: number, host?: string, path?: string, baudRate?: number }) => {
    try {
      await manager.connect(config);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('mavlink:disconnect', () => {
    try {
      manager.disconnect();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // Vehicle commands
  ipcMain.handle('vehicle:arm', async (_, arm: boolean) => {
    console.log(`[IPC Handler] Arm command received: ${arm ? 'ARM' : 'DISARM'}`);
    console.log(`[IPC Handler] Current vehicle state:`, manager.getVehicleState());
    try {
      await manager.arm(arm);
      console.log(`[IPC Handler] Arm command executed successfully`);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:setMode', async (_, mode: CopterMode) => {
    try {
      await manager.setMode(mode);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:takeoff', async (_, altitude: number) => {
    console.log(`[IPC Handler] Takeoff command received: altitude=${altitude}m`);
    try {
      const result = await manager.takeoff(altitude);
      console.log(`[IPC Handler] Takeoff command executed, interval ID:`, result);
      return { success: true };
    } catch (err) {
      console.error(`[IPC Handler] Takeoff failed:`, err);
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:land', async () => {
    try {
      await manager.land();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:rtl', async () => {
    try {
      await manager.returnToLaunch();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:goto', async (_, lat: number, lon: number, altitude: number) => {
    try {
      await manager.goto(lat, lon, altitude);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('vehicle:setSpeed', async (_, speed: number, type: 'ground' | 'air' = 'ground') => {
    try {
      await manager.setSpeed(speed, type);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
