const {app,BrowserWindow,Tray,Menu,ipcMain,Notification,nativeImage,dialog,clipboard}=require('electron');
const path=require('path'),fs=require('fs'),Store=require('electron-store');
const store=new Store();
let mainWindow,tray;
const udp=app.getPath('userData');
const cpDir=path.join(udp,'custom-pets'),wpDir=path.join(udp,'wallpapers');
[cpDir,wpDir].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});});

// ─── DISCORD RPC ──────────────────────────────────────────
const CLIENT_ID = '1513785624446894090';
let rpc = null;
let currentActivity = {};

function initDiscord() {
  try {
    const DiscordRPC = require('discord-rpc');
    DiscordRPC.register(CLIENT_ID);
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
      console.log('Discord RPC connected!');
      setActivity(currentActivity);
    });

    rpc.login({ clientId: CLIENT_ID }).catch(err => {
      console.log('Discord not running or RPC failed:', err.message);
    });
  } catch(e) {
    console.log('discord-rpc not available:', e.message);
  }
}

function setActivity(data) {
  currentActivity = data;
  if (!rpc) return;
  try {
    rpc.setActivity({
      details: data.details || '(。・ω・。) just vibing',
      state: data.state || 'ᓚᘏᗢ idle',
      largeImageKey: 'chiikawa',
      largeImageText: 'Chiikawa Pet ♡',
      startTimestamp: data.startTimestamp || null,
      instance: false,
    });
  } catch(e) {
    console.log('setActivity error:', e.message);
  }
}


// ─── AUTO UPDATER ─────────────────────────────────────────
const { autoUpdater } = require('electron-updater');

function initAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info.version);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('App is up to date!');
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', Math.round(progress.percent));
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  autoUpdater.on('error', (err) => {
    console.log('Auto updater error:', err.message);
  });

  // Check for updates every 30 minutes
  autoUpdater.checkForUpdates().catch(err => console.log('Update check failed:', err.message));
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => console.log('Update check failed:', err.message));
  }, 30 * 60 * 1000);
}

// ─── WINDOW ───────────────────────────────────────────────
function createWindow(){
  mainWindow=new BrowserWindow({width:520,height:820,minWidth:400,minHeight:500,resizable:true,frame:false,transparent:true,alwaysOnTop:false,skipTaskbar:false,webPreferences:{nodeIntegration:true,contextIsolation:false,enableRemoteModule:true},icon:path.join(__dirname,'assets','chiikawa.png')});
  mainWindow.loadFile('src/index.html');
  mainWindow.on('close',e=>{e.preventDefault();mainWindow.hide();});
}

let stickyWins={};
function createStickyWindow(note){
  const win=new BrowserWindow({width:240,height:200,minWidth:150,minHeight:100,resizable:true,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:false,webPreferences:{nodeIntegration:true,contextIsolation:false,enableRemoteModule:true}});
  win.loadFile('src/sticky.html');
  win.webContents.once('did-finish-load',()=>win.webContents.send('sticky-data',note));
  win.on('closed',()=>{delete stickyWins[note.id];mainWindow.webContents.send('sticky-closed',note.id);});
  return win;
}

function createTray(){
  const icon=nativeImage.createFromPath(path.join(__dirname,'assets','chiikawa.png'));
  tray=new Tray(icon.resize({width:16,height:16}));
  tray.setToolTip('Chiikawa Pet ♡');
  tray.setContextMenu(Menu.buildFromTemplate([{label:'Show',click:()=>mainWindow.show()},{label:'Hide',click:()=>mainWindow.hide()},{type:'separator'},{label:'Quit',click:()=>{app.quit();process.exit(0);}}]));
  tray.on('click',()=>mainWindow.isVisible()?mainWindow.hide():mainWindow.show());
}

app.whenReady().then(()=>{
  createWindow();
  createTray();
  initDiscord();
  initAutoUpdater();
  // Set default activity
  setActivity({
    details: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ opening the app!',
    state: 'ᓚᘏᗢ just arrived',
    startTimestamp: new Date(),
  });
});
app.on('window-all-closed',e=>e.preventDefault());

// ─── IPC ──────────────────────────────────────────────────
ipcMain.handle('store-get',(_,k)=>store.get(k));
ipcMain.handle('store-set',(_,k,v)=>store.set(k,v));
ipcMain.on('notify',(_,{title,body})=>{if(Notification.isSupported())new Notification({title,body,icon:path.join(__dirname,'assets','chiikawa.png')}).show();});
ipcMain.on('minimize',()=>mainWindow.minimize());
ipcMain.on('hide',()=>mainWindow.hide());
ipcMain.on('close-app',()=>{app.quit();process.exit(0);});

// Discord RPC update from renderer
ipcMain.on('discord-activity', (_, data) => setActivity(data));

const pick=async(win,filters)=>{const r=await dialog.showOpenDialog(win,{filters,properties:['openFile']});return r.canceled||!r.filePaths.length?null:r.filePaths[0];};
ipcMain.handle('pick-pet-image',async()=>{const s=await pick(mainWindow,[{name:'Images',extensions:['png','jpg','jpeg','gif','webp']}]);if(!s)return null;const d=path.join(cpDir,`pet_${Date.now()}${path.extname(s)}`);fs.copyFileSync(s,d);return d;});
ipcMain.handle('pick-pet-sound',async()=>{const s=await pick(mainWindow,[{name:'Audio',extensions:['mp3','wav','ogg','m4a','aac']}]);if(!s)return null;const d=path.join(cpDir,`snd_${Date.now()}${path.extname(s)}`);fs.copyFileSync(s,d);return d;});
ipcMain.handle('pick-wallpaper',async()=>{const s=await pick(mainWindow,[{name:'Images',extensions:['png','jpg','jpeg','webp','gif']}]);if(!s)return null;const d=path.join(wpDir,`wp_${Date.now()}${path.extname(s)}`);fs.copyFileSync(s,d);return d;});
ipcMain.handle('delete-pet-file',(_,p)=>{try{if(p&&fs.existsSync(p))fs.unlinkSync(p);}catch(e){}return true;});
ipcMain.handle('get-clipboard',()=>clipboard.readText());
ipcMain.handle('set-clipboard',(_,t)=>{clipboard.writeText(t);return true;});
ipcMain.on('open-sticky',(_,note)=>{if(stickyWins[note.id]){stickyWins[note.id].focus();return;}const win=createStickyWindow(note);stickyWins[note.id]=win;win.on('closed',()=>delete stickyWins[note.id]);});
ipcMain.on('close-sticky',(_,id)=>{if(stickyWins[id]){stickyWins[id].destroy();delete stickyWins[id];}});
ipcMain.on('update-sticky',(_,note)=>mainWindow.webContents.send('sticky-updated',note));
ipcMain.on('resize-sticky',(_,{id,w,h})=>{if(stickyWins[id])stickyWins[id].setSize(w,h);});
ipcMain.on('install-update',()=>autoUpdater.quitAndInstall());