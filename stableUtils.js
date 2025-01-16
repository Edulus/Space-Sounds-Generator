// stableUtils.js

export function createSound(audioContext, setup, loop) {
  const nodes = setup(audioContext);

  if (loop) {
    const intervalId = setInterval(
      () => loop.action(audioContext, nodes),
      loop.interval
    );
    return {
      stop: () => {
        clearInterval(intervalId);
        nodes.forEach((node) => node.stop && node.stop());
        nodes.forEach((node) => node.disconnect && node.disconnect());
      },
    };
  }

  return {
    stop: () => {
      nodes.forEach((node) => node.stop && node.stop());
      nodes.forEach((node) => node.disconnect && node.disconnect());
    },
  };
}

export function toggleSound(activeSounds, sounds, soundType, volume) {
  if (activeSounds.has(soundType)) {
    activeSounds.get(soundType).stop();
    activeSounds.delete(soundType);
    return false;
  } else {
    const sound = sounds[soundType](volume);
    activeSounds.set(soundType, sound);
    return true;
  }
}

export function updateAllSoundsButtonText(sounds, activeSounds) {
  const allSoundsButton = document.getElementById("all-sounds-toggle");
  const allSoundsOn = Object.keys(sounds).every((soundType) =>
    activeSounds.has(soundType)
  );
  allSoundsButton.textContent = allSoundsOn
    ? "All Sounds On"
    : "All Sounds Off";
}
