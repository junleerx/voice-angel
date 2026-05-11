// electron/preload.js
// Safe bridge between renderer and main. API keys never cross this boundary.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('livetrans', {
  startMeeting: () => ipcRenderer.invoke('livetrans:start-meeting'),
  stopMeeting: () => ipcRenderer.invoke('livetrans:stop-meeting'),
  sendAudioChunk: (arrayBuffer) =>
    ipcRenderer.send('livetrans:audio-chunk', arrayBuffer),
  saveTranscript: (messages) =>
    ipcRenderer.invoke('livetrans:save-transcript', messages),

  onMessage: (cb) => subscribe('livetrans:message', cb),
  onInterim: (cb) => subscribe('livetrans:interim', cb),
  onStatus: (cb) => subscribe('livetrans:status', cb),
  onError: (cb) => subscribe('livetrans:error', cb),
});

function subscribe(channel, cb) {
  const listener = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}
