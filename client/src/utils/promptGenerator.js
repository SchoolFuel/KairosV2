const FOCUS_MODES = {
  Explain: {
    instruction: 'Your primary role is to provide clear, comprehensive explanations. Break down complex topics into understandable parts, use examples, and adapt your explanations to the user\'s level.',
    prefix: 'explain'
  },
  Brainstorm: {
    instruction: 'Your primary role is to facilitate creative thinking and idea generation. Help the user explore different perspectives, ask thought-provoking questions, and encourage innovative solutions.',
    prefix: 'brainstorm'
  },
  Plan: {
    instruction: 'Your primary role is to help organize and structure learning or projects. Create step-by-step approaches, suggest timelines, and help break down larger goals into manageable tasks.',
    prefix: 'plan'
  },
  Practice: {
    instruction: 'Your primary role is to provide practice opportunities and feedback. Create exercises, ask questions to test understanding, and guide the user through hands-on learning experiences.',
    prefix: 'practice'
  }
};

/**
 * Generates the initial AI prompt with focus and context information
 * @param {string} focus - The selected focus mode ('Explain', 'Brainstorm', 'Plan', 'Practice')
 * @param {Object} context - Context object containing course, grade, reading level, etc.
 * @param {string} firstUserMessage - The user's first message
 * @returns {string} - Complete prompt string for AI
 */
export function generateInitialPrompt(focus, context, firstUserMessage) {
  const focusConfig = FOCUS_MODES[focus] || FOCUS_MODES.Explain;
  
  let prompt = `You are an AI tutor assistant in "${focus}" mode. ${focusConfig.instruction}`;

  // Build context information
  const contextParts = buildContextParts(context);
  
  if (contextParts.length > 0) {
    prompt += `\n\nContext Information:\n${contextParts.join('\n')}`;
    prompt += buildContextInstructions(context);
  }

  // Add pasted content if available
  if (context.pastedContent?.trim()) {
    prompt += `\n\nRelevant Content/Materials:\n${context.pastedContent.trim()}`;
    prompt += `\n\nUse this content as reference material when appropriate for answering questions or providing examples.`;
  }

  // Add the user's first message
  prompt += `\n\nUser's Question/Request: ${firstUserMessage}`;

  // Add final instruction
  prompt += `\n\nRespond as a helpful tutor, keeping your focus mode and the provided context in mind. Be encouraging, clear, and educational in your approach.`;

  return prompt;
}

// /**
//  * Generates a more concise version of the initial prompt
//  * @param {string} focus - The selected focus mode
//  * @param {Object} context - Context object
//  * @param {string} firstUserMessage - The user's first message
//  * @returns {string} - Concise prompt string
//  */
// export function generateConcisePrompt(focus, context, firstUserMessage) {
//   const parts = [`Focus: ${focus}`, firstUserMessage];
  
//   if (context.course) parts.unshift(`Course: ${context.course}`);
//   if (context.grade) parts.unshift(`Grade: ${context.grade}`);
//   if (context.readingLevel) parts.unshift(`Reading Level: ${context.readingLevel}`);
//   if (context.standards?.length) parts.unshift(`Standards: ${context.standards.join(', ')}`);
//   if (context.pastedContent?.trim()) {
//     const truncatedContent = context.pastedContent.trim().substring(0, 100) + '...';
//     parts.push(`Reference: ${truncatedContent}`);
//   }
  
//   return parts.join(' | ');
// }

/**
 * Helper function to build context parts array
 * @private
 */
function buildContextParts(context) {
  const parts = [];
  
  if (context.course) parts.push(`Course: ${context.course}`);
  if (context.grade) parts.push(`Grade Level: ${context.grade}`);
  if (context.readingLevel) parts.push(`Reading Level: ${context.readingLevel} grade level`);
  if (context.standards?.length > 0) parts.push(`Academic Standards: ${context.standards.join(', ')}`);
  
  return parts;
}

/**
 * Helper function to build context-specific instructions
 * @private
 */
function buildContextInstructions(context) {
  let instructions = '';
  
  if (context.readingLevel) {
    instructions += `\n\nPlease adjust your language complexity and explanations to be appropriate for a ${context.readingLevel} grade reading level.`;
  }
  
  if (context.standards?.length > 0) {
    instructions += `\n\nAlign your responses with the mentioned academic standards where relevant.`;
  }
  
  return instructions;
}

/**
 * Validates that the context object has the expected structure
 * @param {Object} context - Context object to validate
 * @returns {boolean} - Whether the context is valid
 */
export function validateContext(context) {
  if (!context || typeof context !== 'object') return false;
  
  // Check that standards is an array if it exists
  if (context.standards && !Array.isArray(context.standards)) return false;
  
  return true;
}

/**
 * Gets available focus modes
 * @returns {string[]} - Array of available focus mode names
 */
export function getFocusModes() {
  return Object.keys(FOCUS_MODES);
}

// Default export for convenience
export default {
  generateInitialPrompt,
  generateConcisePrompt,
  validateContext,
  getFocusModes,
  FOCUS_MODES
};