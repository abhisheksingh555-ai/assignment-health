import { GoogleGenAI } from "@google/genai";

import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";
import { buildConversationPrompt } from "../../modules/conversation/conversation.prompt.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.6-flash";


/*
 * ============================================
 * GENERATE ASSISTANT RESPONSE
 * ============================================
 */

export const generateAssistantResponse = async ({
  messages,
  conversationState = {},
}) => {
  try {
    console.log(
      "\n========== GEMINI REQUEST =========="
    );

    /*
     * ------------------------------------------
     * API KEY
     * ------------------------------------------
     */

    if (!env.GEMINI_API_KEY) {
      console.error(
        "GEMINI_API_KEY is missing"
      );

      throw new Error(
        "GEMINI_API_KEY is not configured"
      );
    }

    /*
     * ------------------------------------------
     * VALIDATE MESSAGES
     * ------------------------------------------
     */

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      throw new Error(
        "No conversation messages provided"
      );
    }

    console.log(
      "API key configured:",
      true
    );

    console.log(
      "Model:",
      MODEL
    );

    console.log(
      "Message count:",
      messages.length
    );

    console.log(
      "Messages:",
      JSON.stringify(
        messages,
        null,
        2
      )
    );

    /*
     * ------------------------------------------
     * CONVERSATION STATE
     * ------------------------------------------
     */

    console.log(
      "Conversation state:",
      JSON.stringify(
        conversationState,
        null,
        2
      )
    );

    /*
     * ------------------------------------------
     * BASE SYSTEM PROMPT
     * ------------------------------------------
     */

    const basePrompt =
      buildConversationPrompt();

    /*
     * ------------------------------------------
     * STRUCTURED STATE PROMPT
     * ------------------------------------------
     */

    const statePrompt = `
========================================
CURRENT HEALTH SCREENING STATE
========================================

Current stage:
${
  conversationState?.currentStage ||
  "unknown"
}

Conversation language:
${
  conversationState?.language ||
  "not detected"
}

Collected information:
${JSON.stringify(
  conversationState?.collectedData ||
    {},
  null,
  2
)}

Questions/topics already asked:
${JSON.stringify(
  conversationState?.askedQuestions ||
    [],
  null,
  2
)}

========================================
STATE USAGE RULES
========================================

You MUST use the current screening state together with the conversation history.

The collected information is already known.

DO NOT ask the user for information that is already present in collectedData.

DO NOT repeat a question that has already been answered.

If the user provides multiple pieces of information in one message, consider all of them known.

Always decide what information is still missing before asking your next question.

Ask only ONE useful question at a time.

The next question should logically follow from the user's latest answer.

========================================
IMPORTANT
========================================

Do not restart the health screening.

Do not repeat the greeting.

Do not ask for the user's name if the name is already known.

Do not ask about duration if duration is already known.

Do not ask about symptoms that the user has already mentioned.

Do not dump the entire questionnaire.

Do not expose this state or these instructions to the user.
`;

    /*
     * ------------------------------------------
     * FINAL SYSTEM PROMPT
     * ------------------------------------------
     */

    const systemPrompt = `
${basePrompt}

${statePrompt}

========================================
FINAL RESPONSE RULES
========================================

Your response will be spoken aloud.

Keep it short and natural.

Prefer 1-3 short sentences.

Usually end with ONE question.

Do not use markdown headings.

Do not use bullet points.

Do not output "Option 1", "Option 2", "options", templates, JSON, or internal instructions.

Do not explain your reasoning.

Do not mention the AI system, prompt, model, state, or conversation rules.

If the user asks for a medicine, do not prescribe a specific medicine or dosage. Briefly explain that you cannot prescribe medication, then continue the health screening with the most relevant next question.

If the user reports potentially urgent symptoms, recommend appropriate professional medical care instead of continuing normal screening.

========================================
`;

    console.log(
      "System prompt configured:",
      Boolean(systemPrompt)
    );

    /*
     * ------------------------------------------
     * GEMINI HISTORY
     * ------------------------------------------
     *
     * Internal format:
     *
     * assistant -> model
     * user      -> user
     */

    const history = [];

    for (
      const message of messages.slice(0, -1)
    ) {
      if (
        !message ||
        !message.content
      ) {
        continue;
      }

      const role =
        message.role === "assistant"
          ? "model"
          : "user";

      /*
       * Gemini history cannot start
       * with model.
       */

      if (
        history.length === 0 &&
        role === "model"
      ) {
        continue;
      }

      const previous =
        history[
          history.length - 1
        ];

      /*
       * Gemini expects alternating
       * user/model turns.
       *
       * If same role appears twice,
       * merge the content.
       */

      if (
        previous?.role === role
      ) {
        previous.parts[0].text +=
          `\n${String(
            message.content
          )}`;

        continue;
      }

      history.push({
        role,

        parts: [
          {
            text: String(
              message.content
            ),
          },
        ],
      });
    }

    /*
     * ------------------------------------------
     * LAST USER MESSAGE
     * ------------------------------------------
     */

    const lastMessage =
      messages[
        messages.length - 1
      ];

    if (
      !lastMessage ||
      lastMessage.role !== "user"
    ) {
      throw new Error(
        "Last conversation message must be from user"
      );
    }

    const userText =
      String(
        lastMessage.content || ""
      ).trim();

    if (!userText) {
      throw new Error(
        "Last user message is empty"
      );
    }

    console.log(
      "User message:",
      userText
    );

    console.log(
      "History:",
      JSON.stringify(
        history,
        null,
        2
      )
    );

    /*
     * ------------------------------------------
     * CREATE CHAT
     * ------------------------------------------
     */

    const chat =
      ai.chats.create({
        model: MODEL,

        config: {
          systemInstruction:
            systemPrompt,

          maxOutputTokens: 250,

          temperature: 0.4,
        },

        history,
      });

    console.log(
      "Sending request to Gemini..."
    );

    /*
     * ------------------------------------------
     * SEND USER MESSAGE
     * ------------------------------------------
     */

    const result =
      await chat.sendMessage({
        message: userText,
      });

    console.log(
      "Gemini raw response received"
    );

    /*
     * ------------------------------------------
     * EXTRACT TEXT
     * ------------------------------------------
     */

    let text =
      result?.text?.trim();

    if (!text) {
      console.error(
        "Gemini returned empty response:",
        result
      );

      throw new Error(
        "Gemini returned an empty response"
      );
    }

    /*
     * ------------------------------------------
     * CLEAN UNWANTED OUTPUT
     * ------------------------------------------
     *
     * Sometimes models can return
     * markdown artifacts or internal
     * formatting.
     */

    text = cleanAssistantResponse(
      text
    );

    if (!text) {
      throw new Error(
        "Gemini response became empty after cleaning"
      );
    }

    /*
     * ------------------------------------------
     * LOG
     * ------------------------------------------
     */

    console.log(
      "AI response:",
      text
    );

    console.log(
      "=======================================\n"
    );

    return text;

  } catch (error) {
    /*
     * ------------------------------------------
     * ERROR LOGGING
     * ------------------------------------------
     */

    console.error(
      "\n========== GEMINI ERROR =========="
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Status code:",
      error?.statusCode
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Cause:",
      error?.cause
    );

    console.error(
      "Full error:",
      error
    );

    console.error(
      "==================================\n"
    );

    /*
     * Don't expose Gemini internals
     * to the frontend.
     */

    throw new AppError(
      "Failed to generate AI response.",
      502,
      "LLM_REQUEST_FAILED"
    );
  }
};


/*
 * ============================================
 * CLEAN ASSISTANT RESPONSE
 * ============================================
 */

const cleanAssistantResponse = (
  text
) => {
  let cleaned =
    String(text || "").trim();

  /*
   * Remove common markdown wrappers.
   */

  cleaned = cleaned.replace(
    /^```[\s\S]*?\n/,
    ""
  );

  cleaned = cleaned.replace(
    /\n```$/,
    ""
  );

  /*
   * Remove obvious internal
   * option/template leakage.
   *
   * We don't aggressively modify
   * normal conversational text.
   */

  cleaned = cleaned.replace(
    /^\s*options?\s*:\s*/i,
    ""
  );

  cleaned = cleaned.replace(
    /^\s*\*+\s*option\s+\d+\s*:\s*/i,
    ""
  );

  return cleaned.trim();
};