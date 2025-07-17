const socket = io();

// Chat functionality
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit('chat message', msg);
    chatInput.value = '';
  }
});

socket.on('chat message', msg => {
  const p = document.createElement('p');
  p.textContent = msg;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Video sync
const videoForm = document.getElementById('video-form');
const videoInput = document.getElementById('video-input');
const videoPlayer = document.getElementById('video-player');

videoForm.addEventListener('submit', e => {
  e.preventDefault();
  const link = videoInput.value.trim();
  if (link) {
    socket.emit('video link', link);
    loadVideo(link);
  }
});

socket.on('video link', link => {
  loadVideo(link);
});

function loadVideo(link) {
  let embed;
  if (link.includes("youtube.com") || link.includes("youtu.be")) {
    const videoId = link.includes("youtu.be")
      ? link.split("/").pop()
      : new URLSearchParams(new URL(link).search).get("v");
    embed = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
  } else {
    embed = `<video controls autoplay><source src="${link}" type="video/mp4">Your browser does not support HTML5 video.</video>`;
  }
  videoPlayer.innerHTML = embed;
}
