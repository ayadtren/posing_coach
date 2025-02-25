/**
 * Voice feedback provider for the AI coach
 * Uses the Web Speech API for voice synthesis
 */

import { PoseFeedback, PoseType, CompetitionCategory } from './pose-analyzer';
import { LLMFeedbackProvider } from './llm-feedback-provider';

export class VoiceFeedbackProvider {
  private speechSynthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;
  private volume: number = 1.0;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private llmProvider: LLMFeedbackProvider | null = null;
  private isLLMEnabled: boolean = true;
  private lastSpokenText: string = '';
  private lastFeedbackTime: number = 0;
  private feedbackCooldown: number = 5000; // 5 seconds cooldown between feedback
  
  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Handle voices loading asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
      
      // Initialize LLM provider
      this.llmProvider = new LLMFeedbackProvider();
      this.initializeLLM();
    }
  }
  
  /**
   * Initialize the LLM provider
   */
  private async initializeLLM(): Promise<void> {
    if (this.llmProvider) {
      try {
        const success = await this.llmProvider.initialize();
        if (!success) {
          console.warn("LLM provider initialization returned false, but will continue in fallback mode");
          this.isLLMEnabled = true; // Still enable it since we have fallback mechanisms
        }
      } catch (error) {
        console.error("Failed to initialize LLM provider:", error);
        // We can still operate with fallback feedback
        this.isLLMEnabled = true;
      }
    }
  }
  
  /**
   * Load available voices and select a default
   */
  private loadVoices(): void {
    if (!this.speechSynthesis) return;
    
    this.voices = this.speechSynthesis.getVoices();
    
    // Try to find a good default voice (preferably female, English)
    this.selectedVoice = this.voices.find(voice => 
      voice.name.includes('Female') && voice.lang.includes('en')
    ) || this.voices[0];
  }
  
  /**
   * Speak the provided text
   */
  speak(text: string): void {
    if (this.isMuted || typeof window === 'undefined' || !this.speechSynthesis) return;
    
    // Avoid repeating the same text in quick succession
    if (text === this.lastSpokenText) {
      const now = Date.now();
      if (now - this.lastFeedbackTime < this.feedbackCooldown) {
        return;
      }
    }
    
    // Cancel any ongoing speech
    this.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    utterance.volume = this.volume;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    
    this.speechSynthesis.speak(utterance);
    
    // Update last spoken text and time
    this.lastSpokenText = text;
    this.lastFeedbackTime = Date.now();
  }
  
  /**
   * Generate and speak feedback using LLM
   */
  async speakWithLLM(
    feedback: PoseFeedback, 
    poseType: PoseType, 
    category: CompetitionCategory
  ): Promise<void> {
    if (this.isMuted || !this.isLLMEnabled || !this.llmProvider) {
      // Fall back to regular speak if LLM is not available
      this.speak(feedback.overallFeedback);
      return;
    }
    
    try {
      // Check cooldown
      const now = Date.now();
      if (now - this.lastFeedbackTime < this.feedbackCooldown) {
        return;
      }
      
      // Generate feedback from LLM
      const llmFeedback = await this.llmProvider.generateFeedback(feedback, poseType, category);
      
      if (llmFeedback) {
        this.speak(llmFeedback);
      } else {
        // Fall back to regular feedback if LLM returns empty
        this.speak(feedback.overallFeedback);
      }
    } catch (error) {
      console.error("Error generating LLM feedback:", error);
      // Fall back to regular feedback
      this.speak(feedback.overallFeedback);
    }
  }
  
  /**
   * Stop any ongoing speech
   */
  stop(): void {
    if (typeof window !== 'undefined' && this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
  
  /**
   * Set the voice by name or index
   */
  setVoice(voiceNameOrIndex: string | number): boolean {
    if (typeof voiceNameOrIndex === 'string') {
      const voice = this.voices.find(v => v.name === voiceNameOrIndex);
      if (voice) {
        this.selectedVoice = voice;
        return true;
      }
    } else if (typeof voiceNameOrIndex === 'number') {
      if (voiceNameOrIndex >= 0 && voiceNameOrIndex < this.voices.length) {
        this.selectedVoice = this.voices[voiceNameOrIndex];
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  /**
   * Get current voice
   */
  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }
  
  /**
   * Mute/unmute voice feedback
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }
  
  /**
   * Enable/disable LLM feedback
   */
  setLLMEnabled(enabled: boolean): void {
    this.isLLMEnabled = enabled;
  }
  
  /**
   * Reset the LLM session to avoid repetitive feedback
   */
  resetLLMSession(): void {
    if (this.llmProvider) {
      this.llmProvider.resetSession();
    }
  }
  
  /**
   * Check if LLM feedback is enabled and ready
   */
  isLLMReady(): boolean {
    return this.isLLMEnabled && this.llmProvider !== null && this.llmProvider.isReady();
  }
  
  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Set speech rate (0.1 to 10.0, 1.0 is normal)
   */
  setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }
  
  /**
   * Set pitch (0.0 to 2.0, 1.0 is normal)
   */
  setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }
} 