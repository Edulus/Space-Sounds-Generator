export function createSound(audioContext, setup, loop) {
  const nodes = setup(audioContext);

  const setVolume = (newVolume) => {
    const volumeNode = nodes[nodes.length - 1];
    if (volumeNode && volumeNode.gain) {
      volumeNode.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.01);
    }
  };

  if (loop) {
    const intervalId = setInterval(
      () => loop.action(audioContext, nodes),
      loop.interval
    );
    return {
      stop: () => {
        clearInterval(intervalId);
        nodes.forEach((node) => { try { node.stop && node.stop(); } catch (e) {} });
        nodes.forEach((node) => node.disconnect && node.disconnect());
      },
      setVolume,
    };
  }

  return {
    stop: () => {
      nodes.forEach((node) => { try { node.stop && node.stop(); } catch (e) {} });
      nodes.forEach((node) => node.disconnect && node.disconnect());
    },
    setVolume,
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
