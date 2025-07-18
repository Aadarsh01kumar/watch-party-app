const socket = io();
let player;
let isPlayerReady = false;
let lastSyncedTime = 0;

document.getElementById("load-btn").addEventListener("click", () => {
  const url = document.getElementById("youtube-url").value;
  const videoId = extractYouTubeVideoID(url);
  if (videoId) {
    loadYouTubePlayer(videoId);
    socket.emit("loadVideo", videoId);
  }
});

document.getElementById("send").addEventListener("click", () => {
  const message = document.getElementById("message").value.trim();
  if (message) {
    appendMessage(message, "sent");
    socket.emit("chat", message);
    document.getElementById("message").value = "";
  }
});

socket.on("chat", (msg) => {
  appendMessage(msg, "received");
});

function appendMessage(msg, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = msg;
  document.getElementById("chat").appendChild(div);
  document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

function extractYouTubeVideoID(url) {
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

function loadYouTubePlayer(videoId) {
  if (player) {
    player.loadVideoById(videoId);
    return;
  }

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("player", {
      height: "400",
      width: "100%",
      videoId: videoId,
      events: {
        onReady: () => {
          isPlayerReady = true;
          setInterval(syncVideoTime, 1000);
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            socket.emit("play");
          } else if (event.data === YT.PlayerState.PAUSED) {
            socket.emit("pause");
          }
        }
      }
    });
  };

  if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
  }
}

function syncVideoTime() {
  if (player && isPlayerReady) {
    const currentTime = player.getCurrentTime();
    if (Math.abs(currentTime - lastSyncedTime) > 1.5) {
      socket.emit("seek", currentTime);
    }
    lastSyncedTime = currentTime;
  }
}

socket.on("loadVideo", (videoId) => {
  loadYouTubePlayer(videoId);
});

socket.on("play", () => {
  if (player && player.pauseVideo) player.playVideo();
});

socket.on("pause", () => {
  if (player && player.pauseVideo) player.pauseVideo();
});

socket.on("seek", (time) => {
  if (player && Math.abs(player.getCurrentTime() - time) > 1.5) {
    player.seekTo(time, true);
  }
});
