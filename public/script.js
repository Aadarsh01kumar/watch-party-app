const socket = io();
let isHost = false;
let player;
let videoId = null;

socket.on('setHost', () => {
  isHost = true;
});

socket.on('setVideo', (id) => {
  videoId = id;
  loadVideo(id);
});

socket.on('play', () => player?.playVideo());
socket.on('pause', () => player?.pauseVideo());
socket.on('seek', (time) => {
  const current = player.getCurrentTime();
  if (Math.abs(current - time) > 1.5) {
    player.seekTo(time, true);
  }
});

socket.on('chatMessage', (msg) => {
  appendMessage(msg, 'received');
});

document.getElementById('video-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const url = document.getElementById('video-url').value;
  const id = extractVideoId(url);
  if (id && isHost) {
    socket.emit('videoSelected', id);
    loadVideo(id);
  }
});

function extractVideoId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/);
  return match ? match[1] : null;
}

function loadVideo(id) {
  if (player) {
    player.loadVideoById(id);
  } else {
    player = new YT.Player('player', {
      height: '360',
      width: '640',
      videoId: id,
      events: {
        onReady: () => {
          if (isHost) {
            setInterval(() => {
              const time = player.getCurrentTime();
              socket.emit('seek', time);
            }, 1000);
          }
        },
        onStateChange: (event) => {
          if (!isHost) return;
          if (event.data === YT.PlayerState.PLAYING) socket.emit('play');
          if (event.data === YT.PlayerState.PAUSED) socket.emit('pause');
        }
      }
    });
  }
}

// Chat
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (msg) {
    appendMessage(msg, 'sent');
    socket.emit('chatMessage', msg);
    chatInput.value = '';
  }
});

function appendMessage(msg, type) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
