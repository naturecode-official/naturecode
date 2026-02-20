// Long Output Manager for NatureCode
// This system encourages AI to provide detailed, comprehensive responses

/**
 * Enhanced prompt engineering for longer, more detailed AI responses
 */
export class LongOutputManager {
  constructor() {
    this.enhancementStrategies = {
      code: this._enhanceCodePrompt.bind(this),
      explanation: this._enhanceExplanationPrompt.bind(this),
      analysis: this._enhanceAnalysisPrompt.bind(this),
      creative: this._enhanceCreativePrompt.bind(this),
      general: this._enhanceGeneralPrompt.bind(this),
    };
  }

  /**
   * Enhance a user prompt to encourage longer, more detailed responses
   * @param {string} userPrompt - Original user prompt
   * @param {string} context - Optional context about the conversation
   * @returns {string} Enhanced prompt
   */
  enhancePrompt(userPrompt, context = "") {
    // Analyze the prompt type
    const promptType = this._analyzePromptType(userPrompt, context);

    // Get the appropriate enhancement strategy
    const enhancer =
      this.enhancementStrategies[promptType] ||
      this.enhancementStrategies.general;

    // Apply enhancement
    return enhancer(userPrompt, context);
  }

  /**
   * Analyze the type of prompt to apply appropriate enhancement
   */
  _analyzePromptType(prompt, context) {
    const lowerPrompt = prompt.toLowerCase();
    const lowerContext = context.toLowerCase();

    // Check for code-related prompts
    if (
      lowerPrompt.includes("code") ||
      lowerPrompt.includes("program") ||
      lowerPrompt.includes("function") ||
      lowerPrompt.includes("class") ||
      lowerPrompt.includes("algorithm") ||
      lowerPrompt.includes("script") ||
      lowerContext.includes("code") ||
      lowerContext.includes("programming")
    ) {
      return "code";
    }

    // Check for explanation requests
    if (
      lowerPrompt.includes("explain") ||
      lowerPrompt.includes("how does") ||
      lowerPrompt.includes("what is") ||
      lowerPrompt.includes("why") ||
      lowerPrompt.includes("describe") ||
      lowerPrompt.includes("tell me about")
    ) {
      return "explanation";
    }

    // Check for analysis requests
    if (
      lowerPrompt.includes("analyze") ||
      lowerPrompt.includes("analysis") ||
      lowerPrompt.includes("review") ||
      lowerPrompt.includes("evaluate") ||
      lowerPrompt.includes("compare") ||
      lowerPrompt.includes("critique")
    ) {
      return "analysis";
    }

    // Check for creative requests
    if (
      lowerPrompt.includes("write a") ||
      lowerPrompt.includes("create") ||
      lowerPrompt.includes("story") ||
      lowerPrompt.includes("poem") ||
      lowerPrompt.includes("essay") ||
      lowerPrompt.includes("article")
    ) {
      return "creative";
    }

    // Default to general
    return "general";
  }

  /**
   * Enhance code-related prompts
   */
  _enhanceCodePrompt(prompt, context) {
    return `${prompt}

IMPORTANT: Please provide a COMPLETE and DETAILED response with:
1. Full implementation with proper error handling
2. Clear comments explaining key parts
3. Usage examples showing how to use the code
4. Edge cases and considerations
5. Performance optimizations if applicable
6. Alternative approaches if relevant

Please write comprehensive code with thorough explanations. Don't hesitate to provide complete implementations.`;
  }

  /**
   * Enhance explanation prompts
   */
  _enhanceExplanationPrompt(prompt, context) {
    return `${prompt}

IMPORTANT: Please provide a THOROUGH and COMPREHENSIVE explanation with:
1. Clear definitions of key concepts
2. Step-by-step breakdown of the topic
3. Practical examples and use cases
4. Historical context or background if relevant
5. Common misconceptions or pitfalls
6. Further resources or reading suggestions

Please provide a detailed, in-depth explanation. Cover all important aspects thoroughly.`;
  }

  /**
   * Enhance analysis prompts
   */
  _enhanceAnalysisPrompt(prompt, context) {
    return `${prompt}

IMPORTANT: Please provide a DETAILED and INSIGHTFUL analysis with:
1. Multiple perspectives on the topic
2. Data-driven insights if applicable
3. Pros and cons analysis
4. Comparative analysis with alternatives
5. Future implications or trends
6. Actionable recommendations

Please conduct a comprehensive analysis. Don't shy away from providing deep insights.`;
  }

  /**
   * Enhance creative prompts
   */
  _enhanceCreativePrompt(prompt, context) {
    return `${prompt}

IMPORTANT: Please provide a RICH and ENGAGING creative work with:
1. Vivid descriptions and imagery
2. Well-developed characters or concepts
3. Engaging narrative or structure
4. Emotional depth and resonance
5. Unique perspectives or twists
6. Polished, publication-ready quality

Please create a complete, well-developed piece. Take the time to craft something substantial.`;
  }

  /**
   * Enhance general prompts
   */
  _enhanceGeneralPrompt(prompt, context) {
    return `${prompt}

IMPORTANT: Please provide a COMPREHENSIVE and DETAILED response. 
Cover all relevant aspects thoroughly, include examples where helpful, 
and don't hesitate to provide complete information. 

Please take the space needed to give a complete answer.`;
  }

  /**
   * Check if a response is sufficiently detailed
   */
  isResponseDetailed(response, minLength = 500) {
    return response.length >= minLength;
  }

  /**
   * Get suggestions for more detailed responses
   */
  getDetailSuggestions(promptType) {
    const suggestions = {
      code: [
        "Add more error handling examples",
        "Include performance considerations",
        "Provide alternative implementations",
        "Add comprehensive documentation",
        "Include testing examples",
      ],
      explanation: [
        "Add more real-world examples",
        "Include historical context",
        "Compare with related concepts",
        "Add visual descriptions if helpful",
        "Include common pitfalls to avoid",
      ],
      analysis: [
        "Add quantitative data if available",
        "Include stakeholder perspectives",
        "Provide implementation roadmap",
        "Add risk assessment",
        "Include success metrics",
      ],
      creative: [
        "Add more sensory details",
        "Develop character backstories",
        "Include thematic elements",
        "Add symbolic references",
        "Provide alternative endings",
      ],
      general: [
        "Provide more specific examples",
        "Include step-by-step instructions",
        "Add relevant statistics or data",
        "Include practical applications",
        "Provide additional resources",
      ],
    };

    return suggestions[promptType] || suggestions.general;
  }
}

/**
 * Create a long output manager instance
 */
export function createLongOutputManager() {
  return new LongOutputManager();
}
