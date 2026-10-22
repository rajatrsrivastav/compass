import {contextBridge,ipcRenderer} from 'electron'
import type {Bridge} from '../shared/types'
const bridge:Bridge={snapshot:query=>ipcRenderer.invoke('compass:snapshot',query),act:action=>ipcRenderer.invoke('compass:act',action)}
contextBridge.exposeInMainWorld('compass',bridge)
