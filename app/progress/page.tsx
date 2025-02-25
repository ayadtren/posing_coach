'use client';

import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Your Progress</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Practice Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5 hrs</div>
              <div className="mt-4 h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "65%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">65% of monthly goal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Poses Mastered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7/12</div>
              <div className="mt-4 h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "58%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">58% complete</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4 days</div>
              <div className="mt-4 h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "80%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Current streak</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pose Proficiency</CardTitle>
              <CardDescription>Your mastery level for each pose</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Front Relaxed</span>
                    <span className="text-sm text-muted-foreground">90%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Front Double Biceps</span>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Side Chest</span>
                    <span className="text-sm text-muted-foreground">60%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Back Relaxed</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Back Double Biceps</span>
                    <span className="text-sm text-muted-foreground">50%</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Your practice sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "40%" }}></div>
                  <span className="text-xs mt-2">Mon</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "70%" }}></div>
                  <span className="text-xs mt-2">Tue</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "30%" }}></div>
                  <span className="text-xs mt-2">Wed</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "90%" }}></div>
                  <span className="text-xs mt-2">Thu</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "60%" }}></div>
                  <span className="text-xs mt-2">Fri</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "20%" }}></div>
                  <span className="text-xs mt-2">Sat</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-primary w-8 rounded-t-md" style={{ height: "50%" }}></div>
                  <span className="text-xs mt-2">Sun</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Improvement Areas</CardTitle>
            <CardDescription>Focus on these areas to improve your posing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-accent/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Shoulder Positioning</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Work on keeping your shoulders back and down during front poses to create a wider appearance.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://www.youtube.com/watch?v=shoulder-positioning-tutorial', '_blank')}
                >
                  View Tutorial
                </Button>
              </div>
              
              <div className="bg-accent/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Core Engagement</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Practice maintaining core tension throughout all poses to improve overall presentation.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://www.youtube.com/watch?v=core-engagement-tutorial', '_blank')}
                >
                  View Tutorial
                </Button>
              </div>
              
              <div className="bg-accent/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Pose Transitions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Work on smoother transitions between poses for a more professional stage presence.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://www.youtube.com/watch?v=pose-transitions-tutorial', '_blank')}
                >
                  View Tutorial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 