'use client';

import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Practice Your Poses</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Guided Practice</CardTitle>
              <CardDescription>Follow structured routines with step-by-step guidance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-accent/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Front Pose Mastery</h3>
                  <p className="text-sm text-muted-foreground">14-day program</p>
                </div>
                <Button>Start</Button>
              </div>
              
              <div className="bg-accent/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Side Pose Fundamentals</h3>
                  <p className="text-sm text-muted-foreground">10-day program</p>
                </div>
                <Button>Start</Button>
              </div>
              
              <div className="bg-accent/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Back Pose Perfection</h3>
                  <p className="text-sm text-muted-foreground">12-day program</p>
                </div>
                <Button>Start</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Free Practice</CardTitle>
              <CardDescription>Practice specific poses with real-time feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Front Relaxed</h3>
                  <Link href="/practice/front-relaxed" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
                
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Front Double Biceps</h3>
                  <Link href="/practice/front-double-biceps" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
                
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Side Chest</h3>
                  <Link href="/practice/side-chest" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
                
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Back Relaxed</h3>
                  <Link href="/practice/back-relaxed" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
                
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Back Double Biceps</h3>
                  <Link href="/practice/back-double-biceps" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
                
                <div className="bg-accent/50 p-4 rounded-lg flex flex-col items-center text-center">
                  <h3 className="font-medium mb-2">Side Triceps</h3>
                  <Link href="/practice/side-triceps" className="w-full">
                    <Button variant="outline" className="w-full">Practice</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Practice Sessions</CardTitle>
            <CardDescription>Review your recent practice sessions and feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary p-4 bg-accent/30 rounded-r-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Front Double Biceps</h3>
                  <span className="text-sm text-muted-foreground">2 days ago</span>
                </div>
                <p className="text-sm mb-3">
                  "Good arm positioning, but work on keeping your core tight and shoulders back."
                </p>
                <Button variant="outline" size="sm">Review Session</Button>
              </div>
              
              <div className="border-l-4 border-primary p-4 bg-accent/30 rounded-r-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Side Chest</h3>
                  <span className="text-sm text-muted-foreground">5 days ago</span>
                </div>
                <p className="text-sm mb-3">
                  "Excellent chest presentation. Try to rotate your torso more to maximize the pose."
                </p>
                <Button variant="outline" size="sm">Review Session</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 