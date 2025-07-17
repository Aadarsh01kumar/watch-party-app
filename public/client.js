const socket = io();

let player;
let localVideo = document.getElementById('localVideo');
let mode = 'youtube';

const msgInput = document.getElementById('msgInput');
const messages = document.getElementById('messages');
const ytInput = document.getElementById('ytInput');
const modeSelect = document.getElementById('modeSelect');

// Chat logic
msgInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter' && msgInput.value.trim() !== '') {
    socket.emit('chat message', msgInput.value);
    msgInput.value = '';
  }
});

socket.on('chat message', function (msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// Video mode selection
modeSelect.addEventListener('change', function () {
  mode = modeSelect.value;
  if (mode === 'youtube') {
    ytInput.style.display = 'block';
    localVideo.hidden = true;
    document.getElementById('player').style.display = 'block';
  } else {
    ytInput.style.display = 'none';
    localVideo.hidden = false;
    document.getElementById('player').style.display = 'none';
  }
});

// YouTube input handler
ytInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    const url = ytInput.value;
    const id = extractVideoID(url);
    if (id) {
      loadVideo(id);
      socket.emit('load video', id);
    }
  }
});

function extractVideoID(url) {
  const reg = /(?:\?v=|\/embed\/|\.be\/)([\w\-]{11})/;
  const match = url.match(reg);
  return match ? match[1] : null;
}

// YT API
function onYouTubeIframeAPIReady() {}

function loadVideo(id) {
  if (player) {
    player.loadVideoById(id);
  } else {
    player = new YT.Player('player', {
      videoId: id,
      events: {
        onReady: () => {
          player.addEventListener('onStateChange', syncYTPlayer);
        }
      }
    });
  }
}

// Sync YouTube Player
function syncYTPlayer(e) {
  const time = player.getCurrentTime();
  if (e.data === YT.PlayerState.PLAYING) {
    socket.emit('video control', { mode, action: 'play', time });
  } else if (e.data === YT.PlayerState.PAUSED) {
    socket.emit('video control', { mode, action: 'pause', time });
  }
}

// Sync Local Player
localVideo.addEventListener('play', () => {
  socket.emit('video control', { mode, action: 'play', time: localVideo.currentTime });
});

localVideo.addEventListener('pause', () => {
  socket.emit('video control', { mode, action: 'pause', time: localVideo.currentTime });
});

localVideo.addEventListener('seeked', () => {
  socket.emit('video control', { mode, action: 'seek', time: localVideo.currentTime });
});

// Receive sync commands
socket.on('load video', (id) => loadVideo(id));

socket.on('video control', ({ mode: incomingMode, action, time }) => {
  if (incomingMode !== mode) return;

  if (incomingMode === 'youtube' && player) {
    if (action === 'play') {
      player.seekTo(time, true);
      player.playVideo();
    } else if (action === 'pause') {
      player.seekTo(time, true);
      player.pauseVideo();
    }
  } else if (incomingMode === 'local' && localVideo) {
    if (Math.abs(localVideo.currentTime - time) > 0.5) localVideo.currentTime = time;

    if (action === 'play') localVideo.play();
    else if (action === 'pause') localVideo.pause();
  }
});
