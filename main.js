import {
  initAudio,
  createOscillator,
  createGain,
  createBiquadFilter,
} from "./audioUtils.js";
import { createSound, toggleSound } from "./stableUtils.js";
import { initVolumeControl, getGlobalVolume } from "./volumeControl.js";

let audioContext = initAudio();
const activeSounds = new Map();

const sounds = {
  "asteroid-doppler": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const bufferSize = 4096;
        const whiteNoise = ctx.createScriptProcessor(bufferSize, 1, 1);
        whiteNoise.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        };

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.Q.value = 1;

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.start();

        const noiseGain = createGain(ctx, 0);
        const oscGain = createGain(ctx, 0);
        const mixGain = createGain(ctx, volume);

        whiteNoise.connect(noiseFilter).connect(noiseGain);
        osc.connect(oscGain);
        noiseGain.connect(mixGain);
        oscGain.connect(mixGain);
        mixGain.connect(ctx.destination);

        return [whiteNoise, noiseFilter, osc, noiseGain, oscGain, mixGain];
      },
      {
        interval: 20,
        action: (ctx, [_, noiseFilter, osc, noiseGain, oscGain]) => {
          const now = ctx.currentTime;
          const orbitDuration = 3;
          const t = (now % orbitDuration) / orbitDuration;

          const baseNoiseFreq = 800;
          const noiseFreqRange = 1600;
          const noiseFrequency =
            baseNoiseFreq + noiseFreqRange * Math.sin(2 * Math.PI * t);
          noiseFilter.frequency.setTargetAtTime(noiseFrequency, now, 0.05);

          const baseOscFreq = 750;
          const oscFreqRange = 100;
          const oscFrequency =
            baseOscFreq + oscFreqRange * Math.sin(2 * Math.PI * t);
          osc.frequency.setTargetAtTime(oscFrequency, now, 0.05);

          const baseGain = 0.1;
          const gainRange = 0.25;
          const gainValue = baseGain + gainRange * (0.5 - Math.abs(t - 0.5));
          noiseGain.gain.setTargetAtTime(gainValue, now, 0.02);
          oscGain.gain.setTargetAtTime(gainValue * 0.3, now, 0.02);
        },
      }
    ),
  "star-twinkle": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc1 = createOscillator(ctx, "sine", 1000);
        const gain1 = createGain(ctx, 0);
        const osc2 = createOscillator(ctx, "sine", 2000);
        const gain2 = createGain(ctx, 0);
        const volumeGain = createGain(ctx, volume);
        osc1.connect(gain1).connect(volumeGain);
        osc2.connect(gain2).connect(volumeGain);
        volumeGain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        return [osc1, gain1, osc2, gain2, volumeGain];
      },
      {
        interval: 150,
        action: (ctx, [osc1, gain1, osc2, gain2]) => {
          gain1.gain.setValueAtTime(0, ctx.currentTime);
          gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
          gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
          osc1.frequency.setValueAtTime(
            500 + Math.random() * 1000,
            ctx.currentTime
          );

          if (Math.random() > 0.5) {
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
            gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
            osc2.frequency.setValueAtTime(
              2000 + Math.random() * 2000,
              ctx.currentTime
            );
          }
        },
      }
    ),
  /*
  "gravity-well": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const baseFrequency = 880;
        const orbitalPeriod = 7; // in seconds
        const schwarzschildRadius = (2 * 6.6743e-11 * 1.989e30) / (3e8 * 3e8); // for a solar mass black hole

        const osc1 = createOscillator(ctx, "sine", baseFrequency);
        const osc2 = createOscillator(ctx, "triangle", baseFrequency / 2);
        const lfo = createOscillator(ctx, "sine", 1 / orbitalPeriod);

        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(
          1,
          ctx.sampleRate * orbitalPeriod,
          ctx.sampleRate
        );
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const gain1 = createGain(ctx, 0.3);
        const gain2 = createGain(ctx, 0.2);
        const noiseGain = createGain(ctx, 0.1);
        const lfoGain = createGain(ctx, 50);
        const masterGain = createGain(ctx, 0.5);
        const volumeGain = createGain(ctx, volume);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        osc1.connect(gain1);
        osc2.connect(gain2);
        noise.connect(noiseGain);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(volumeGain);
        volumeGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        lfo.start();
        noise.start();

        return [
          osc1,
          osc2,
          lfo,
          noise,
          gain1,
          gain2,
          noiseGain,
          lfoGain,
          masterGain,
          volumeGain,
        ];
      },
      {
        interval: 50, // Reduced interval for more frequent updates
        action: (
          ctx,
          [osc1, osc2, lfo, noise, gain1, gain2, noiseGain, lfoGain, masterGain]
        ) => {
          const now = ctx.currentTime;
          const duration = orbitalPeriod;
          const initialRadius = 10 * schwarzschildRadius;
          const finalRadius = 2 * schwarzschildRadius;

          // Gravitational time dilation effect
          const timeDilationFactor = (r) =>
            Math.sqrt(1 - schwarzschildRadius / r);

          // Frequency shift based on orbital velocity and gravitational time dilation
          const frequencyShift = (t) => {
            const r =
              initialRadius - (initialRadius - finalRadius) * (t / duration);
            const orbitalVelocity = Math.sqrt((6.6743e-11 * 1.989e30) / r);
            const dopplerFactor = Math.sqrt(
              (1 - orbitalVelocity / 3e8) / (1 + orbitalVelocity / 3e8)
            );
            return baseFrequency * dopplerFactor * timeDilationFactor(r);
          };

          // Calculate the current time within the orbital period
          const t = (now % duration) / duration;

          // Immediate feedback: start with audible frequencies
          const currentFreq1 = frequencyShift(t);
          const currentFreq2 = currentFreq1 / 2;

          osc1.frequency.setTargetAtTime(currentFreq1, now, 0.01);
          osc2.frequency.setTargetAtTime(currentFreq2, now, 0.01);

          // LFO frequency adjustment
          lfo.frequency.setTargetAtTime(
            1 / orbitalPeriod + (9 * t) / orbitalPeriod,
            now,
            0.01
          );

          // LFO depth adjustment
          lfoGain.gain.setTargetAtTime(50 + 150 * t, now, 0.01);

          // Volume changes to simulate increasing intensity
          const volumeIntensity = 0.5 + 0.5 * t;
          masterGain.gain.setTargetAtTime(volumeIntensity, now, 0.01);

          // Noise intensity to simulate space-time distortion
          const noiseIntensity = 0.3 * Math.sin(Math.PI * t);
          noiseGain.gain.setTargetAtTime(noiseIntensity, now, 0.01);
        },
      }
    ),
    */
  // Original gravity well sound effect (commented out for reference)

  "gravity-well": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc1 = createOscillator(ctx, "sine", 880);
        const osc2 = createOscillator(ctx, "triangle", 440);
        const lfo = createOscillator(ctx, "sine", 0.1);
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(
          1,
          ctx.sampleRate * 5,
          ctx.sampleRate
        );
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const gain1 = createGain(ctx, 0.3);
        const gain2 = createGain(ctx, 0.2);
        const noiseGain = createGain(ctx, 0.1);
        const lfoGain = createGain(ctx, 10);
        const masterGain = createGain(ctx, 0.5);
        const volumeGain = createGain(ctx, volume);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        osc1.connect(gain1);
        osc2.connect(gain2);
        noise.connect(noiseGain);

        gain1.connect(masterGain);
        gain2.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(volumeGain);
        volumeGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        lfo.start();
        noise.start();

        return [
          osc1,
          osc2,
          lfo,
          noise,
          gain1,
          gain2,
          noiseGain,
          masterGain,
          volumeGain,
        ];
      },
      {
        interval: 7000,
        action: (
          ctx,
          [osc1, osc2, lfo, noise, gain1, gain2, noiseGain, masterGain]
        ) => {
          const now = ctx.currentTime;
          const duration = 7;

          // Pitch bend
          osc1.frequency.setValueAtTime(880, now);
          osc1.frequency.exponentialRampToValueAtTime(55, now + duration * 0.8);
          osc2.frequency.setValueAtTime(440, now);
          osc2.frequency.exponentialRampToValueAtTime(
            27.5,
            now + duration * 0.8
          );

          // LFO speed up
          lfo.frequency.setValueAtTime(0.1, now);
          lfo.frequency.exponentialRampToValueAtTime(2, now + duration * 0.6);

          // Volume changes
          masterGain.gain.setValueAtTime(0.5, now);
          masterGain.gain.linearRampToValueAtTime(1, now + duration * 0.2);
          masterGain.gain.linearRampToValueAtTime(0, now + duration);

          // Noise fade in and out
          noiseGain.gain.setValueAtTime(0, now);
          noiseGain.gain.linearRampToValueAtTime(0.2, now + duration * 0.3);
          noiseGain.gain.linearRampToValueAtTime(0, now + duration * 0.8);
        },
      }
    ),
  "gravity-well": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc1 = createOscillator(ctx, "sine", 880);
        const osc2 = createOscillator(ctx, "triangle", 440);
        const lfo = createOscillator(ctx, "sine", 0.1);
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(
          1,
          ctx.sampleRate * 5,
          ctx.sampleRate
        );
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const gain1 = createGain(ctx, 0.3);
        const gain2 = createGain(ctx, 0.2);
        const noiseGain = createGain(ctx, 0.1);
        const lfoGain = createGain(ctx, 10);
        const masterGain = createGain(ctx, 0.5);
        const volumeGain = createGain(ctx, volume);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        osc1.connect(gain1);
        osc2.connect(gain2);
        noise.connect(noiseGain);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(volumeGain);
        volumeGain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        lfo.start();
        noise.start();
        return [
          osc1,
          osc2,
          lfo,
          noise,
          gain1,
          gain2,
          noiseGain,
          masterGain,
          volumeGain,
        ];
      },
      {
        interval: 7000,
        action: (
          ctx,
          [osc1, osc2, lfo, noise, gain1, gain2, noiseGain, masterGain]
        ) => {
          const now = ctx.currentTime;
          const duration = 7;
          // Pitch bend
          osc1.frequency.setValueAtTime(880, now);
          osc1.frequency.exponentialRampToValueAtTime(55, now + duration * 0.8);
          osc2.frequency.setValueAtTime(440, now);
          osc2.frequency.exponentialRampToValueAtTime(
            27.5,
            now + duration * 0.8
          );
          // LFO speed up
          lfo.frequency.setValueAtTime(0.1, now);
          lfo.frequency.exponentialRampToValueAtTime(2, now + duration * 0.6);
          // Volume changes
          masterGain.gain.setValueAtTime(0.5, now);
          masterGain.gain.linearRampToValueAtTime(1, now + duration * 0.2);
          masterGain.gain.linearRampToValueAtTime(0, now + duration);
          // Noise fade in and out
          noiseGain.gain.setValueAtTime(0, now);
          noiseGain.gain.linearRampToValueAtTime(0.2, now + duration * 0.3);
          noiseGain.gain.linearRampToValueAtTime(0, now + duration * 0.8);
        },
      }
    ),

  "nebula-resonance": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc1 = createOscillator(ctx, "sine", 220);
        const osc2 = createOscillator(ctx, "sine", 330);
        const osc3 = createOscillator(ctx, "sine", 440);
        const gain1 = createGain(ctx, 0.2);
        const gain2 = createGain(ctx, 0.2);
        const gain3 = createGain(ctx, 0.2);
        const lfo = createOscillator(ctx, "sine", 0.1);
        const lfoGain = createGain(ctx, 10);
        const volumeGain = createGain(ctx, volume);
        lfo.connect(lfoGain);
        lfoGain.connect(gain1.gain);
        lfoGain.connect(gain2.gain);
        lfoGain.connect(gain3.gain);
        osc1.connect(gain1).connect(volumeGain);
        osc2.connect(gain2).connect(volumeGain);
        osc3.connect(gain3).connect(volumeGain);
        volumeGain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc3.start();
        lfo.start();
        return [osc1, osc2, osc3, lfo, volumeGain];
      },
      {
        interval: 5000,
        action: (ctx, [osc1, osc2, osc3]) => {
          const baseFreq = 220 + Math.random() * 110;
          osc1.frequency.linearRampToValueAtTime(baseFreq, ctx.currentTime + 5);
          osc2.frequency.linearRampToValueAtTime(
            baseFreq * 1.5,
            ctx.currentTime + 5
          );
          osc3.frequency.linearRampToValueAtTime(
            baseFreq * 2,
            ctx.currentTime + 5
          );
        },
      }
    ),
  "cosmic-pulsar": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc = createOscillator(ctx, "sawtooth", 400);
        const gain = createGain(ctx, 0.1);
        const volumeGain = createGain(ctx, volume);
        osc.connect(gain).connect(volumeGain).connect(ctx.destination);
        osc.start();
        return [osc, gain, volumeGain];
      },
      {
        interval: 200,
        action: (ctx, [osc, gain]) => {
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
          gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
          osc.frequency.exponentialRampToValueAtTime(
            800,
            ctx.currentTime + 0.05
          );
          osc.frequency.exponentialRampToValueAtTime(
            400,
            ctx.currentTime + 0.1
          );
        },
      }
    ),
  "quasar-pulse": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const oscs = [50, 75, 100].map((freq) =>
          createOscillator(ctx, "sawtooth", freq)
        );
        const gains = oscs.map(() => createGain(ctx, 0.1));
        const volumeGain = createGain(ctx, volume);
        oscs.forEach((osc, i) => osc.connect(gains[i]).connect(volumeGain));
        volumeGain.connect(ctx.destination);
        oscs.forEach((osc) => osc.start());
        return [...oscs, ...gains, volumeGain];
      },
      {
        interval: 3000,
        action: (ctx, nodes) => {
          const oscs = nodes.slice(0, 3);
          const gains = nodes.slice(3, 6);
          oscs.forEach((osc, i) => {
            gains[i].gain.setValueAtTime(0.1, ctx.currentTime);
            gains[i].gain.exponentialRampToValueAtTime(
              0.3,
              ctx.currentTime + 1.5
            );
            gains[i].gain.exponentialRampToValueAtTime(
              0.1,
              ctx.currentTime + 3
            );
            osc.frequency.setValueAtTime(50 * (i + 1), ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
              100 * (i + 1),
              ctx.currentTime + 1.5
            );
            osc.frequency.exponentialRampToValueAtTime(
              50 * (i + 1),
              ctx.currentTime + 3
            );
          });
        },
      }
    ),
  "quantum-flux": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc = createOscillator(ctx, "square", 440);
        const gain = createGain(ctx, 0.2);
        const volumeGain = createGain(ctx, volume);
        osc.connect(gain).connect(volumeGain).connect(ctx.destination);
        osc.start();
        return [osc, volumeGain];
      },
      {
        interval: 100,
        action: (ctx, [osc]) => {
          osc.frequency.setValueAtTime(
            440 * Math.pow(2, Math.floor(Math.random() * 4) / 12),
            ctx.currentTime
          );
        },
      }
    ),

  "alien-transmission": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const carrier = createOscillator(ctx, "sawtooth", 200);
        const modulator = createOscillator(ctx, "sine", 50);
        const modulatorGain = createGain(ctx, 100);
        const carrierGain = createGain(ctx, 0.8);
        const volumeGain = createGain(ctx, volume);
        modulator.connect(modulatorGain);
        modulatorGain.connect(carrier.frequency);
        carrier
          .connect(carrierGain)
          .connect(volumeGain)
          .connect(ctx.destination);
        carrier.start();
        modulator.start();
        return [carrier, modulator, carrierGain, volumeGain];
      },
      {
        interval: 500, // Increased from 100ms to 500ms
        action: (ctx, [carrier, modulator, carrierGain]) => {
          const now = ctx.currentTime;

          // Longer pauses, less frequent
          if (Math.random() < 0.15) {
            carrierGain.gain.setValueAtTime(0, now);
            carrierGain.gain.linearRampToValueAtTime(0.8, now + 0.5);
          } else {
            // Slower, more gradual frequency changes
            const baseFreq = 200 + Math.random() * 200; // Reduced range
            carrier.frequency.setValueAtTime(baseFreq, now);
            carrier.frequency.linearRampToValueAtTime(
              baseFreq + (Math.random() - 0.5) * 50, // Smaller variations
              now + 0.5 // Longer transition time
            );

            // Slower modulator frequency changes
            modulator.frequency.setValueAtTime(40 + Math.random() * 40, now);
            modulator.frequency.linearRampToValueAtTime(
              40 + Math.random() * 40,
              now + 0.5
            );

            // Smoother amplitude changes
            carrierGain.gain.setValueAtTime(0.6 + Math.random() * 0.2, now);
            carrierGain.gain.linearRampToValueAtTime(
              0.6 + Math.random() * 0.2,
              now + 0.5
            );
          }
        },
      }
    ),

  "dark-energy-hum": (volume) =>
    createSound(
      audioContext,
      (ctx) => {
        const osc1 = createOscillator(ctx, "sine", 60);
        const osc2 = createOscillator(ctx, "triangle", 63);
        const lfo = createOscillator(ctx, "sine", 0.1);
        const gain1 = createGain(ctx, 0.3);
        const gain2 = createGain(ctx, 0.3);
        const lfoGain = createGain(ctx, 5);
        const masterGain = createGain(ctx, 0.4);
        const volumeGain = createGain(ctx, volume);
        lfo.connect(lfoGain);
        lfoGain.connect(gain1.gain);
        lfoGain.connect(gain2.gain);
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        masterGain.connect(volumeGain);
        volumeGain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        lfo.start();
        return [osc1, osc2, lfo, masterGain, volumeGain];
      },
      {
        interval: 5000,
        action: (ctx, [osc1, osc2]) => {
          osc1.frequency.setValueAtTime(
            60 + Math.random() * 5,
            ctx.currentTime
          );
          osc2.frequency.setValueAtTime(
            63 + Math.random() * 5,
            ctx.currentTime
          );
        },
      }
    ),
};

function updateAllSoundsButtonState() {
  const allSoundsButton = document.getElementById("all-sounds-toggle");
  const isAnyPlaying = activeSounds.size > 0;

  allSoundsButton.textContent = isAnyPlaying
    ? "All Sounds Off"
    : "All Sounds On";
  allSoundsButton.classList.toggle("big-button-on", !isAnyPlaying);
  allSoundsButton.classList.toggle("big-button-off", isAnyPlaying);
}

function handleButtonClick(event) {
  if (event.target.id === "all-sounds-toggle") {
    toggleAllSounds();
  } else {
    const button = event.target.closest("button");
    if (button && button.id !== "all-sounds-toggle") {
      const soundType = button.id;
      const isPlaying = toggleSound(
        activeSounds,
        sounds,
        soundType,
        getGlobalVolume()
      );
      button.classList.toggle("playing", isPlaying);
      updateAllSoundsButtonState();
    }
  }
}

function toggleAllSounds() {
  const isAnyPlaying = activeSounds.size > 0;

  if (isAnyPlaying) {
    activeSounds.forEach((sound, soundType) => {
      sound.stop();
      document.getElementById(soundType).classList.remove("playing");
    });
    activeSounds.clear();
  } else {
    Object.keys(sounds).forEach((soundType) => {
      if (!activeSounds.has(soundType)) {
        const sound = sounds[soundType](getGlobalVolume());
        activeSounds.set(soundType, sound);
        document.getElementById(soundType).classList.add("playing");
      }
    });
  }

  updateAllSoundsButtonState();
}

document
  .getElementById("soundButtons")
  .addEventListener("click", handleButtonClick);

document
  .getElementById("all-sounds-toggle")
  .addEventListener("click", handleButtonClick);

// Initialize volume control
initVolumeControl(activeSounds);

// Initial update of the All Sounds button state
updateAllSoundsButtonState();
