import { createClient } from "@deepgram/sdk";

import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";

const deepgram = createClient(env.DEEPGRAM_API_KEY);

export const transcribeAudio = async (audioBuffer) => {
  try {
    if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
      throw new AppError(
        "Invalid audio data.",
        400,
        "INVALID_AUDIO_DATA"
      );
    }

    if (audioBuffer.length === 0) {
      throw new AppError(
        "Audio data is empty.",
        400,
        "EMPTY_AUDIO"
      );
    }

    const { result, error } =
      await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: "nova-3",
          smart_format: true,
          punctuate: true,
          detect_language: true,
        }
      );

    if (error) {
      console.error("DEEPGRAM ERROR:", error);
      throw error;
    }

    const alternative =
      result?.results?.channels?.[0]?.alternatives?.[0];

    const transcript =
      alternative?.transcript?.trim() || "";

    const language =
      alternative?.languages?.[0] || null;

    if (!transcript) {
      throw new AppError(
        "No usable speech was detected.",
        400,
        "EMPTY_TRANSCRIPT"
      );
    }

    return {
      transcript,
      language,
    };
  } catch (error) {
    console.error("Deepgram transcription failed:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Speech recognition failed.",
      502,
      "STT_REQUEST_FAILED"
    );
  }
};