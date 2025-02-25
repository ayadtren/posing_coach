'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoachView } from '@/components/ai-coach/CoachView';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Upload, Camera, Image, Info, Play, Pause, Award } from 'lucide-react';

// Map of pose names to PoseType enum
const poseTypeMap: Record<string, PoseType> = {
  'front-relaxed': PoseType.FRONT_RELAXED,
  'front-double-biceps': PoseType.FRONT_DOUBLE_BICEPS,
  'side-chest': PoseType.SIDE_CHEST,
  'back-relaxed': PoseType.BACK_DOUBLE_BICEPS,
  'back-double-biceps': PoseType.BACK_DOUBLE_BICEPS,
  'side-triceps': PoseType.SIDE_TRICEPS,
};

// Map of pose names to tutorial content
const poseTutorials: Record<string, {
  title: string;
  description: string;
  steps: string[];
  muscleGroups: {name: string; description: string}[];
  tips: string[];
}> = {
  'front-relaxed': {
    title: 'Front Relaxed Pose',
    description: 'The front relaxed pose is the starting pose for most front-facing comparisons. It showcases your overall physique, symmetry, and conditioning.',
    steps: [
      'Stand with feet shoulder-width apart, toes pointed slightly outward.',
      'Keep your shoulders back and down, chest up.',
      'Engage your core muscles to maintain a tight midsection.',
      'Arms should hang naturally at your sides, slightly away from your body.',
      'Spread your lats to create a wider appearance.',
      'Flex your quads and calves while maintaining a natural stance.'
    ],
    muscleGroups: [
      { name: 'Quadriceps', description: 'Keep them flexed throughout the pose to show definition.' },
      { name: 'Abdominals', description: 'Maintain tension to display your core development.' },
      { name: 'Lats', description: 'Spread them wide to create a V-taper appearance.' },
      { name: 'Shoulders', description: 'Keep them back and down to enhance your chest.' },
      { name: 'Calves', description: 'Flex them by pressing through the balls of your feet.' }
    ],
    tips: [
      'Practice breathing while maintaining muscle tension.',
      'Focus on symmetry - ensure both sides of your body are equally presented.',
      'Avoid hunching forward or leaning back too much.',
      'Keep a neutral facial expression or slight smile.'
    ]
  },
  'front-double-biceps': {
    title: 'Front Double Biceps Pose',
    description: 'The front double biceps pose highlights your arm development, shoulder width, and upper body symmetry.',
    steps: [
      'Start in the front relaxed position with feet shoulder-width apart.',
      'Raise both arms to approximately 90 degrees from your torso.',
      'Bend your elbows and make a fist with each hand.',
      'Flex your biceps hard while rotating your wrists inward slightly.',
      'Spread your lats to create a wider appearance.',
      'Flex your quads and calves while maintaining balance.'
    ],
    muscleGroups: [
      { name: 'Biceps', description: 'Primary focus - contract them fully and rotate for peak display.' },
      { name: 'Forearms', description: 'Flex them to complement your bicep development.' },
      { name: 'Lats', description: 'Spread them wide to create a dramatic V-taper.' },
      { name: 'Quadriceps', description: 'Keep them contracted to show leg definition.' },
      { name: 'Abdominals', description: 'Maintain tension throughout the pose.' }
    ],
    tips: [
      'Experiment with hand position to find your best bicep peak.',
      'Don\'t raise your shoulders - keep them down while flexing.',
      'Try different elbow heights to find what works best for your physique.',
      'Practice holding the pose while breathing normally.'
    ]
  },
  // Add other poses with their tutorials...
  'side-chest': {
    title: 'Side Chest Pose',
    description: 'The side chest pose emphasizes chest development, arm size, and overall upper body mass.',
    steps: [
      'Position your body at a 45-90 degree angle to the judges/camera.',
      'Place the leg closest to the judges forward, with knee slightly bent.',
      'Flex the quad and calf of your forward leg.',
      'Place the arm closest to the judges on your hip or waist.',
      'Bring your other arm across your body and grasp your wrist or forearm.',
      'Expand your chest and pull your shoulders back.',
      'Flex your chest, bicep, and forearm hard.'
    ],
    muscleGroups: [
      { name: 'Pectorals', description: 'Primary focus - expand fully and contract for maximum size.' },
      { name: 'Biceps', description: 'Flex the visible arm to show peak and fullness.' },
      { name: 'Serratus', description: 'Engage these muscles along the ribcage for detailed separation.' },
      { name: 'Quadriceps', description: 'Flex the forward leg to show sweep and definition.' },
      { name: 'Calves', description: 'Point the toe of your forward leg to maximize calf contraction.' }
    ],
    tips: [
      'Experiment with the angle of your body to find your best presentation.',
      'Try different hand positions to maximize chest expansion.',
      'Keep your waist tight throughout the pose.',
      'Practice transitioning smoothly into this pose from others.'
    ]
  },
  // Add other poses...
};

// Legendary bodybuilders reference poses
const legendaryPoses: Record<string, {name: string, era: string, image: string, description: string}[]> = {
  'front-relaxed': [
    {
      name: 'Frank Zane',
      era: '1970s',
      image: '/images/legends/zane-front-relaxed.jpg',
      description: 'Known for his aesthetic physique and perfect symmetry. Notice his relaxed yet commanding stance with shoulders pulled back slightly.'
    },
    {
      name: 'Lee Haney',
      era: '1980s',
      image: '/images/legends/haney-front-relaxed.jpg',
      description: 'Eight-time Mr. Olympia who mastered the art of appearing relaxed while still showcasing his impressive mass and proportion.'
    },
    {
      name: 'Flex Wheeler',
      era: '1990s',
      image: '/images/legends/wheeler-front-relaxed.jpg',
      description: 'Often called "The Sultan of Symmetry". His front relaxed pose emphasized his tiny waist and perfect V-taper.'
    }
  ],
  'front-double-biceps': [
    {
      name: 'Arnold Schwarzenegger',
      era: '1970s',
      image: '/images/legends/arnold-front-double-biceps.jpg',
      description: 'The iconic front double biceps from the 7-time Mr. Olympia. Note how he rotates his wrists to maximize bicep peak and width.'
    },
    {
      name: 'Ronnie Coleman',
      era: '1990s-2000s',
      image: '/images/legends/coleman-front-double-biceps.jpg',
      description: '8-time Mr. Olympia who combined massive size with detail. His front double biceps showcased incredible arm development and lat spread.'
    },
    {
      name: 'Phil Heath',
      era: '2010s',
      image: '/images/legends/heath-front-double-biceps.jpg',
      description: '7-time Mr. Olympia known as "The Gift". His front double biceps emphasized 3D muscle bellies and deep separations.'
    }
  ],
  'side-chest': [
    {
      name: 'Franco Columbu',
      era: '1970s',
      image: '/images/legends/columbu-side-chest.jpg',
      description: 'Two-time Mr. Olympia with one of the most powerful chest developments in history. His side chest pose was unmatched in his era.'
    },
    {
      name: 'Dorian Yates',
      era: '1990s',
      image: '/images/legends/yates-side-chest.jpg',
      description: '6-time Mr. Olympia who revolutionized the side chest pose with extreme thickness and density.'
    },
    {
      name: 'Jay Cutler',
      era: '2000s',
      image: '/images/legends/cutler-side-chest.jpg',
      description: '4-time Mr. Olympia who mastered the art of twisting to maximize chest and shoulder visibility in this pose.'
    }
  ],
  'back-double-biceps': [
    {
      name: 'Lee Haney',
      era: '1980s',
      image: '/images/legends/haney-back-double-biceps.jpg',
      description: 'His back double biceps set the standard for the "Christmas tree" lower back development and overall back width.'
    },
    {
      name: 'Dorian Yates',
      era: '1990s',
      image: '/images/legends/yates-back-double-biceps.jpg',
      description: 'Redefined back development with unprecedented thickness and detail. His back poses were considered unbeatable.'
    },
    {
      name: 'Ronnie Coleman',
      era: '1990s-2000s',
      image: '/images/legends/coleman-back-double-biceps.jpg',
      description: 'Perhaps the greatest back in bodybuilding history. His back double biceps showed incredible width, thickness, and detail.'
    }
  ],
  'side-triceps': [
    {
      name: 'Frank Zane',
      era: '1970s',
      image: '/images/legends/zane-side-triceps.jpg',
      description: 'Master of aesthetics who used the side triceps to showcase his perfect proportions and conditioning.'
    },
    {
      name: 'Kevin Levrone',
      era: '1990s',
      image: '/images/legends/levrone-side-triceps.jpg',
      description: 'Known for his incredible shoulder-to-waist ratio and arm development, which shined in his side triceps pose.'
    },
    {
      name: 'Flex Wheeler',
      era: '1990s',
      image: '/images/legends/wheeler-side-triceps.jpg',
      description: 'His side triceps pose highlighted his tiny waist and massive arms with perfect execution.'
    }
  ],
  'back-relaxed': [
    {
      name: 'Shawn Ray',
      era: '1990s',
      image: '/images/legends/ray-back-relaxed.jpg',
      description: 'Known for his aesthetic back development and perfect taper, even in a relaxed stance.'
    },
    {
      name: 'Lee Haney',
      era: '1980s',
      image: '/images/legends/haney-back-relaxed.jpg',
      description: 'His back width was immediately apparent even in the relaxed pose, setting the standard for his era.'
    },
    {
      name: 'Phil Heath',
      era: '2010s',
      image: '/images/legends/heath-back-relaxed.jpg',
      description: 'Even in a relaxed pose, his back showed incredible 3D development and detail.'
    }
  ]
};

export default function PosePracticePage() {
  const params = useParams();
  const router = useRouter();
  const poseName = params.pose as string;
  const poseType = poseTypeMap[poseName];
  const tutorial = poseTutorials[poseName];
  
  const [activeTab, setActiveTab] = useState('tutorial');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [focusedMuscleGroup, setFocusedMuscleGroup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For interactive practice
  const [practiceStep, setPracticeStep] = useState(0);
  const [isPracticePaused, setIsPracticePaused] = useState(false);
  
  // For personalized guidance
  const [bodyStats, setBodyStats] = useState({
    height: '',
    weight: '',
    bodyFat: '',
    focusAreas: '',
  });
  
  useEffect(() => {
    // Redirect if pose is not valid
    if (!poseType || !tutorial) {
      router.push('/practice');
    }
  }, [poseType, tutorial, router]);
  
  useEffect(() => {
    // Progress timer for interactive practice
    let timer: NodeJS.Timeout;
    if (isRecording && !isPracticePaused) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsRecording(false);
            return 100;
          }
          return prev + 1;
        });
      }, 300);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPracticePaused]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setActiveTab('analysis');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStartPractice = () => {
    setIsRecording(true);
    setPracticeStep(0);
    setProgress(0);
  };
  
  const handlePausePractice = () => {
    setIsPracticePaused(!isPracticePaused);
  };
  
  const handleBodyStatsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBodyStats(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFocusMuscleGroup = (muscleGroup: string) => {
    setFocusedMuscleGroup(muscleGroup === focusedMuscleGroup ? null : muscleGroup);
  };
  
  if (!poseType || !tutorial) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/practice')} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{tutorial.title}</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
            <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
            <TabsTrigger value="guidance">Personalized Guidance</TabsTrigger>
            <TabsTrigger value="practice">Interactive Practice</TabsTrigger>
            <TabsTrigger value="legends" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Legends Reference</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tutorial Tab */}
          <TabsContent value="tutorial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How to Perform the {tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Step-by-Step Instructions</h3>
                  <ol className="space-y-2 ml-6 list-decimal">
                    {tutorial.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Muscle Groups</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tutorial.muscleGroups.map((muscle, index) => (
                      <Card key={index} className="bg-accent/30">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">{muscle.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <p className="text-sm">{muscle.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Pro Tips</h3>
                  <ul className="space-y-2 ml-6 list-disc">
                    {tutorial.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button onClick={() => setActiveTab('practice')} size="lg">
                    Start Practicing Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Upload & Analysis Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Pose</CardTitle>
                <CardDescription>Upload a photo of yourself performing this pose for AI analysis and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/50 rounded-lg p-12 mb-6">
                  {uploadedImage ? (
                    <div className="relative w-full max-w-md">
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded pose" 
                        className="w-full h-auto rounded-lg"
                      />
                      <Button 
                        variant="outline" 
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImage(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-primary mb-4" />
                      <h3 className="text-lg font-medium mb-2">Drag and drop your image here</h3>
                      <p className="text-sm text-muted-foreground mb-4">or click the button below</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                    </>
                  )}
                </div>
                
                {uploadedImage && (
                  <div className="space-y-6">
                    <div className="bg-accent/30 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3">AI Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-1">Overall Score: 7.5/10</h4>
                          <Progress value={75} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-1">Muscle Group Scores</h4>
                            <ul className="space-y-2">
                              {tutorial.muscleGroups.map((muscle, index) => (
                                <li key={index} className="flex justify-between items-center">
                                  <span>{muscle.name}</span>
                                  <span className="font-medium">{Math.floor(Math.random() * 3) + 7}/10</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Areas for Improvement</h4>
                            <ul className="space-y-1 list-disc ml-4">
                              <li>Improve lat spread for better V-taper</li>
                              <li>Engage core muscles more consistently</li>
                              <li>Adjust foot positioning for better balance</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setUploadedImage(null)}>
                        Upload New Image
                      </Button>
                      <Button onClick={() => setActiveTab('practice')}>
                        Practice Now
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Personalized Guidance Tab */}
          <TabsContent value="guidance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Pose Guidance</CardTitle>
                <CardDescription>Get customized advice based on your body type and goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input 
                        id="height" 
                        name="height"
                        placeholder={'e.g., 5\'10" or 178cm'} 
                        value={bodyStats.height}
                        onChange={handleBodyStatsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input 
                        id="weight" 
                        name="weight"
                        placeholder={'e.g., 180lbs or 82kg'} 
                        value={bodyStats.weight}
                        onChange={handleBodyStatsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bodyFat">Estimated Body Fat %</Label>
                      <Input 
                        id="bodyFat" 
                        name="bodyFat"
                        placeholder={'e.g., 12%'} 
                        value={bodyStats.bodyFat}
                        onChange={handleBodyStatsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="focusAreas">Areas You Want to Highlight</Label>
                      <Textarea 
                        id="focusAreas" 
                        name="focusAreas"
                        placeholder={'e.g., I want to highlight my shoulders and arms, while minimizing my waist'} 
                        value={bodyStats.focusAreas}
                        onChange={handleBodyStatsChange}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-accent/30 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Your Personalized Guidance</h3>
                    {bodyStats.height && bodyStats.weight ? (
                      <div className="space-y-4">
                        <p>Based on your body stats and goals, here are personalized tips for the {tutorial.title}:</p>
                        
                        <div>
                          <h4 className="font-medium">Stance Adjustments:</h4>
                          <p className="text-sm">With your height of {bodyStats.height}, try positioning your feet slightly wider than shoulder-width to create a more balanced foundation.</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Muscle Emphasis:</h4>
                          <p className="text-sm">
                            {bodyStats.focusAreas ? 
                              `To highlight ${bodyStats.focusAreas}, focus on the following adjustments...` : 
                              'Enter your focus areas for personalized muscle emphasis tips.'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Proportional Balance:</h4>
                          <p className="text-sm">For your body composition, emphasize creating a visual X-frame by widening your shoulder presentation and maintaining tension in your core.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Fill in your details on the left to receive personalized guidance for this pose.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('practice')}>
                    Apply Guidance & Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Interactive Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Interactive Practice Session</CardTitle>
                    <CardDescription>Follow along with real-time feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative w-full aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                      {isRecording ? (
                        <CoachView poseType={poseType} />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <Camera className="h-16 w-16 mb-4" />
                          <p className="text-lg font-medium mb-2">Ready to start your practice session?</p>
                          <Button onClick={handleStartPractice}>
                            Start Recording
                          </Button>
                        </div>
                      )}
                      
                      {isRecording && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={handlePausePractice}
                          >
                            {isPracticePaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                            {isPracticePaused ? 'Resume' : 'Pause'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsRecording(false)}
                          >
                            End Session
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isRecording && (
                      <div className="w-full space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Practice Progress</span>
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="bg-accent/30 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Current Focus: {tutorial.steps[practiceStep]}</h3>
                          <p className="text-sm text-muted-foreground">
                            {practiceStep < tutorial.steps.length - 1 ? 
                              `Next: ${tutorial.steps[practiceStep + 1]}` : 
                              'Final step - maintain the complete pose'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Muscle Group Focus</CardTitle>
                    <CardDescription>Click on a muscle group to focus your practice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tutorial.muscleGroups.map((muscle, index) => (
                        <Button 
                          key={index}
                          variant={focusedMuscleGroup === muscle.name ? "default" : "outline"}
                          className="w-full justify-start mb-2"
                          onClick={() => handleFocusMuscleGroup(muscle.name)}
                        >
                          {muscle.name}
                        </Button>
                      ))}
                    </div>
                    
                    {focusedMuscleGroup && (
                      <div className="mt-6 bg-accent/30 p-4 rounded-lg">
                        <div className="flex items-start mb-2">
                          <Info className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                          <div>
                            <h4 className="font-medium">{focusedMuscleGroup} Focus</h4>
                            <p className="text-sm">
                              {tutorial.muscleGroups.find(m => m.name === focusedMuscleGroup)?.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-1">Specific Cues:</h4>
                          <ul className="text-sm space-y-1 list-disc ml-4">
                            <li>Visualize squeezing and contracting this muscle group</li>
                            <li>Focus on mind-muscle connection</li>
                            <li>Adjust your positioning to maximize this muscle's appearance</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="legends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Legendary {tutorial.title} Poses
                </CardTitle>
                <CardDescription>
                  Study how bodybuilding legends executed this pose to perfect your own technique
                </CardDescription>
              </CardHeader>
              <CardContent>
                {legendaryPoses[params.pose as string] ? (
                  <div className="space-y-8">
                    {legendaryPoses[params.pose as string].map((legend, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-6 border-b pb-6 last:border-0">
                        <div className="md:w-1/3 bg-muted/50 rounded-lg flex items-center justify-center p-2 min-h-[300px]">
                          <div className="text-center text-muted-foreground">
                            {/* Actual images of legendary bodybuilders */}
                            <img 
                              src={legend.image} 
                              alt={`${legend.name}'s ${tutorial.title} pose`}
                              className="rounded-lg h-[280px] w-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="md:w-2/3">
                          <h3 className="text-xl font-bold">{legend.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">Era: {legend.era}</p>
                          <p className="mb-4">{legend.description}</p>
                          
                          <h4 className="font-medium mb-2">Key Takeaways:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {index === 0 && (
                              <>
                                <li>Notice the hand and elbow positioning</li>
                                <li>Pay attention to the stance width</li>
                                <li>Observe how the muscles are tensed vs. relaxed</li>
                              </>
                            )}
                            {index === 1 && (
                              <>
                                <li>Study the angle of the torso</li>
                                <li>Note how the pose emphasizes their strongest features</li>
                                <li>Look at the subtle details in muscle control</li>
                              </>
                            )}
                            {index === 2 && (
                              <>
                                <li>Observe the facial expression and confidence</li>
                                <li>See how they create the illusion of greater size</li>
                                <li>Notice the overall balance and symmetry</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-accent/20 p-4 rounded-lg mt-6">
                      <h3 className="font-medium mb-2">Pro Tip:</h3>
                      <p>
                        Study these poses in a mirror and try to recreate them. Pay attention to the subtle 
                        details that make these legends stand out. Remember that perfect posing is about 
                        highlighting your strengths and minimizing weaknesses.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No reference poses available for this pose type.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 