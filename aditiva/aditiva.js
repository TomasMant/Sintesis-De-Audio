let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let osc1 = null;
let osc2 = null;
let gain1 = null;
let gain2 = null;

function createOscillator(freq, type) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  gainNode.gain.value = 0.2;

  oscillator.connect(gainNode).connect(audioCtx.destination);
  return { oscillator, gainNode };
}

// --- Controles Oscilador 1 ---
document.getElementById("play1").addEventListener("click", () => {
  if (!osc1) {
    const freq = parseFloat(document.getElementById("freq1").value);
    const type = document.getElementById("wave1").value;
    ({ oscillator: osc1, gainNode: gain1 } = createOscillator(freq, type));
    osc1.start();
  }
});

document.getElementById("stop1").addEventListener("click", () => {
  if (osc1) {
    osc1.stop();
    osc1.disconnect();
    gain1.disconnect();
    osc1 = null;
    gain1 = null;
  }
});

document.getElementById("freq1").addEventListener("input", function () {
  document.getElementById("valFreq1").textContent = this.value;
  if (osc1) {
    osc1.frequency.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

document.getElementById("wave1").addEventListener("change", function () {
  if (osc1) {
    osc1.type = this.value;
  }
});

// --- Controles Oscilador 2 ---
document.getElementById("play2").addEventListener("click", () => {
  if (!osc2) {
    const freq = parseFloat(document.getElementById("freq2").value);
    const type = document.getElementById("wave2").value;
    ({ oscillator: osc2, gainNode: gain2 } = createOscillator(freq, type));
    osc2.start();
  }
});

document.getElementById("stop2").addEventListener("click", () => {
  if (osc2) {
    osc2.stop();
    osc2.disconnect();
    gain2.disconnect();
    osc2 = null;
    gain2 = null;
  }
});

document.getElementById("freq2").addEventListener("input", function () {
  document.getElementById("valFreq2").textContent = this.value;
  if (osc2) {
    osc2.frequency.setValueAtTime(this.value, audioCtx.currentTime);
  }
});

document.getElementById("wave2").addEventListener("change", function () {
  if (osc2) {
    osc2.type = this.value;
  }
});

// --- Reproducir / detener ambos ---
document.getElementById("playBoth").addEventListener("click", () => {
  if (!osc1) document.getElementById("play1").click();
  if (!osc2) document.getElementById("play2").click();
});

document.getElementById("stopBoth").addEventListener("click", () => {
  document.getElementById("stop1").click();
  document.getElementById("stop2").click();
});


