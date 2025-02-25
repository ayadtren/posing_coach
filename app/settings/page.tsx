"use client";

import { useState } from "react";
import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">First Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        defaultValue="John"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Last Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        defaultValue="Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email</label>
                      <input 
                        type="email" 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        defaultValue="john.doe@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Phone</label>
                      <input 
                        type="tel" 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        defaultValue="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <Button className="mt-2">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Competition Settings</CardTitle>
                <CardDescription>Set your competition details</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Competition Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 rounded-md border border-input bg-background"
                      defaultValue="National Physique Championship 2023"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Competition Date</label>
                    <input 
                      type="date" 
                      className="w-full p-2 rounded-md border border-input bg-background"
                      defaultValue="2023-08-15"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Division</label>
                    <select className="w-full p-2 rounded-md border border-input bg-background">
                      <option>Men's Physique - Open</option>
                      <option>Men's Physique - Novice</option>
                      <option>Men's Physique - Masters 35+</option>
                      <option>Men's Physique - Masters 45+</option>
                    </select>
                  </div>
                  <Button className="mt-2">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Notifications</h3>
                      <p className="text-xs text-muted-foreground">Receive practice reminders</p>
                    </div>
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={setNotifications} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Dark Mode</h3>
                      <p className="text-xs text-muted-foreground">Use dark theme</p>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Sound Effects</h3>
                      <p className="text-xs text-muted-foreground">Play sounds during practice</p>
                    </div>
                    <Switch 
                      checked={soundEffects} 
                      onCheckedChange={setSoundEffects} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Subscription Settings
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 