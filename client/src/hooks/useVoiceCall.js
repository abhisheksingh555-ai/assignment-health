import {
  useRef,
  useState,
} from "react";

import { api } from "../services/api";

import {
  closeSocket,
  connectSocket,
  sendSocketBinary,
} from "../services/socket";

import { playAudio } from "./useAudioPlayer";

export const useVoiceCall = () => {
  const socketRef = useRef(null);

  const [sessionId, setSessionId] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [connected, setConnected] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [ttsAvailable, setTtsAvailable] =
    useState(true);

  const [report, setReport] =
    useState(null);

  const [error, setError] =
    useState(null);

  /*
   * ============================================
   * START CALL
   * ============================================
   */

  const startCall = async () => {
    try {
      setError(null);
      setProcessing(true);

      /*
       * ------------------------------------------
       * CREATE CONVERSATION
       * ------------------------------------------
       */

      const response =
        await api.post(
          "/api/conversations/start"
        );

      const data =
        response?.data?.data;

      if (!data?.sessionId) {
        throw new Error(
          "Conversation session was not created."
        );
      }

      const newSessionId =
        data.sessionId;

      console.log(
        "Conversation session created:",
        newSessionId
      );

      setSessionId(newSessionId);

      setTtsAvailable(
        data.ttsAvailable ?? false
      );

      /*
       * ------------------------------------------
       * INITIAL GREETING
       * ------------------------------------------
       */

      setMessages([
        {
          role: "assistant",
          text: data.greeting || "",
        },
      ]);

      /*
       * ------------------------------------------
       * CREATE ONE WEBSOCKET
       * ------------------------------------------
       */

      const ws = connectSocket();

      socketRef.current = ws;

      /*
       * ------------------------------------------
       * WEBSOCKET OPEN
       * ------------------------------------------
       */

      ws.onopen = () => {
        console.log(
          "WebSocket connected"
        );

        setConnected(true);

        /*
         * IMPORTANT:
         * Send the same session ID that
         * was created by REST API.
         */

        ws.send(
          JSON.stringify({
            type: "session:set",
            sessionId: newSessionId,
          })
        );

        console.log(
          "Session ID sent to WebSocket:",
          newSessionId
        );
      };

      /*
       * ------------------------------------------
       * WEBSOCKET MESSAGE
       * ------------------------------------------
       */

      ws.onmessage = async (
        event
      ) => {
        try {
          const message =
            JSON.parse(event.data);

          console.log(
            "WS message:",
            message
          );

          /*
           * ======================================
           * CONNECTED
           * ======================================
           */

          if (
            message.type ===
            "connected"
          ) {
            return;
          }

          /*
           * ======================================
           * SESSION READY
           * ======================================
           */

          if (
            message.type ===
            "session:ready"
          ) {
            console.log(
              "WebSocket session ready:",
              message.sessionId
            );

            return;
          }

          /*
           * ======================================
           * TRANSCRIPT
           * ======================================
           */

          if (
            message.type ===
            "transcript"
          ) {
            setMessages(
              (previous) => [
                ...previous,
                {
                  role: "user",
                  text:
                    message.transcript,
                },
              ]
            );

            return;
          }

          /*
           * ======================================
           * PROCESSING
           * ======================================
           */

          if (
            message.type ===
            "processing"
          ) {
            setProcessing(true);

            return;
          }

          /*
           * ======================================
           * AI RESPONSE
           * ======================================
           *
           * Backend sends:
           *
           * {
           *   type: "response",
           *   text: "...",
           *   ttsAvailable: false
           * }
           */

          if (
            message.type ===
            "response"
          ) {
            setProcessing(false);

            setMessages(
              (previous) => [
                ...previous,
                {
                  role: "assistant",
                  text:
                    message.text || "",
                },
              ]
            );

            setTtsAvailable(
              message.ttsAvailable ??
                false
            );

            return;
          }

          /*
           * ======================================
           * AUDIO
           * ======================================
           *
           * Backend sends audio separately:
           *
           * {
           *   type: "audio",
           *   audio: "base64...",
           *   mimeType: "audio/mpeg"
           * }
           */

          if (
            message.type ===
            "audio"
          ) {
            if (!message.audio) {
              console.warn(
                "Audio message received without audio data."
              );

              return;
            }

            try {
              await playAudio(
                message.audio
              );
            } catch (audioError) {
              console.error(
                "Audio playback failed:",
                audioError
              );

              /*
               * Audio failure should NOT
               * break the conversation.
               */

              setError(
                "AI response received, but audio playback is unavailable."
              );
            }

            return;
          }

          /*
           * ======================================
           * WARNING
           * ======================================
           */

          if (
            message.type ===
            "warning"
          ) {
            console.warn(
              "Voice warning:",
              message
            );

            /*
             * Do not mark entire conversation
             * as failed.
             */

            return;
          }

          /*
           * ======================================
           * ERROR
           * ======================================
           */

          if (
            message.type ===
            "error"
          ) {
            console.error(
              "Voice processing error:",
              message
            );

            setProcessing(false);

            setError(
              message.message ||
                "Something went wrong."
            );

            return;
          }
        } catch (messageError) {
          console.error(
            "WebSocket message error:",
            messageError
          );
        }
      };

      /*
       * ------------------------------------------
       * WEBSOCKET ERROR
       * ------------------------------------------
       */

      ws.onerror = (event) => {
        console.error(
          "WebSocket error:",
          event
        );

        setError(
          "Voice connection failed."
        );

        setConnected(false);
        setProcessing(false);
      };

      /*
       * ------------------------------------------
       * WEBSOCKET CLOSE
       * ------------------------------------------
       */

      ws.onclose = () => {
        console.log(
          "WebSocket disconnected"
        );

        setConnected(false);
        setProcessing(false);
      };

      /*
       * ------------------------------------------
       * GREETING AUDIO
       * ------------------------------------------
       *
       * ElevenLabs may be unavailable.
       * So audio is optional.
       */

      if (data.audio) {
        try {
          await playAudio(
            data.audio
          );
        } catch (audioError) {
          console.error(
            "Greeting audio failed:",
            audioError
          );
        }
      }

      setProcessing(false);
    } catch (error) {
      console.error(
        "Start call error:",
        error
      );

      setError(
        error.response?.data?.error
          ?.message ||
          error.message ||
          "Unable to start the call."
      );

      setConnected(false);
      setProcessing(false);
    }
  };

  /*
   * ============================================
   * SEND AUDIO
   * ============================================
   */

  const sendAudio = async (
    buffer
  ) => {
    try {
      if (!sessionId) {
        throw new Error(
          "No active conversation."
        );
      }

      const socket =
        socketRef.current;

      if (!socket) {
        throw new Error(
          "Voice connection is not ready."
        );
      }

      if (
        socket.readyState !==
        WebSocket.OPEN
      ) {
        throw new Error(
          "Voice connection is not open yet."
        );
      }

      if (!buffer) {
        throw new Error(
          "No audio data available."
        );
      }

      setProcessing(true);

      await sendSocketBinary(
        buffer
      );

      console.log(
        "Audio sent successfully"
      );
    } catch (error) {
      console.error(
        "Send audio error:",
        error
      );

      setProcessing(false);

      setError(
        error.message ||
          "Failed to send audio."
      );
    }
  };

  /*
   * ============================================
   * END CALL
   * ============================================
   */

  const endCall = async () => {
    try {
      if (!sessionId) {
        return;
      }

      await api.post(
        `/api/conversations/${sessionId}/end`
      );

      closeSocket();

      socketRef.current = null;

      setSessionId(null);
      setConnected(false);
      setProcessing(false);
      setTtsAvailable(false);
    } catch (error) {
      console.error(
        "End call error:",
        error
      );

      setError(
        error.response?.data?.error
          ?.message ||
          "Failed to end the call."
      );
    }
  };

  return {
    sessionId,
    messages,
    connected,
    processing,
    ttsAvailable,
    report,
    error,
    startCall,
    sendAudio,
    endCall,
  };
};