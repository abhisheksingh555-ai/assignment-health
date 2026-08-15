import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3001),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  DEEPGRAM_API_KEY: z
    .string()
    .min(1, "DEEPGRAM_API_KEY is required"),

  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required"),

  ELEVENLABS_API_KEY: z
    .string()
    .min(1, "ELEVENLABS_API_KEY is required"),
  
  GEMINI_API_KEY: z
     .string()
     .min(1,"GEMINI_API_KEY is Required"),

  ELEVENLABS_VOICE_ID: z
    .string()
    .min(1, "ELEVENLABS_VOICE_ID is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(
    z.prettifyError
      ? z.prettifyError(parsedEnv.error)
      : parsedEnv.error.flatten()
  );

  process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);