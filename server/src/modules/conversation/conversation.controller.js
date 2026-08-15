import {
  createConversation,
  endConversation,
} from "./conversation.service.js";

import { successResponse } from "../../core/response/response.js";

export const startConversation = async (req, res, next) => {
  try {
    console.log("START CONVERSATION REQUEST");

    const result = await createConversation();

    console.log("CONVERSATION CREATED:", {
      sessionId: result.sessionId,
      ttsAvailable: result.ttsAvailable,
      hasAudio: Boolean(result.audio),
    });

    const audioBase64 = result.audio
      ? result.audio.toString("base64")
      : null;

    return successResponse(
      res,
      {
        sessionId: result.sessionId,
        greeting: result.greeting,
        audio: audioBase64,
        ttsAvailable: result.ttsAvailable,
      },
      "Conversation started",
      201
    );
  } catch (error) {
    console.error("START CONVERSATION ERROR:");
    console.error(error);

    next(error);
  }
};

export const finishConversation = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const conversation = endConversation(sessionId);

    return successResponse(
      res,
      {
        conversation,
      },
      "Conversation ended"
    );
  } catch (error) {
    console.error("END CONVERSATION ERROR:");
    console.error(error);

    next(error);
  }
};