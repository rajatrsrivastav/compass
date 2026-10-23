import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  safeStorage,
  session,
  Menu,
} from "electron";
import { join, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { Store } from "./database/store";
import { Credentials } from "./security/credentials";
import { GitHubClient } from "./github/client";
import { SyncService } from "./github/sync";
import { Service } from "./service";
import { actionSchema, externalUrl } from "../shared/schemas";
import type { Action } from "../shared/types";
import { MAX_IMPORT } from "./imports/parse";
const here = fileURLToPath(new URL(".", import.meta.url));
if (process.env.OSS_COMPASS_DATA_DIR)
  app.setPath("userData", process.env.OSS_COMPASS_DATA_DIR);
let store: Store;
let sync: SyncService;
let window: BrowserWindow;
let timer: NodeJS.Timeout;
app.whenReady().then(() => {
  const dir = app.getPath("userData");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  store = new Store(join(dir, "compass.db"));
  const credentials = new Credentials(
    join(dir, "credentials.enc"),
    safeStorage,
  );
  sync = new SyncService(
    store,
    new GitHubClient(store, () => credentials.get()),
  );
  const aiCredentials = new Credentials(
    join(dir, "credentials-openai.enc"),
    safeStorage,
  );
  const service = new Service(store, sync, credentials, aiCredentials);
  const renderer = join(here, "../renderer/index.html"),
    dev = !app.isPackaged && process.env.ELECTRON_RENDERER_URL;
  const trusted = (url: string) =>
    dev
      ? new URL(url).origin === new URL(dev).origin
      : url.split("#")[0] === pathToFileURL(renderer).href;
  const sender = (event: Electron.IpcMainInvokeEvent) => {
    if (
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      !event.senderFrame ||
      !trusted(event.senderFrame.url)
    )
      throw new Error("Untrusted IPC sender");
  };
  ipcMain.handle("compass:snapshot", (event, query: unknown) => {
    sender(event);
    if (
      query !== undefined &&
      (typeof query !== "string" || query.length > 500)
    )
      throw new Error("Invalid search query");
    return service.snapshot(query as string | undefined);
  });
  ipcMain.handle("compass:act", async (event, input: unknown) => {
    sender(event);
    const a = actionSchema.parse(input) as Action;
    if (a.type === "external") {
      await shell.openExternal(externalUrl(a.url));
      return {};
    }
    if (a.type === "source:import") {
      const result = await dialog.showOpenDialog(window, {
        title: "Import an authorized transcript or chat export",
        properties: ["openFile"],
        filters: [
          {
            name: "Community text",
            extensions: ["txt", "md", "srt", "vtt", "json"],
          },
        ],
      });
      if (result.canceled) return {};
      const path = result.filePaths[0];
      if (statSync(path).size > MAX_IMPORT)
        throw new Error("Import exceeds 2 MB");
      service.addSource({
        type: "source:add",
        title: basename(path),
        text: readFileSync(path, "utf8"),
        format: extname(path).slice(1).toLowerCase(),
        repo: a.repo,
        date: new Date().toISOString().slice(0, 10),
        url: "",
        consent: a.consent,
      });
      return {};
    }
    if (a.type === "export") {
      const text = service.export(a.kind, a.id);
      const result = await dialog.showSaveDialog(window, {
        defaultPath: `oss-compass-${a.kind}.md`,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, text, { mode: 0o600 });
        return { message: "Markdown export saved." };
      }
      return {};
    }
    return service.act(a);
  });
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  if (app.isPackaged) {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        ...(process.platform === "darwin"
          ? [{ role: "appMenu" as const }]
          : []),
        { role: "fileMenu" },
        { role: "editMenu" },
        {
          label: "View",
          submenu: [
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
          ],
        },
        { role: "windowMenu" },
      ]),
    );
  }
  window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#101214",
    title: "OSS Compass",
    webPreferences: {
      preload: join(here, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!trusted(url)) event.preventDefault();
  });
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  if (dev) void window.loadURL(dev);
  else void window.loadFile(renderer);
  // Background refresh only for repositories the user has already synchronized.
  timer = setInterval(() => {
    for (const r of store.all("repositories"))
      if (
        r.provenance === "github" &&
        r.syncedAt &&
        !sync.active.has(r.id) &&
        Date.now() - Date.parse(r.syncedAt) > 30 * 60000
      )
        void sync.sync(r.id).catch(() => {});
  }, 60000);
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  clearInterval(timer);
  for (const id of sync?.active.keys() ?? []) sync.cancel(id);
});
app.on("will-quit", () => store?.close());
