import { VaultFacade, VaultSourceID } from "buttercup";
import { BrowserWindow, ipcMain } from "electron";
import { addVaultFromPayload, showAddFileVaultDialog } from "./actions/connect";
import { unlockSourceWithID } from "./actions/unlock";
import { lockSourceWithID } from "./actions/lock";
import { removeSourceWithID } from "./actions/remove";
import { getEmptyVault, saveVaultFacade, sendSourcesToWindows } from "./services/buttercup";
import { getVaultFacade } from "./services/facades";
import { getConfigValue, setConfigValue } from "./services/config";
import { log as logRaw, logErr } from "./library/log";
import { AddVaultPayload, LogLevel, Preferences } from "./types";

ipcMain.on("add-vault-config", async (evt, payload) => {
    const addVaultPayload: AddVaultPayload = JSON.parse(payload);
    try {
        await addVaultFromPayload(addVaultPayload);
        evt.reply("add-vault-config:reply", JSON.stringify({
            ok: true,
        }));
    } catch (err) {
        console.error(err);
        evt.reply("add-vault-config:reply", JSON.stringify({
            ok: false,
            error: err.message
        }));
    }
});

ipcMain.on("get-add-vault-filename", async evt => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    if (!win) {
        // @todo record error
    }
    const filename = await showAddFileVaultDialog(win as BrowserWindow);
    evt.reply("get-add-vault-filename:reply", JSON.stringify({
        filename,
        createNew: false
    }));
});

ipcMain.on("get-empty-vault", async (evt, payload) => {
    const {
        password
    } = JSON.parse(payload);
    const vault = await getEmptyVault(password);
    evt.reply("get-empty-vault:reply", vault);
});

ipcMain.on("get-preferences", async (evt, sourceID) => {
    const prefs = await getConfigValue<Preferences>("preferences");
    evt.reply("get-preferences:reply", JSON.stringify(prefs));
});

ipcMain.on("get-vault-facade", async (evt, sourceID) => {
    const facade = await getVaultFacade(sourceID);
    evt.reply("get-vault-facade:reply", JSON.stringify(facade));
});

ipcMain.on("lock-source", async (evt, payload) => {
    const {
        sourceID
    } = JSON.parse(payload);
    try {
        await lockSourceWithID(sourceID);
        evt.reply("lock-source:reply", JSON.stringify({
            ok: true
        }));
    } catch (err) {
        logErr("Failed locking vault source", err);
        evt.reply("lock-source:reply", JSON.stringify({
            ok: false,
            error: err.message
        }));
    }
});

ipcMain.on("log", async (evt, payload) => {
    const {
        level,
        log
    } = JSON.parse(payload) as {
        level: LogLevel,
        log: string
    };
    logRaw(level, [log]);
});

ipcMain.on("remove-source", async (evt, payload) => {
    const {
        sourceID
    } = JSON.parse(payload);
    await removeSourceWithID(sourceID);
});

ipcMain.on("save-vault-facade", async (evt, payload) => {
    const { sourceID, vaultFacade } = JSON.parse(payload) as {
        sourceID: VaultSourceID,
        vaultFacade: VaultFacade
    };
    try {
        await saveVaultFacade(sourceID, vaultFacade);
        evt.reply("save-vault-facade:reply", JSON.stringify({
            ok: true
        }));
    } catch (err) {
        logErr("Failed saving vault facade", err);
        evt.reply("save-vault-facade:reply", JSON.stringify({
            ok: false,
            error: err.message
        }));
    }
});

ipcMain.on("unlock-source", async (evt, payload) => {
    const {
        sourceID,
        password
    } = JSON.parse(payload);
    try {
        await unlockSourceWithID(sourceID, password);
        evt.reply("unlock-source:reply", JSON.stringify({
            ok: true
        }));
    } catch (err) {
        logErr("Failed unlocking vault source", err);
        evt.reply("unlock-source:reply", JSON.stringify({
            ok: false,
            error: err.message
        }));
    }
});

ipcMain.on("update-vault-windows", () => {
    sendSourcesToWindows();
});

ipcMain.on("write-preferences", async (evt, payload) => {
    const { preferences } = JSON.parse(payload) as { preferences: Preferences };
    await setConfigValue("preferences", preferences);
});
