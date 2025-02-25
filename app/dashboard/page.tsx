'use client';

import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Trophy, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Welcome to PosePrep Pro</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Practice Sessions</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Days to Competition</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86</div>
              <p className="text-xs text-muted-foreground">Set your date in settings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Poses Mastered</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4/12</div>
              <p className="text-xs text-muted-foreground">Front poses complete</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.2 hrs</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Continue Your Training</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-accent/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Front Pose Mastery</h3>
                  <p className="text-sm text-muted-foreground">Day 3 of 14</p>
                </div>
                <Button onClick={() => window.location.href = '/practice'}>Continue</Button>
              </div>
              
              <div className="bg-accent/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Transition Techniques</h3>
                  <p className="text-sm text-muted-foreground">New tutorial</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/ai-coach'}>Start</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Coach comments on your poses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-primary p-3">
                <p className="text-sm">
                  "Great improvement on shoulder positioning. Work on keeping your core tight during the full pose."
                </p>
                <p className="text-xs text-muted-foreground mt-2">Front pose - 2 days ago</p>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/progress'}>View All Feedback</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 