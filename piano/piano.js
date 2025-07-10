// Elementos DOM
const pianoKeys = document.querySelectorAll(".piano-keys .key");
const filterCutoffSlider = document.getElementById("filterCutoff");
const volumeSlider = document.querySelector(".volume-slider input");
const keysCheckbox = document.querySelector(".keys-checkbox input");
const waveformSelector = document.getElementById("waveformType");
const baseFreqInput = document.getElementById("baseFreq");
const harmonicsWaveformSelector = document.getElementById("harmonicsWaveform");

// Contexto y nodos audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const gainNode = audioCtx.createGain();
gainNode.gain.value = volumeSlider.value;

const filterNode = audioCtx.createBiquadFilter();
filterNode.type = "lowpass";
filterNode.frequency.value = filterCutoffSlider.value || 5000;

gainNode.connect(filterNode);
filterNode.connect(audioCtx.destination);

// Ratios de notas basado en la frecuencia base
const noteRatios = {
  a: 1,
  w: Math.pow(2, 1/12),
  s: Math.pow(2, 2/12),
  e: Math.pow(2, 3/12),
  d: Math.pow(2, 4/12),
  f: Math.pow(2, 5/12),
  t: Math.pow(2, 6/12),
  g: Math.pow(2, 7/12),
  y: Math.pow(2, 8/12),
  h: Math.pow(2, 9/12),
  u: Math.pow(2, 10/12),
  j: Math.pow(2, 11/12),
  k: 2,             // una octava arriba
  o: Math.pow(2, 13/12),
  l: Math.pow(2, 14/12),
  p: Math.pow(2, 15/12),
  ";": Math.pow(2, 16/12)
};

let activeOscillators = {};
let currentWaveform = waveformSelector.value;

function resumeAudioContext() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function updateFrequencyDisplay(freq) {
  const freqBar = document.getElementById("freqBar");
  const freqValue = document.getElementById("freqValue");

  if (!freqBar || !freqValue) return;

  const minFreq = 100;
  const maxFreq = 1200;
  const clamped = Math.min(Math.max(freq, minFreq), maxFreq);
  const percentage = ((clamped - minFreq) / (maxFreq - minFreq)) * 100;

  freqBar.style.width = `${percentage}%`;
  freqValue.textContent = `Frecuencia: ${freq.toFixed(2)} Hz`;
}

// Función para tocar nota con armónicos
function playTone(key) {
  if (!noteRatios[key] || activeOscillators[key]) return;

  resumeAudioContext();

  const baseFrequency = parseFloat(baseFreqInput.value) || 440;
  const fundamental = baseFrequency * noteRatios[key];

  updateFrequencyDisplay(fundamental);

  const harmonics = [];
  if (document.getElementById("harm1").checked) harmonics.push({ ratio: 1, gain: 1.0 });
  if (document.getElementById("harm2").checked) harmonics.push({ ratio: 2, gain: 0.5 });
  if (document.getElementById("harm3").checked) harmonics.push({ ratio: 3, gain: 0.25 });
  if (harmonics.length === 0) return;

  const oscillators = [];

  harmonics.forEach((h, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Primer armónico usa currentWaveform, otros usan lo que el usuario seleccione en harmonicsWaveformSelector
    osc.type = (index === 0) ? currentWaveform : (harmonicsWaveformSelector ? harmonicsWaveformSelector.value : "triangle");

    osc.frequency.value = fundamental * h.ratio;
    gain.gain.value = h.gain;

    osc.connect(gain).connect(gainNode);
    osc.start();

    oscillators.push({ osc, gain });
  });

  activeOscillators[key] = oscillators;

  const keyElem = document.querySelector(`[data-key="${key}"]`);
  if (keyElem) keyElem.classList.add("active");
}

// Función para detener nota
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

// Actualizar waveform solo para futuras notas, no detener las activas
waveformSelector.addEventListener("change", () => {
  currentWaveform = waveformSelector.value;
});


