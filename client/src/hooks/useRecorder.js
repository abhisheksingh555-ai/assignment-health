import { useRef, useState } from "react";

export const useRecorder = () => {
  const mediaRecorderRef = useRef(null);

  const chunksRef = useRef([]);

  const [recording, setRecording] =
    useState(false);

  const startRecording = async () => {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

    const recorder =
      new MediaRecorder(stream);

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      chunksRef.current.push(event.data);
    };

    recorder.start();

    mediaRecorderRef.current = recorder;

    setRecording(true);
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      const recorder =
        mediaRecorderRef.current;

      recorder.onstop = async () => {
        const blob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const buffer =
          await blob.arrayBuffer();

        setRecording(false);

        resolve(buffer);
      };

      recorder.stop();
    });
  };

  return {
    recording,
    startRecording,
    stopRecording,
  };
};