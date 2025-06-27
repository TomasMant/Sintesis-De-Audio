let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source = null;
let filter = null;
let gain = null;
let isNoise = false;

function createWhiteNoiseBuffer() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    let white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function playSound() {
  stopSound(); // para evitar superposiciones

  const type = document.getElementById("sourceType").value;
  const baseFreq = parseFloat(document.getElementById("baseFreq").value);
  const cutoff = parseFloat(document.getElementById("cutoffFreq").value);
  const q = parseFloat(document.getElementById("resonance").value);

  filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = q;

  gain = audioCtx.createGain();
  gain.gain.value = 0.2;

  isNoise = (type === "white" || type === "pink");

  if (isNoise) {
    const buffer = type === "white" ? createWhiteNoiseBuffer() : createPinkNoiseBuffer();
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(filter).connect(gain).connect(audioCtx.destination);
    noiseSource.start();
    source = noiseSource;
  } else {
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.value = baseFreq;
    osc.connect(filter).connect(gain).connect(audioCtx.destination);
    osc.start();
    source = osc;
  }
}

function stopSound() {
  if (source) {
    source.stop();
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
    source = null;
    filter = null;
    gain = null;
  }
}

// Eventos
document.getElementById("play").addEventListener("click", () => {
  playSound();
});

document.getElementById("stop").addEventListener("click", () => {
  stopSound();
});

document.getElementById("baseFreq").addEventListener("input", function () {
  document.getElementById("baseFreqVal").textContent = this.value;
  if (source && !isNoise && source.frequency) {
    source.frequency.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

document.getElementById("cutoffFreq").addEventListener("input", function () {
  document.getElementById("cutoffFreqVal").textContent = this.value;
  if (filter) {
    filter.frequency.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

document.getElementById("resonance").addEventListener("input", function () {
  document.getElementById("resonanceVal").textContent = this.value;
  if (filter) {
    filter.Q.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

// Cambiar tipo de fuente en vivo reinicia el sonido
document.getElementById("sourceType").addEventListener("change", function () {
  playSound(); // reinicia con nuevo tipo
});

