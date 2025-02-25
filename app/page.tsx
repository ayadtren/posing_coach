'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dumbbell, LineChart, Settings } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Perfect Your Physique Posing with <span className="text-primary">PosePrep Pro</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl">
              The ultimate companion for bodybuilders and physique athletes looking to master their competition poses and showcase their physique at its best.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/ai-coach">Try AI Coach</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Posing Coach</h3>
              <p className="text-muted-foreground">
                Get real-time feedback on your posing technique with our AI-powered coach that analyzes your form and provides personalized guidance.
              </p>
              <Button asChild variant="link" className="mt-4 p-0">
                <Link href="/ai-coach">Try AI Coach →</Link>
              </Button>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your improvement over time with detailed metrics and visualizations to see how your posing technique evolves.
              </p>
              <Button asChild variant="link" className="mt-4 p-0">
                <Link href="/progress">View Progress →</Link>
              </Button>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable Settings</h3>
              <p className="text-muted-foreground">
                Personalize your experience with customizable settings for notifications, appearance, and competition preferences.
              </p>
              <Button asChild variant="link" className="mt-4 p-0">
                <Link href="/settings">Customize →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Coach Highlight Section */}
      <section className="py-20 px-6 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">AI-Powered Posing Coach</h2>
              <p className="text-muted-foreground mb-4">
                Our revolutionary AI coach uses computer vision technology to analyze your posing in real-time, providing instant feedback on:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Body alignment and posture</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Symmetry between left and right sides</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Muscle engagement and presentation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Pose-specific technique improvements</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/ai-coach">Try AI Coach Now</Link>
              </Button>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md">
              <div className="aspect-video bg-black rounded-md flex items-center justify-center text-white">
                {/* This would be a video or image in production */}
                <div className="text-center p-8">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">AI Coach Demo</p>
                  <p className="text-sm opacity-70 mt-2">Video preview would appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-background border-t">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="font-bold text-xl">PosePrep Pro</h3>
              <p className="text-muted-foreground mt-2">Perfect your posing, showcase your best</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/ai-coach" className="text-muted-foreground hover:text-foreground">
                AI Coach
              </Link>
              <Link href="/progress" className="text-muted-foreground hover:text-foreground">
                Progress
              </Link>
              <Link href="/settings" className="text-muted-foreground hover:text-foreground">
                Settings
              </Link>
            </div>
          </div>
          <div className="mt-12 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} PosePrep Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
} 