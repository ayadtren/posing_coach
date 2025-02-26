'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dumbbell, LineChart, Settings, Camera, Presentation } from "lucide-react";

// Create a compare icon similar to what we used in Navigation
const CompareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-primary"
  >
    <path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4"></path>
    <path d="M18 9h-3"></path>
    <path d="M18 13h-3"></path>
    <path d="M18 17h-3"></path>
    <path d="M14 3v18"></path>
    <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
  </svg>
);

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
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">DensePose Analysis</h3>
              <p className="text-muted-foreground">
                Advanced 3D body surface analysis with DensePose technology for detailed visualization of your posing form.
              </p>
              <Button asChild variant="link" className="mt-4 p-0">
                <Link href="/ai-coach/densepose">Try DensePose →</Link>
              </Button>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CompareIcon />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pose Comparison</h3>
              <p className="text-muted-foreground">
                Compare your poses with professional bodybuilders and get detailed feedback to improve your competition presentation.
              </p>
              <Button asChild variant="link" className="mt-4 p-0">
                <Link href="/ai-coach/pose-comparison">Compare Poses →</Link>
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
          </div>
        </div>
      </section>

      {/* Pose Comparison Highlight Section */}
      <section className="py-20 px-6 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Professional Pose Comparison</h2>
              <p className="text-muted-foreground mb-4">
                Take your posing to the next level by comparing your form with professional bodybuilders. Our advanced comparison tool provides:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Side-by-side visual comparison with pro bodybuilders</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Detailed scoring on symmetry, alignment, and muscle activation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Actionable feedback on specific improvements</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>References from legendary bodybuilders from different eras</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/ai-coach/pose-comparison">Try Pose Comparison</Link>
              </Button>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-md flex items-center justify-center text-white">
                <div className="text-center p-8">
                  <CompareIcon className="h-16 w-16 mx-auto mb-4 opacity-70" />
                  <p className="text-lg font-medium">Pro Pose Comparison</p>
                  <p className="text-sm opacity-70 mt-2">Compare your poses with the legends of bodybuilding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Coach Highlight Section */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-card rounded-lg p-4 shadow-md order-last md:order-first">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-md flex items-center justify-center text-white">
                <div className="text-center p-8">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">DensePose Analysis</p>
                  <p className="text-sm opacity-70 mt-2">Advanced 3D body surface visualization</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">AI-Powered DensePose Analysis</h2>
              <p className="text-muted-foreground mb-4">
                Our revolutionary AI coach uses advanced DensePose technology to analyze your body surface in 3D, providing unparalleled insights into:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Body segment visualization and segmentation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>UV mapping for detailed muscular analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Enhanced muscle activation visualization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Interactive body part selection and analysis</span>
                </li>
              </ul>
              <Button asChild>
                <Link href="/ai-coach/densepose">Try DensePose Analysis</Link>
              </Button>
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
              <Link href="/ai-coach/densepose" className="text-muted-foreground hover:text-foreground">
                DensePose
              </Link>
              <Link href="/ai-coach/pose-comparison" className="text-muted-foreground hover:text-foreground">
                Pose Comparison
              </Link>
              <Link href="/progress" className="text-muted-foreground hover:text-foreground">
                Progress
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