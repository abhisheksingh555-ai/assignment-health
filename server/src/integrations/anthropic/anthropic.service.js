import Anthropic from "@anthropic-ai/sdk";

import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";
import { buildConversationPrompt } from "../../modules/conversation/conversation.prompt.js";

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const generateAssistantResponse = async ({
  messages,
}) => {
  try {
    console.log("\n========== ANTHROPIC REQUEST ==========");

    console.log(
      "API key configured:",
      Boolean(env.ANTHROPIC_API_KEY)
    );

    console.log(
      "Message count:",
      messages.length
    );

    console.log(
      "Messages:",
      JSON.stringify(messages, null, 2)
    );

    const response =
      await anthropic.messages.create({
        // Keep your current model for this test.
        // If Anthropic rejects it, the real error
        // will now be printed below.
        model: "claude-3-5-sonnet-latest",

        max_tokens: 300,

        system:
          buildConversationPrompt(),

        messages: messages.map(
          (message) => ({
            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content: String(
              message.content
            ),
          })
        ),
      });

    console.log(
      "Anthropic response received"
    );

    console.log(
      "Stop reason:",
      response.stop_reason
    );

    const text = response.content
      ?.filter(
        (item) =>
          item.type === "text"
      )
      .map(
        (item) => item.text
      )
      .join(" ")
      .trim();

    if (!text) {
      throw new Error(
        "Anthropic returned an empty response."
      );
    }

    console.log(
      "AI response:",
      text
    );

    console.log(
      "=======================================\n"
    );

    return text;
  } catch (error) {
    console.error(
      "\n========== ANTHROPIC ERROR =========="
    );

    console.error(
      "Error name:",
      error?.name
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Type:",
      error?.error?.type
    );

    console.error(
      "API error:",
      error?.error
    );

    console.error(
      "Full error:",
      error
    );

    console.error(
      "======================================\n"
    );

    throw new AppError(
      "Failed to generate AI response.",
      502,
      "LLM_REQUEST_FAILED"
    );
  }
};