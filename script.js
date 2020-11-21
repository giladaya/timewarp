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

// ------------------
// Utility variables
// ------------------
// track position of scan line
let scanPos = 0;
// Delay between line caprtures
let loopDelay = 100;
let timer = null;
let countdownRemaining = 3;
let isSelfie = true;
let isVertical = true;

function showDownload() {
  btnDownload.style.visibility = "visible";
}

function hideDownload() {
  btnDownload.style.visibility = "hidden";
}

function scanStepV() {
  scanPos += BAND_WIDTH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = OVERLAY_COLOR;
  ctx.fillRect(0, scanPos + BAND_WIDTH, canvas.width, BAND_WIDTH);

  // ctx.globalAlpha = 0.5;
  // ctx.drawImage(
  //   video,
  //   0,
  //   scanPos - BAND_WIDTH,
  //   video.videoWidth,
  //   BAND_WIDTH * 2,
  //   0,
  //   scanPos - BAND_WIDTH,
  //   canvas.width,
  //   BAND_WIDTH * 2
  // );
  ctx.globalAlpha = 1;
  ctx.drawImage(
    video,
    0,
    scanPos,
    video.videoWidth,
    BAND_WIDTH,
    0,
    scanPos,
    canvas.width,
    BAND_WIDTH
  );
}
function scanStepH() {
  scanPos += BAND_WIDTH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = OVERLAY_COLOR;
  ctx.fillRect(scanPos + BAND_WIDTH, 0, BAND_WIDTH, canvas.height);
  ctx.drawImage(
    video,
    scanPos,
    0,
    BAND_WIDTH,
    video.videoHeight,
    scanPos,
    0,
    BAND_WIDTH,
    canvas.height
  );
}

function scanLoopVertical() {
  scanStepV();

  if (scanPos < video.videoHeight) {
    timer = setTimeout(scanLoopVertical, loopDelay);
  } else {
    showDownload();
  }
}
function scanLoopHorizontal() {
  scanStepH();

  if (scanPos < video.videoWidth) {
    timer = setTimeout(scanLoopHorizontal, loopDelay);
  } else {
    showDownload();
  }
}

function startScan() {
  hideDownload();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  scanPos = 0;
  clearTimeout(timer);

  if (isVertical) {
    loopDelay = SCAN_DURATION / (video.videoHeight / BAND_WIDTH);
    scanLoopVertical();
  } else {
    loopDelay = SCAN_DURATION / (video.videoWidth / BAND_WIDTH);
    scanLoopHorizontal();
  }
}

function countdownLoop() {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = OVERLAY_COLOR;
  ctx.fillText(countdownRemaining, 50, 50);

  if (countdownRemaining > 0) {
    countdownRemaining--;
    timer = setTimeout(countdownLoop, 1000);
  } else {
    startScan();
  }
}
function startCountdown() {
  resetCanvas();
  clearTimeout(timer);

  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "10em serif";
  countdownRemaining = Math.floor(START_DELAY / 1000);
  countdownLoop();
}

function handleCamFlip() {
  isSelfie = !isSelfie;
  initVideo();
}

function handleDownload() {
  const image = canvas
    .toDataURL("image/jpeg", 0.95)
    .replace("image/png", "image/octet-stream");
  const link = document.createElement("a");
  link.download = "my-image.jpg";
  link.href = image;
  link.click();
}

function handleGumSuccess(stream) {
  video.srcObject = stream;
  resetCanvas();
}

function handleGumError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

function initVideo() {
  const constraints = {
    audio: false,
    video: { facingMode: isSelfie ? "user" : "environment" }
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleGumSuccess)
    .catch(handleGumError);
}

function resetCanvas() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// -----
// Init
// -----
// Put variables in global scope to make them available to the browser console.
const video = document.querySelector("video");
const canvas = document.querySelector("canvas");
canvas.width = 480;
canvas.height = 360;

const btnGoVertical = document.querySelector("#btnGoVertical");
btnGoVertical.onclick = () => {
  isVertical = true;
  startCountdown();
};

const btnGoHorizontal = document.querySelector("#btnGoHorizontal");
btnGoHorizontal.onclick = () => {
  isVertical = false;
  startCountdown();
};

const btnDownload = document.querySelector("#btnDownload");
btnDownload.onclick = handleDownload;

navigator.mediaDevices
  .enumerateDevices()
  .then(function (devices) {
    const allVideoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    if (allVideoDevices.length > 1) {
      const btnFlip = document.querySelector("#btnFlip");
      btnFlip.onclick = handleCamFlip;
      btnFlip.style.visibility = "visible";
    }
  })
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });

initVideo();
