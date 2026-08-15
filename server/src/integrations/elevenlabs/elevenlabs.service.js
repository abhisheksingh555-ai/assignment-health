import { ElevenLabsClient } from "elevenlabs";

import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";

const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

export const synthesizeSpeech = async (text) => {
  try {
    console.log("ElevenLabs request:", {
      voiceId: env.ELEVENLABS_VOICE_ID,
      text,
    });

    const audioStream = await elevenlabs.textToSpeech.convert(
      env.ELEVENLABS_VOICE_ID,
      {
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      }
    );

    const chunks = [];

    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);

    if (!audioBuffer.length) {
      throw new AppError(
        "ElevenLabs returned empty audio.",
        502,
        "TTS_EMPTY_AUDIO"
      );
    }

    console.log(
      `ElevenLabs audio generated: ${audioBuffer.length} bytes`
    );

    return audioBuffer;
  } catch (error) {
    console.error("ELEVENLABS ERROR:", error);

    const statusCode = error?.statusCode;

    if (statusCode === 402) {
      throw new AppError(
        "ElevenLabs account does not have enough credits for text-to-speech.",
        402,
        "TTS_CREDITS_EXHAUSTED"
      );
    }

    if (statusCode === 401) {
      throw new AppError(
        "ElevenLabs API key is invalid.",
        502,
        "TTS_AUTHENTICATION_FAILED"
      );
    }

    if (statusCode === 404) {
      throw new AppError(
        "ElevenLabs voice was not found.",
        502,
        "TTS_VOICE_NOT_FOUND"
      );
    }

    throw new AppError(
      "Failed to generate speech.",
      502,
      "TTS_REQUEST_FAILED"
    );
  }
};