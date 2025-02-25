'use client';

import React from 'react';
import { CoachView } from '@/components/ai-coach/CoachView';

export default function AICoachPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Posing Coach</h1>
        <p className="text-muted-foreground">
          Get real-time feedback on your posing technique with our AI-powered coach. Perfect your poses for your next competition.
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <h2 className="text-lg font-medium mb-2">Browser Compatibility</h2>
        <p className="text-sm">
          For the best experience, we recommend using the latest versions of:
        </p>
        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
          <li>Google Chrome</li>
          <li>Microsoft Edge</li>
          <li>Safari (15 or newer)</li>
          <li>Firefox (90 or newer)</li>
        </ul>
        <p className="text-sm mt-2">
          If you encounter any issues, try refreshing the page or switching to a different browser. 
          The AI coach requires WebGL support, which is available in all modern browsers.
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
        <h2 className="text-lg font-medium mb-2">How It Works</h2>
        <p className="text-sm">
          1. Upload a photo of your physique (optional) to get personalized pose overlays
        </p>
        <p className="text-sm">
          2. Allow camera access when prompted
        </p>
        <p className="text-sm">
          3. Select your pose type and competition category
        </p>
        <p className="text-sm">
          4. Click "Start Coaching" to begin receiving real-time feedback
        </p>
        <p className="text-sm mt-2">
          All processing happens locally in your browser - your video is never sent to any server.
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
        <h2 className="text-lg font-medium mb-2">NEW: Expert AI Voice Coaching</h2>
        <p className="text-sm">
          Our AI coach now features expert voice feedback powered by advanced language models!
        </p>
        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
          <li>Receive personalized posing tips from an AI coach trained on professional bodybuilding techniques</li>
          <li>Get specific, actionable feedback based on your current pose and competition category</li>
          <li>The AI coach adapts its feedback based on your performance and improvement areas</li>
          <li>Toggle between standard feedback and AI-powered expert coaching in the settings</li>
          <li><span className="font-medium">NEW:</span> Adjust feedback frequency to control how often you receive coaching tips</li>
          <li><span className="font-medium">IMPROVED:</span> Dynamic feedback system prevents repetitive instructions</li>
        </ul>
        <p className="text-sm mt-2 font-medium">
          Note: The AI coach requires an internet connection to generate expert feedback. If unavailable, it will fall back to standard feedback.
        </p>
      </div>

      <CoachView />
    </div>
  );
} 