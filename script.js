"use strict";

// ---------------
// Run parameters
// ---------------
// width of scanline in pixels
const BAND_WIDTH = 1;

// Total duration of scan (ms)
const SCAN_DURATION = 10000;

// Delay before scan starts
const START_DELAY = 3000;

// Overlay color
const OVERLAY_COLOR = "#0F0";

// ---------
// Functions
// ---------

function Timer() {
  this.timer = null;

  const set = (timer) => {
    this.timer = timer;
  }

  const clear = () => {
    clearTimeout(this.timer);
  }

  return {
    set,
    clear,
  }
}

function doScanH({ video, canvas, scanDuration, bandWidth, overlayColor, setTimer, onDone }) {
  let scanPos = 0;
  const loopDelay = scanDuration / (video.videoHeight / bandWidth);

  function scanStep() {
    scanPos += bandWidth;
    const ctx = canvas.getContext("2d");
  
    ctx.fillStyle = overlayColor;
    ctx.fillRect(scanPos + bandWidth, 0, bandWidth, canvas.height);
    ctx.drawImage(
      video,
      scanPos,
      0,
      bandWidth,
      video.videoHeight,
      scanPos,
      0,
      bandWidth,
      canvas.height
    );
  }

  function scanLoop() {
    scanStep();

    if (scanPos < video.videoWidth) {
      setTimer(setTimeout(scanLoop, loopDelay));
    } else {
      onDone();
    }
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  scanLoop();
}

function doScanV({ video, canvas, scanDuration, bandWidth, overlayColor, setTimer, onDone }) {
  let scanPos = 0;
  const loopDelay = scanDuration / (video.videoHeight / bandWidth);

  function scanStep() {
    scanPos += bandWidth;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, scanPos + bandWidth, canvas.width, bandWidth);
    ctx.drawImage(
      video,
      0,
      scanPos,
      video.videoWidth,
      bandWidth,
      0,
      scanPos,
      canvas.width,
      bandWidth
    );
  }

  function scanLoop() {
    scanStep();

    if (scanPos < video.videoHeight) {
      setTimer(setTimeout(scanLoop, loopDelay));
    } else {
      onDone();
    }
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  scanLoop();
}

function doCountdown({
  delay,
  canvas,
  setTimer,
  onDone,
  overlayColor,
}) {
  let countdownRemaining = Math.floor(delay / 1000);

  function countdownLoop() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = overlayColor;
    ctx.fillText(countdownRemaining, 50, 50);

    if (countdownRemaining > 0) {
      countdownRemaining--;
      setTimer(setTimeout(countdownLoop, 1000));
    } else {
      onDone()();
    }
  }

  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "10em serif";

  countdownLoop();
}

function resetCanvas(canvas, video) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ------------
// UI functions
// ------------
// These directly acecss UI global vars

function showDownload() {
  $btnDownload.style.visibility = "visible";
}

function hideDownload() {
  $btnDownload.style.visibility = "hidden";
}

function handleCamFlip() {
  isSelfie = !isSelfie;
  initVideo(isSelfie);
}

function handleDownload() {
  const image = $canvas
    .toDataURL("image/jpeg", 0.95)
    .replace("image/png", "image/octet-stream");
  const link = document.createElement("a");
  link.download = "my-image.jpg";
  link.href = image;
  link.click();
}

function handleGumSuccess(stream) {
  $video.srcObject = stream;
  resetCanvas($canvas, $video);
}

function handleGumError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

function initVideo(isSelfie) {
  const constraints = {
    audio: false,
    video: { facingMode: isSelfie ? "user" : "environment" }
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleGumSuccess)
    .catch(handleGumError);
}

function initFlipButton(btnFlip) {
  let isSelfie = true;
  function handleCamFlip() {
    isSelfie = !isSelfie;
    initVideo(isSelfie);
  }

  navigator.mediaDevices
  .enumerateDevices()
  .then(function (devices) {
    const allVideoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    if (allVideoDevices.length > 1) {
      btnFlip.onclick = handleCamFlip;
      btnFlip.style.visibility = "visible";
    }
  })
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });
}

// -------
// Init UI
// -------
const timerManager = new Timer();
const $video = document.querySelector("video");
const $canvas = document.querySelector("canvas");
$canvas.width = 480;
$canvas.height = 360;

const $btnGoVertical = document.querySelector("#btnGoVertical");
$btnGoVertical.onclick = () => {
  resetCanvas($canvas, $video);
  timerManager.clear();

  doCountdown({
    delay: START_DELAY,
    canvas: $canvas,
    setTimer: timerManager.set,
    overlayColor: OVERLAY_COLOR,
    onDone: () => {
      resetCanvas($canvas, $video);
      timerManager.clear();
      hideDownload();

      doScanV({ 
        video: $video, 
        canvas: $canvas, 
        scanDuration: SCAN_DURATION, 
        bandWidth: BAND_WIDTH, 
        overlayColor: OVERLAY_COLOR, 
        setTimer: timerManager.set, 
        onDone: showDownload 
      })
    },
  })
};

const $btnGoHorizontal = document.querySelector("#btnGoHorizontal");
$btnGoHorizontal.onclick = () => {
  resetCanvas($canvas, $video);
  timerManager.clear();

  doCountdown({
    delay: START_DELAY,
    canvas: $canvas,
    setTimer: timerManager.set,
    overlayColor: OVERLAY_COLOR,
    onDone: () => {
      resetCanvas($canvas, $video);
      timerManager.clear();
      hideDownload();

      doScanH({ 
        video: $video, 
        canvas: $canvas, 
        scanDuration: SCAN_DURATION, 
        bandWidth: BAND_WIDTH, 
        overlayColor: OVERLAY_COLOR, 
        setTimer: timerManager.set, 
        onDone: showDownload 
      })
    },
  })
};

const $btnDownload = document.querySelector("#btnDownload");
$btnDownload.onclick = handleDownload;

const $btnFlip = document.querySelector("#btnFlip");
initFlipButton($btnFlip);

initVideo();
