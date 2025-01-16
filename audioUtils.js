// audioUtils.js

let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function createOscillator(ctx, type, frequency) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  return osc;
}

function createGain(ctx, gainValue) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  return gain;
}

function createBiquadFilter(ctx, type, frequency, Q) {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, ctx.currentTime);
  filter.Q.setValueAtTime(Q, ctx.currentTime);
  return filter;
}

export { initAudio, createOscillator, createGain, createBiquadFilter };
