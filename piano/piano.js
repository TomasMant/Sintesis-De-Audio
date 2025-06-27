// Elementos DOM
const pianoKeys = document.querySelectorAll(".piano-keys .key");
const filterCutoffSlider = document.getElementById("filterCutoff");
const volumeSlider = document.querySelector(".volume-slider input");
const keysCheckbox = document.querySelector(".keys-checkbox input");
const waveformSelector = document.getElementById("waveformType");
const noiseTypeSelect = document.getElementById("noiseType");
const noiseVolumeSlider = document.getElementById("noiseVolume");

// Contexto y nodos audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const gainNode = audioCtx.createGain();
gainNode.gain.value = volumeSlider.value;

const filterNode = audioCtx.createBiquadFilter();
filterNode.type = "lowpass";
filterNode.frequency.value = filterCutoffSlider.value || 5000;

gainNode.connect(filterNode);
filterNode.connect(audioCtx.destination);

// Frecuencias notas
const noteFrequencies = {
  a: 440.00, w: 466.16, s: 493.88, e: 523.25, d: 554.37, f: 587.33,
  t: 622.25, g: 659.25, y: 698.46, h: 739.99, u: 783.99, j: 830.61,
  k: 880.00, o: 932.33, l: 987.77, p: 1046.50, ";": 1108.73
};

let activeOscillators = {};

// Ruido blanco
function createWhiteNoise() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  return whiteNoise;
}

// Ruido rosa
function createPinkNoise() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0,b1,b2,b3,b4,b5,b6;
  b0=b1=b2=b3=b4=b5=b6=0.0;
  for(let i=0;i<bufferSize;i++){
    let white = Math.random()*2-1;
    b0=0.99886*b0+white*0.0555179;
    b1=0.99332*b1+white*0.0750759;
    b2=0.96900*b2+white*0.1538520;
    b3=0.86650*b3+white*0.3104856;
    b4=0.55000*b4+white*0.5329522;
    b5=-0.7616*b5-white*0.0168980;
    output[i]=b0+b1+b2+b3+b4+b5+b6+white*0.5362;
    output[i]*=0.11;
    b6=white*0.115926;
  }
  const pinkNoise=audioCtx.createBufferSource();
  pinkNoise.buffer=noiseBuffer;
  pinkNoise.loop=true;
  return pinkNoise;
}

// Tocar nota con armónicos y ruido si está activado
function playTone(key) {
  if (!noteFrequencies[key] || activeOscillators[key]) return;

  const fundamental = noteFrequencies[key];

  const harmonics = [];
  if (document.getElementById("harm1").checked) harmonics.push({ ratio: 1, gain: 1.0 });
  if (document.getElementById("harm2").checked) harmonics.push({ ratio: 2, gain: 0.5 });
  if (document.getElementById("harm3").checked) harmonics.push({ ratio: 3, gain: 0.25 });
  if (harmonics.length === 0) return;

  const waveform = waveformSelector ? waveformSelector.value : "sine";

  const oscillators = [];

  // Crear osciladores armónicos
  harmonics.forEach(h => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.value = fundamental * h.ratio;
    gain.gain.value = h.gain;
    osc.connect(gain).connect(gainNode);
    osc.start();
    oscillators.push({ osc, gain });
  });

  // Añadir ruido si activado
  const selectedNoise = noiseTypeSelect.value;
  const noiseVol = parseFloat(noiseVolumeSlider.value);
  if (selectedNoise !== "none" && noiseVol > 0) {
    let noiseOsc = null;
    if (selectedNoise === "white") noiseOsc = createWhiteNoise();
    else if (selectedNoise === "pink") noiseOsc = createPinkNoise();

    if (noiseOsc) {
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.value = noiseVol;
      noiseOsc.connect(noiseGain).connect(gainNode);
      noiseOsc.start();
      oscillators.push({ osc: noiseOsc, gain: noiseGain, isNoise: true });
    }
  }

  activeOscillators[key] = oscillators;

  const keyElem = document.querySelector(`[data-key="${key}"]`);
  if (keyElem) keyElem.classList.add("active");
}

// Detener nota y ruido asociado
function stopTone(key) {
  const oscGroup = activeOscillators[key];
  if (!oscGroup) return;

  oscGroup.forEach(({ osc, gain }) => {
    osc.stop();
    osc.disconnect();
    gain.disconnect();
  });

  delete activeOscillators[key];

  const keyElem = document.querySelector(`[data-key="${key}"]`);
  if (keyElem) keyElem.classList.remove("active");
}

// Eventos para piano con mouse
pianoKeys.forEach(keyElem => {
  const key = keyElem.dataset.key;
  keyElem.addEventListener("mousedown", () => playTone(key));
  keyElem.addEventListener("mouseup", () => stopTone(key));
  keyElem.addEventListener("mouseleave", () => stopTone(key));
});

// Eventos para teclado físico
document.addEventListener("keydown", e => {
  if (e.repeat) return;
  playTone(e.key.toLowerCase());
});
document.addEventListener("keyup", e => stopTone(e.key.toLowerCase()));

// Control volumen
volumeSlider.addEventListener("input", e => {
  gainNode.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
});

// Mostrar/ocultar letras
keysCheckbox.addEventListener("click", () => {
  pianoKeys.forEach(key => key.classList.toggle("hide"));
});

// Control filtro paso bajo
filterCutoffSlider.addEventListener("input", e => {
  filterNode.frequency.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.01);
});




