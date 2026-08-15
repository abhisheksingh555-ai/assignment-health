import { WebSocketServer } from "ws";

import { transcribeAudio } from "../integrations/deepgram/deepgram.service.js";

import {
  processUserMessage,
} from "../modules/conversation/conversation.service.js";

export const setupVoiceWebSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/call",
  });

  wss.on("connection", (ws) => {
    console.log("[INFO] WebSocket client connected");

    let sessionId = null;

    /*
     * ============================================
     * CONNECTION MESSAGE
     * ============================================
     */

    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Voice WebSocket connected",
      })
    );

    /*
     * ============================================
     * MESSAGE HANDLER
     * ============================================
     */

    ws.on("message", async (data, isBinary) => {
      try {
        /*
         * ========================================
         * TEXT MESSAGE
         * ========================================
         *
         * Frontend can send:
         *
         * {
         *   type: "session:set",
         *   sessionId: "..."
         * }
         */

        if (!isBinary) {
          let message;

          try {
            message = JSON.parse(data.toString());
          } catch {
            console.warn(
              "Invalid WebSocket JSON message."
            );

            return;
          }

          /*
           * --------------------------------------
           * SET SESSION
           * --------------------------------------
           */

          if (message.type === "session:set") {
            if (!message.sessionId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  code: "INVALID_SESSION_ID",
                  message:
                    "Session ID is required.",
                })
              );

              return;
            }

            sessionId = message.sessionId;

            console.log(
              "WebSocket session set:",
              sessionId
            );

            ws.send(
              JSON.stringify({
                type: "session:ready",
                sessionId,
              })
            );

            return;
          }

          return;
        }

        /*
         * ========================================
         * BINARY AUDIO
         * ========================================
         */

        if (!sessionId) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "SESSION_NOT_FOUND",
              message:
                "Conversation session not found.",
            })
          );

          return;
        }

        /*
         * ========================================
         * AUDIO BUFFER
         * ========================================
         */

        const audioBuffer = Buffer.isBuffer(data)
          ? data
          : Buffer.from(data);

        if (
          !audioBuffer ||
          audioBuffer.length === 0
        ) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "EMPTY_AUDIO",
              message:
                "No audio data received.",
            })
          );

          return;
        }

        /*
         * ========================================
         * PROCESSING
         * ========================================
         */

        ws.send(
          JSON.stringify({
            type: "processing",
          })
        );

        /*
         * ========================================
         * DEEPGRAM
         * ========================================
         */

        const transcription =
          await transcribeAudio(audioBuffer);

        const transcript =
          transcription?.transcript?.trim() || "";

        const language =
          transcription?.language || null;

        if (!transcript) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "EMPTY_TRANSCRIPT",
              message:
                "I couldn't understand the audio.",
            })
          );

          return;
        }

        /*
         * ========================================
         * SEND TRANSCRIPT
         * ========================================
         */

        ws.send(
          JSON.stringify({
            type: "transcript",
            transcript,
            language,
          })
        );

        /*
         * ========================================
         * GEMINI + TTS
         * ========================================
         */

        const result =
          await processUserMessage({
            sessionId,
            transcript,
          });

        console.log(
          "Conversation processed:",
          {
            sessionId,
            ttsAvailable:
              result?.ttsAvailable ?? false,
            hasAudio:
              Boolean(result?.audio),
          },
        );

        /*
         * ========================================
         * SEND AI TEXT
         * ========================================
         */

        ws.send(
          JSON.stringify({
            type: "response",
            text:
              result?.response || "",
            ttsAvailable:
              result?.ttsAvailable ?? false,
          })
        );

        /*
         * ========================================
         * SEND AUDIO
         * ========================================
         */

        if (result?.audio) {
          try {
            const arrayBuffer =
              await result.audio.arrayBuffer();

            const responseAudioBuffer =
              Buffer.from(arrayBuffer);

            if (
              responseAudioBuffer.length > 0
            ) {
              ws.send(
                JSON.stringify({
                  type: "audio",
                  audio:
                    responseAudioBuffer.toString(
                      "base64"
                    ),
                  mimeType: "audio/mpeg",
                })
              );

              console.log(
                "AI audio sent successfully."
              );
            }
          } catch (audioError) {
            console.error(
              "Audio processing failed:",
              audioError
            );

            ws.send(
              JSON.stringify({
                type: "warning",
                code: "AUDIO_UNAVAILABLE",
                message:
                  "AI response is available, but audio playback is unavailable.",
              })
            );
          }
        } else {
          console.log(
            "TTS unavailable. Text response sent successfully."
          );
        }
      } catch (error) {
        console.error(
          "WebSocket processing failed:",
          error
        );

        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({
              type: "error",
              code:
                error?.code ||
                "VOICE_PROCESSING_FAILED",
              message:
                error?.message ||
                "Unable to process your voice message.",
            })
          );
        }
      }
    });

    /*
     * ============================================
     * CLOSE
     * ============================================
     */

    ws.on("close", () => {
      console.log(
        "[INFO] WebSocket client disconnected:",
        sessionId
      );
    });

    /*
     * ============================================
     * ERROR
     * ============================================
     */

    ws.on("error", (error) => {
      console.error(
        "[ERROR] WebSocket error:",
        error
      );
    });
  });

  console.log(
    "[INFO] WebSocket server listening on ws://localhost:3001/call"
  );

  return wss;
};