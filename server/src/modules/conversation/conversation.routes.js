import { Router } from "express";

import {
  startConversation,
  finishConversation,
} from "./conversation.controller.js";

const router = Router();

router.post("/start", startConversation);

router.post("/:sessionId/end", finishConversation);

export default router;