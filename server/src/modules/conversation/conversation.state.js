const sessions = new Map();

const createEmptyCollectedData = () => ({
  name: null,
  mainConcern: null,
  symptoms: [],
  duration: null,
  severity: null,
  relatedSymptoms: [],
});

export const createConversationState = (sessionId) => {
  const now = new Date();

  const state = {
    sessionId,

    status: "active",

    language: null,

    messages: [],

    collectedData: createEmptyCollectedData(),

    askedQuestions: [],

    currentStage: "name",

    createdAt: now,

    updatedAt: now,
  };

  sessions.set(sessionId, state);

  return state;
};

export const getConversationState = (sessionId) => {
  return sessions.get(sessionId) || null;
};

export const updateConversationState = (
  sessionId,
  updates
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  Object.assign(state, updates);

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * UPDATE COLLECTED DATA
 * ============================================
 */

export const updateCollectedData = (
  sessionId,
  updates
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  state.collectedData = {
    ...state.collectedData,
    ...updates,
  };

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * ADD ARRAY VALUE WITHOUT DUPLICATES
 * ============================================
 */

export const addRelatedSymptom = (
  sessionId,
  symptom
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  if (!symptom?.trim()) {
    return state;
  }

  const normalized =
    symptom.trim();

  const exists =
    state.collectedData.relatedSymptoms.some(
      (item) =>
        item.toLowerCase() ===
        normalized.toLowerCase()
    );

  if (!exists) {
    state.collectedData.relatedSymptoms.push(
      normalized
    );
  }

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * ADD MESSAGE
 * ============================================
 */

export const addMessage = (
  sessionId,
  message
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  state.messages.push({
    ...message,
    timestamp: new Date(),
  });

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * MARK QUESTION AS ASKED
 * ============================================
 */

export const markQuestionAsked = (
  sessionId,
  question
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  if (!question?.trim()) {
    return state;
  }

  const normalized =
    question.trim();

  const exists =
    state.askedQuestions.some(
      (item) =>
        item.toLowerCase() ===
        normalized.toLowerCase()
    );

  if (!exists) {
    state.askedQuestions.push(
      normalized
    );
  }

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * CURRENT STAGE
 * ============================================
 */

export const setCurrentStage = (
  sessionId,
  stage
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  state.currentStage = stage;

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * LANGUAGE
 * ============================================
 */

export const setConversationLanguage = (
  sessionId,
  language
) => {
  const state = sessions.get(sessionId);

  if (!state) {
    return null;
  }

  state.language =
    language || null;

  state.updatedAt = new Date();

  return state;
};

/*
 * ============================================
 * DELETE
 * ============================================
 */

export const deleteConversationState = (
  sessionId
) => {
  return sessions.delete(sessionId);
};

/*
 * ============================================
 * ALL SESSIONS
 * ============================================
 */

export const getAllSessions = () => {
  return sessions;
};