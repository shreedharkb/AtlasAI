// Zero-latency, realistic mechanical keyboard ASMR / tactile thock synthesizer using Web Audio API
let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playKeyboardSound(e) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const key = typeof e === "string" ? e : e?.key || "a";

    // Ignore modifier-only keypresses
    if (["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"].includes(key)) return;

    // Determine sound profile (Thock / Clack / Spacebar / Enter)
    const isEnter = key === "Enter";
    const isSpace = key === " ";
    const isBackspace = key === "Backspace";

    // Base frequency & duration depending on key type
    let baseFreq = 850 + (Math.random() * 300 - 150); // Letter keys crisp switch click
    let duration = 0.045;
    let clickGainVal = 0.12;
    let thockFreq = 160 + (Math.random() * 40 - 20);

    if (isEnter || isBackspace) {
      baseFreq = 600 + Math.random() * 100;
      thockFreq = 120;
      duration = 0.06;
      clickGainVal = 0.18;
    } else if (isSpace) {
      baseFreq = 500 + Math.random() * 80;
      thockFreq = 100;
      duration = 0.07;
      clickGainVal = 0.2;
    }

    // 1. High-frequency crisp mechanical switch click (Bandpass filtered white noise burst)
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(clickGainVal, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Low-frequency tactile "Thock" / bottom-out resonance (Triangle oscillator)
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(thockFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, thockFreq * 0.4), now + duration * 0.8);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(clickGainVal * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // Start both layers
    noise.start(now);
    osc.start(now);
    noise.stop(now + duration);
    osc.stop(now + duration);
  } catch (err) {
    // Ignore audio context or autoplay policy errors
  }
}
