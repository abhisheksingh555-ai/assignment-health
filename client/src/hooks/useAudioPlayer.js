export const playAudio = (base64Audio) => {
  return new Promise((resolve, reject) => {
    if (!base64Audio) {
      resolve(false);
      return;
    }

    const audio = new Audio(
      `data:audio/mpeg;base64,${base64Audio}`
    );

    audio.onended = () => {
      resolve(true);
    };

    audio.onerror = () => {
      reject(new Error("Failed to play audio"));
    };

    audio.play().catch(reject);
  });
};