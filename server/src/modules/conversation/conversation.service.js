import crypto from "node:crypto";

import {
  addMessage,
  createConversationState,
  getConversationState,
  updateConversationState,
  setConversationLanguage,
} from "./conversation.state.js";

import {
  generateAssistantResponse,
} from "../../integrations/gemini/gemini.service.js";

import {
  synthesizeSpeech,
} from "../../integrations/elevenlabs/elevenlabs.service.js";

import { AppError } from "../../core/errors/AppError.js";


/*
 * ============================================
 * CREATE CONVERSATION
 * ============================================
 */

export const createConversation = async () => {
  const sessionId = crypto.randomUUID();

  console.log(
    "Creating session:",
    sessionId
  );

  createConversationState(sessionId);

  const greeting =
    "Hello! I'm your health screening assistant. I'll ask you a few questions about how you're feeling. To begin, could you please tell me your name?";

  /*
   * ------------------------------------------
   * SAVE GREETING
   * ------------------------------------------
   */

  addMessage(sessionId, {
    role: "assistant",
    content: greeting,
  });

  /*
   * ------------------------------------------
   * INITIAL SCREENING STATE
   * ------------------------------------------
   */

  updateConversationState(sessionId, {
    currentStage: "name",

    askedQuestions: [
      "name",
    ],
  });

  /*
   * ------------------------------------------
   * TTS
   * ------------------------------------------
   */

  let audio = null;

  let ttsAvailable = false;

  try {
    console.log(
      "Generating greeting audio..."
    );

    audio =
      await synthesizeSpeech(
        greeting
      );

    if (audio) {
      ttsAvailable = true;

      console.log(
        "Greeting audio generated."
      );
    }
  } catch (error) {
    console.error(
      "Greeting TTS failed:",
      error
    );

    audio = null;

    ttsAvailable = false;

    /*
     * TTS is optional.
     *
     * Conversation must continue
     * even when ElevenLabs fails.
     */
  }

  /*
   * ------------------------------------------
   * RETURN
   * ------------------------------------------
   */

  return {
    sessionId,

    state:
      getConversationState(
        sessionId
      ),

    greeting,

    audio,

    ttsAvailable,
  };
};


/*
 * ============================================
 * PROCESS USER MESSAGE
 * ============================================
 */

export const processUserMessage = async ({
  sessionId,
  transcript,
  language = null,
}) => {

  /*
   * ------------------------------------------
   * GET SESSION
   * ------------------------------------------
   */

  const state =
    getConversationState(
      sessionId
    );

  if (!state) {
    throw new AppError(
      "Conversation session not found.",
      404,
      "CONVERSATION_NOT_FOUND"
    );
  }

  /*
   * ------------------------------------------
   * CHECK STATUS
   * ------------------------------------------
   */

  if (state.status !== "active") {
    throw new AppError(
      "Conversation is no longer active.",
      400,
      "CONVERSATION_NOT_ACTIVE"
    );
  }

  /*
   * ------------------------------------------
   * CLEAN TRANSCRIPT
   * ------------------------------------------
   */

  const cleanTranscript =
    transcript?.trim();

  if (!cleanTranscript) {
    throw new AppError(
      "No usable speech was detected.",
      400,
      "EMPTY_TRANSCRIPT"
    );
  }

  /*
   * ------------------------------------------
   * LANGUAGE
   * ------------------------------------------
   *
   * Deepgram language can be null when
   * mixed Hindi/English is detected.
   *
   * So only update it when available.
   */

  if (language) {
    setConversationLanguage(
      sessionId,
      language
    );
  }

  /*
   * ------------------------------------------
   * SAVE USER MESSAGE
   * ------------------------------------------
   */

  addMessage(sessionId, {
    role: "user",
    content: cleanTranscript,
  });

  /*
   * ------------------------------------------
   * GET UPDATED STATE
   * ------------------------------------------
   */

  const currentState =
    getConversationState(
      sessionId
    );

  /*
   * ------------------------------------------
   * BUILD GEMINI MESSAGES
   * ------------------------------------------
   */

  const llmMessages =
    currentState.messages.map(
      (message) => ({
        role: message.role,
        content: message.content,
      })
    );

  /*
   * ------------------------------------------
   * BUILD STRUCTURED STATE
   * ------------------------------------------
   */

  const conversationState = {
    currentStage:
      currentState.currentStage,

    language:
      currentState.language,

    collectedData:
      currentState.collectedData,

    askedQuestions:
      currentState.askedQuestions,
  };

  console.log(
    "\n========== CONVERSATION STATE =========="
  );

  console.log(
    JSON.stringify(
      conversationState,
      null,
      2
    )
  );

  console.log(
    "=========================================\n"
  );

  /*
   * ------------------------------------------
   * GEMINI
   * ------------------------------------------
   */

  const assistantText =
    await generateAssistantResponse({
      messages: llmMessages,

      conversationState,
    });

  /*
   * ------------------------------------------
   * VALIDATE AI RESPONSE
   * ------------------------------------------
   */

  const cleanAssistantText =
    assistantText?.trim();

  if (!cleanAssistantText) {
    throw new AppError(
      "AI response was empty.",
      502,
      "EMPTY_AI_RESPONSE"
    );
  }

  /*
   * ------------------------------------------
   * SAVE ASSISTANT MESSAGE
   * ------------------------------------------
   */

  addMessage(sessionId, {
    role: "assistant",
    content: cleanAssistantText,
  });

  /*
   * ------------------------------------------
   * ELEVENLABS TTS
   * ------------------------------------------
   */

  let audio = null;

  let ttsAvailable = false;

  try {
    console.log(
      "Generating response audio..."
    );

    audio =
      await synthesizeSpeech(
        cleanAssistantText
      );

    if (audio) {
      ttsAvailable = true;

      console.log(
        "Response audio generated."
      );
    }
  } catch (error) {
    console.error(
      "Response TTS failed:",
      error
    );

    audio = null;

    ttsAvailable = false;

    /*
     * ----------------------------------------
     * TTS FAILURE IS NON-FATAL
     * ----------------------------------------
     */

    if (
      error?.code ===
      "TTS_CREDITS_EXHAUSTED"
    ) {
      console.warn(
        "ElevenLabs credits exhausted. Continuing without audio."
      );
    } else {
      console.warn(
        "TTS unavailable. Continuing with text response."
      );
    }
  }

  /*
   * ------------------------------------------
   * FINAL STATE
   * ------------------------------------------
   */

  const finalState =
    getConversationState(
      sessionId
    );

  /*
   * ------------------------------------------
   * RETURN
   * ------------------------------------------
   */

  return {
    transcript:
      cleanTranscript,

    response:
      cleanAssistantText,

    audio,

    ttsAvailable,

    state:
      finalState,
  };
};


/*
 * ============================================
 * END CONVERSATION
 * ============================================
 */

export const endConversation = (
  sessionId
) => {

  const state =
    getConversationState(
      sessionId
    );

  if (!state) {
    throw new AppError(
      "Conversation session not found.",
      404,
      "CONVERSATION_NOT_FOUND"
    );
  }

  updateConversationState(
    sessionId,
    {
      status: "completed",
      currentStage: "completed",
    }
  );

  return getConversationState(
    sessionId
  );
};