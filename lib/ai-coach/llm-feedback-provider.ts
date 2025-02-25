/**
 * LLM Feedback Provider for the AI coach
 * Connects to a free LLM API to generate expert bodybuilding posing feedback
 */

import { PoseFeedback, PoseType, CompetitionCategory, MuscleGroupFeedback } from './pose-analyzer';

// Define the interface for the LLM response
interface LLMResponse {
  text: string;
  error?: string;
}

// Track feedback history to avoid repetition
interface FeedbackHistoryItem {
  timestamp: number;
  poseType: PoseType;
  category: CompetitionCategory;
  score: number;
  feedback: string;
}

export class LLMFeedbackProvider {
  private apiEndpoint: string;
  private fallbackApiEndpoint: string;
  private mockApiEndpoint: string;
  private isInitialized: boolean = false;
  private cachedResponses: Map<string, string> = new Map();
  private lastFeedbackTime: number = 0;
  private feedbackCooldown: number = 5000; // 5 seconds cooldown between feedback requests
  private feedbackHistory: FeedbackHistoryItem[] = [];
  private sessionId: string;
  private feedbackCounter: number = 0;
  private coachingStyles: string[] = [
    "motivational",
    "technical",
    "direct",
    "analytical",
    "supportive"
  ];
  private useFallbackMode: boolean = false;
  
  // Expert prompt template for bodybuilding posing coach
  private promptTemplate = `You are an expert bodybuilding posing coach with decades of experience preparing competitors for shows. 
You've trained champions in Men's Physique, Classic Physique, and Open Bodybuilding divisions.
You've studied the techniques of legendary posers like Kai Greene, Frank Zane, Lee Haney, Arnold Schwarzenegger, Chris Bumstead, and Breon Ansley.

Your expertise includes:
- Perfect biomechanics for each mandatory pose
- Subtle adjustments that highlight strengths and minimize weaknesses
- Mental cues that help athletes maintain proper form
- Competition presentation strategies
- Energy management during prejudging and finals

Provide specific, actionable feedback for a competitor practicing the {poseType} pose in the {category} division.

Current feedback metrics:
- Overall Score: {score}/100
- Alignment Score: {alignmentScore}/100
- Symmetry Score: {symmetryScore}/100
- Muscle Engagement Score: {muscleEngagementScore}/100

Muscle groups that need the most improvement:
{muscleGroupFeedback}

Areas needing improvement:
{improvementTips}

This is feedback #{feedbackCounter} in this session. Use a {coachingStyle} coaching style.

IMPORTANT: NEVER REPEAT PREVIOUS FEEDBACK. Previous feedback given in this session:
{previousFeedback}

Keep your response concise (under 100 words), direct, and focused on the most critical 1-2 muscle groups that need improvement right now. For each muscle group, provide specific instructions on:
1. Exact positioning (e.g., "raise your elbows to shoulder height")
2. Contraction technique (e.g., "twist your wrists outward while flexing biceps")
3. Mental cues (e.g., "imagine pulling your elbows through water")

Use the language and terminology that professional coaches use at competitions.

For each score range, focus on different aspects:
- Below 50: Focus on fundamental positioning and major corrections
- 50-75: Focus on refinement and muscle engagement
- 75-90: Focus on subtle details and presentation
- Above 90: Focus on competition-ready polish and mental preparation

Vary your language and phrasing to avoid repetition. Use specific bodybuilding terminology.`;

  constructor(apiEndpoint: string = 'https://free-llm-api.onrender.com/api/generate') {
    // Use our local proxy server instead of directly calling external APIs
    const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const proxyBaseUrl = isLocalDev ? 'http://localhost:3334' : 'https://api.poseprep.com';
    
    this.apiEndpoint = `${proxyBaseUrl}/api/llm/primary`;
    this.fallbackApiEndpoint = `${proxyBaseUrl}/api/llm/fallback`;
    this.mockApiEndpoint = `${proxyBaseUrl}/api/llm/mock`;
    
    // Generate a unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Initialize the LLM provider
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection to the API
      const testResponse = await this.callLLM("Hello");
      
      // If we got an error but it's not a critical one, we can still operate in fallback mode
      if (testResponse.error) {
        console.warn("LLM provider initialized in fallback mode due to API connectivity issues");
        this.useFallbackMode = true;
        this.isInitialized = true;
        return true;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize LLM provider:", error);
      // Even if initialization fails, we can still operate in fallback mode
      this.useFallbackMode = true;
      this.isInitialized = true;
      return true;
    }
  }
  
  /**
   * Reset the session to start fresh
   */
  resetSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.feedbackHistory = [];
    this.feedbackCounter = 0;
    this.cachedResponses.clear();
  }
  
  /**
   * Generate expert feedback based on pose analysis
   */
  async generateFeedback(
    feedback: PoseFeedback, 
    poseType: PoseType, 
    category: CompetitionCategory
  ): Promise<string> {
    // Check if we should throttle requests
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.feedbackCooldown) {
      // Return a slightly modified version of the last feedback if we're in cooldown period
      const cacheKey = `${poseType}-${category}-${Math.round(feedback.score/10)}`;
      if (this.cachedResponses.has(cacheKey)) {
        const lastFeedback = this.cachedResponses.get(cacheKey)!;
        // Don't return exactly the same feedback
        if (this.feedbackHistory.length > 0) {
          const previousFeedbacks = this.feedbackHistory.map(item => item.feedback);
          if (previousFeedbacks.includes(lastFeedback)) {
            // Return a modified version of the fallback feedback instead
            return this.getFallbackFeedback(feedback, poseType, true);
          }
        }
        return lastFeedback;
      }
    }
    
    // If we're in fallback mode, skip the API call and use our built-in feedback
    if (this.useFallbackMode) {
      return this.getFallbackFeedback(feedback, poseType, true);
    }
    
    // Increment feedback counter for this session
    this.feedbackCounter++;
    
    // Format the pose type and category to be more readable
    const formattedPoseType = poseType.replace(/_/g, ' ').toLowerCase();
    const formattedCategory = category.replace(/_/g, ' ').toLowerCase();
    
    // Get previous feedback for context
    const previousFeedbackText = this.getPreviousFeedbackText();
    
    // Select a random coaching style
    const coachingStyle = this.coachingStyles[Math.floor(Math.random() * this.coachingStyles.length)];
    
    // Format muscle group feedback
    const muscleGroupFeedback = this.formatMuscleGroupFeedback(feedback.muscleGroups);
    
    // Create a prompt with the feedback data
    const prompt = this.promptTemplate
      .replace('{poseType}', formattedPoseType)
      .replace('{category}', formattedCategory)
      .replace('{score}', feedback.score.toString())
      .replace('{alignmentScore}', feedback.alignmentScore.toString())
      .replace('{symmetryScore}', feedback.symmetryScore.toString())
      .replace('{muscleEngagementScore}', feedback.muscleEngagementScore.toString())
      .replace('{muscleGroupFeedback}', muscleGroupFeedback)
      .replace('{improvementTips}', feedback.improvementTips)
      .replace('{feedbackCounter}', this.feedbackCounter.toString())
      .replace('{coachingStyle}', coachingStyle)
      .replace('{previousFeedback}', previousFeedbackText);
    
    try {
      // Call the LLM API
      const response = await this.callLLM(prompt);
      
      if (response.error) {
        console.warn("LLM API error, using fallback feedback:", response.error);
        return this.getFallbackFeedback(feedback, poseType);
      }
      
      // Update the last feedback time
      this.lastFeedbackTime = Date.now();
      
      // Store the feedback in history
      this.feedbackHistory.push({
        timestamp: now,
        poseType,
        category,
        score: feedback.score,
        feedback: response.text
      });
      
      // Limit history size to prevent prompt from getting too large
      if (this.feedbackHistory.length > 5) {
        this.feedbackHistory.shift(); // Remove oldest feedback
      }
      
      // Cache the response
      const cacheKey = `${poseType}-${category}-${Math.round(feedback.score/10)}`;
      this.cachedResponses.set(cacheKey, response.text);
      
      return response.text;
    } catch (error) {
      console.error("Error generating LLM feedback:", error);
      // Switch to fallback mode for future requests
      this.useFallbackMode = true;
      return this.getFallbackFeedback(feedback, poseType);
    }
  }
  
  /**
   * Get previous feedback text for context
   */
  private getPreviousFeedbackText(): string {
    if (this.feedbackHistory.length === 0) {
      return "None yet.";
    }
    
    return this.feedbackHistory
      .map((item, index) => {
        const poseType = item.poseType.replace(/_/g, ' ').toLowerCase();
        return `${index + 1}. [${poseType}, score: ${item.score}]: "${item.feedback}"`;
      })
      .join('\n');
  }
  
  /**
   * Call the LLM API
   */
  private async callLLM(prompt: string): Promise<LLMResponse> {
    try {
      // First try the primary API endpoint with CORS handling
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.8,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { text: data.generated_text || data.text || "" };
      } catch (error) {
        console.warn("Primary LLM API failed, trying fallback:", error);
        // If primary API fails with CORS or other error, try fallback
        return await this.callFallbackLLM(prompt);
      }
    } catch (error) {
      console.error("Error calling LLM API:", error);
      // If all API calls fail, return an error
      return { text: "", error: "Failed to call LLM API" };
    }
  }
  
  /**
   * Call a fallback LLM API if the primary one fails
   */
  private async callFallbackLLM(prompt: string): Promise<LLMResponse> {
    try {
      // Try a different free API as fallback
      try {
        const response = await fetch(this.fallbackApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            max_new_tokens: 150,
            temperature: 0.8,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { text: data.generated_text || data.text || "" };
      } catch (error) {
        console.warn("Fallback LLM API also failed, trying mock API:", error);
        // If both APIs fail, try our mock API
        return await this.callMockLLM(prompt);
      }
    } catch (error) {
      console.error("Error calling fallback LLM API:", error);
      // If all API calls fail, switch to fallback mode for future requests
      this.useFallbackMode = true;
      return { text: "", error: "All LLM APIs failed" };
    }
  }
  
  /**
   * Call the mock LLM API as a last resort
   */
  private async callMockLLM(prompt: string): Promise<LLMResponse> {
    try {
      const response = await fetch(this.mockApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { text: data.text || "" };
    } catch (error) {
      console.error("Error calling mock LLM API:", error);
      this.useFallbackMode = true;
      return { text: "", error: "All LLM APIs failed" };
    }
  }
  
  /**
   * Get fallback feedback if LLM API fails
   */
  private getFallbackFeedback(feedback: PoseFeedback, poseType: PoseType, forceVariation: boolean = false): string {
    // Provide varied fallback feedback based on pose type and score
    const formattedPoseType = poseType.replace(/_/g, ' ').toLowerCase();
    
    // Array of feedback templates for each score range
    const lowScoreFeedback = [
      `Your ${formattedPoseType} needs work. Focus on ${feedback.improvementTips.split('.')[0]}.`,
      `The fundamentals of your ${formattedPoseType} need attention. Start by ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `I'm seeing issues with your ${formattedPoseType}. The priority is to ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Let's rebuild your ${formattedPoseType} from the ground up. First, ${feedback.improvementTips.split('.')[0].toLowerCase()}.`
    ];
    
    const mediumScoreFeedback = [
      `Your ${formattedPoseType} is developing well. To improve, ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Good progress on your ${formattedPoseType}. Now refine it by ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Your ${formattedPoseType} shows potential. Take it to the next level by ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Solid foundation on your ${formattedPoseType}. Let's polish it by ${feedback.improvementTips.split('.')[0].toLowerCase()}.`
    ];
    
    const highScoreFeedback = [
      `Excellent ${formattedPoseType}! For perfection, ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Your ${formattedPoseType} is nearly competition-ready. Just ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Outstanding ${formattedPoseType} presentation! Fine-tune by ${feedback.improvementTips.split('.')[0].toLowerCase()}.`,
      `Your ${formattedPoseType} is impressive. For that winning edge, ${feedback.improvementTips.split('.')[0].toLowerCase()}.`
    ];
    
    // Select feedback array based on score
    let feedbackArray;
    if (feedback.score < 50) {
      feedbackArray = lowScoreFeedback;
    } else if (feedback.score < 75) {
      feedbackArray = mediumScoreFeedback;
    } else {
      feedbackArray = highScoreFeedback;
    }
    
    // Get a random index, but avoid the last used index if possible
    let randomIndex;
    if (forceVariation && this.feedbackHistory.length > 0) {
      // Try to find a feedback that hasn't been used recently
      const lastFeedbacks = this.feedbackHistory.slice(-3).map(item => item.feedback);
      let attempts = 0;
      do {
        randomIndex = Math.floor(Math.random() * feedbackArray.length);
        attempts++;
      } while (lastFeedbacks.includes(feedbackArray[randomIndex]) && attempts < 10);
    } else {
      randomIndex = Math.floor(Math.random() * feedbackArray.length);
    }
    
    // Add this feedback to history
    this.feedbackHistory.push({
      timestamp: Date.now(),
      poseType,
      category: CompetitionCategory.MENS_PHYSIQUE, // Default category for fallback
      score: feedback.score,
      feedback: feedbackArray[randomIndex]
    });
    
    // Limit history size
    if (this.feedbackHistory.length > 5) {
      this.feedbackHistory.shift();
    }
    
    return feedbackArray[randomIndex];
  }
  
  /**
   * Format muscle group feedback for the prompt
   */
  private formatMuscleGroupFeedback(muscleGroups: MuscleGroupFeedback[]): string {
    if (!muscleGroups || muscleGroups.length === 0) {
      return "No specific muscle group data available.";
    }
    
    // Sort muscle groups by score (ascending) to focus on those needing most improvement
    const sortedGroups = [...muscleGroups].sort((a, b) => a.score - b.score);
    
    // Take the 2-3 lowest scoring muscle groups
    const lowestScoring = sortedGroups.slice(0, Math.min(3, sortedGroups.length));
    
    return lowestScoring.map(group => 
      `- ${group.name.charAt(0).toUpperCase() + group.name.slice(1)} (${group.score}/100): ${group.feedback}`
    ).join('\n');
  }
  
  /**
   * Check if the provider is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
} 