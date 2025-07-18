const socket = io();
let isHost = false;
let videoId = null;
let ready = false;

// Join the room
socket.emit("join");

// Set host
socket.on("setHost", () => {
  isHost = true;
});

// Chat functionality
document.getElementById("sendBtn").onclick = () => {
  const msg = document.getElementById("messageInput").value;
  if (msg.trim()) {
    socket.emit("chat", msg);
    addMessage(msg, true);
    document.getElementById("messageInput").value = "";
  }
};

socket.on("chat", (msg) => {
  addMessage(msg, false);
});

function addMessage(msg, isSent) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", isSent ? "sent" : "received");
  msgDiv.textContent = msg;
  document.getElementById("messages").appendChild(msgDiv);
}

// Load video
document.getElementById("loadVideo").onclick = () => {
  if (!isHost) {
    alert("Only host can load video.");
    return;
  }
  const url = document.getElementById("youtubeUrl").value;
  const id = extractVideoId(url);
  if (id) {
    videoId = id;
    socket.emit("loadVideo", videoId);
    loadPlayer(videoId);
  }
};

// Extract YouTube ID
function extractVideoId(url) {
  const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Load player when API is ready
window.addEventListener("YTReady", () => {
  ready = true;
});

// Load video on other clients
socket.on("loadVideo", (id) => {
  videoId = id;
  if (ready) {
    loadPlayer(id);
  } else {
    window.addEventListener("YTReady", () => loadPlayer(id));
  }
});

// Create or update player
function loadPlayer(id) {
  if (player) {
    player.loadVideoById(id);
  } else {
    player = new YT.Player("player", {
      height: "360",
      width: "640",
      videoId: id,
      events: {
        onReady: () => {
          if (!isHost) socket.emit("requestSync");
        },
        onStateChange: (e) => {
          if (!isHost) return;
          const time = player.getCurrentTime();
          if (e.data === YT.PlayerState.PLAYING) {
            socket.emit("play", time);
          } else if (e.data === YT.PlayerState.PAUSED) {
            socket.emit("pause", time);
          }
        }
      }
    });
  }
}

// Playback sync
socket.on("play", (time) => {
  if (player) {
    player.seekTo(time, true);
    player.playVideo();
  }
});

socket.on("pause", (time) => {
  if (player) {
    player.seekTo(time, true);
    player.pauseVideo();
  }
});

socket.on("sync", (data) => {
  if (player) {
    player.loadVideoById(data.videoId);
    player.seekTo(data.time, true);
    if (data.isPlaying) player.playVideo();
  }
});
