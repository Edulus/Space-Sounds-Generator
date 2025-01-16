let globalVolume = 0.5;

export function initVolumeControl(activeSounds) {
  const volumeSlider = document.getElementById("volume-control");
  volumeSlider.addEventListener("input", (event) =>
    handleVolumeChange(event, activeSounds)
  );
  updateVolumeSliderFill();
}

function handleVolumeChange(event, activeSounds) {
  const newVolume = parseFloat(event.target.value);
  updateVolume(newVolume, activeSounds);
}

function updateVolume(newVolume, activeSounds) {
  globalVolume = newVolume;
  activeSounds.forEach((sound) => {
    sound.setVolume(globalVolume);
  });
  updateVolumeSliderFill();
}

function updateVolumeSliderFill() {
  const volumeSlider = document.getElementById("volume-control");
  const volumeSliderFill = document.querySelector(".volume-slider-fill");
  const percentage =
    ((volumeSlider.value - volumeSlider.min) /
      (volumeSlider.max - volumeSlider.min)) *
    100;
  volumeSliderFill.style.width = `${percentage}%`;
}

export function getGlobalVolume() {
  return globalVolume;
}
