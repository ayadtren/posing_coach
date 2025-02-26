'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { PoseData } from '@/lib/ai-coach/vision-provider';
import { Award, ChevronLeft, ChevronRight, Maximize2, Minimize2, Camera } from 'lucide-react';

// Professional bodybuilder references for comparison
const professionalBodybuilders = [
  {
    id: 'arnold',
    name: 'Arnold Schwarzenegger',
    era: 'Golden Era',
    description: 'The king of bodybuilding with perfect proportions and aesthetics.',
    images: {
      [PoseType.FRONT_RELAXED]: '/images/pros/arnold-front-relaxed.jpg',
      [PoseType.FRONT_DOUBLE_BICEPS]: '/images/pros/arnold-front-double-biceps.jpg',
      [PoseType.SIDE_CHEST]: '/images/pros/arnold-side-chest.jpg',
      [PoseType.BACK_DOUBLE_BICEPS]: '/images/pros/arnold-back-double-biceps.jpg',
      [PoseType.SIDE_TRICEPS]: '/images/pros/arnold-side-triceps.jpg',
      [PoseType.ABDOMINAL_AND_THIGH]: '/images/pros/arnold-abs-thigh.jpg',
    }
  },
  {
    id: 'zane',
    name: 'Frank Zane',
    era: 'Golden Era',
    description: 'Known for his aesthetic physique and perfect symmetry.',
    images: {
      [PoseType.FRONT_RELAXED]: '/images/pros/zane-front-relaxed.jpg',
      [PoseType.FRONT_DOUBLE_BICEPS]: '/images/pros/zane-front-double-biceps.jpg',
      [PoseType.SIDE_CHEST]: '/images/pros/zane-side-chest.jpg',
      [PoseType.BACK_DOUBLE_BICEPS]: '/images/pros/zane-back-double-biceps.jpg',
      [PoseType.SIDE_TRICEPS]: '/images/pros/zane-side-triceps.jpg',
      [PoseType.ABDOMINAL_AND_THIGH]: '/images/pros/zane-abs-thigh.jpg',
    }
  },
  {
    id: 'coleman',
    name: 'Ronnie Coleman',
    era: 'Mass Monster',
    description: '8x Mr. Olympia known for incredible mass and condition.',
    images: {
      [PoseType.FRONT_RELAXED]: '/images/pros/coleman-front-relaxed.jpg',
      [PoseType.FRONT_DOUBLE_BICEPS]: '/images/pros/coleman-front-double-biceps.jpg',
      [PoseType.SIDE_CHEST]: '/images/pros/coleman-side-chest.jpg',
      [PoseType.BACK_DOUBLE_BICEPS]: '/images/pros/coleman-back-double-biceps.jpg',
      [PoseType.SIDE_TRICEPS]: '/images/pros/coleman-side-triceps.jpg',
      [PoseType.ABDOMINAL_AND_THIGH]: '/images/pros/coleman-abs-thigh.jpg',
    }
  },
  {
    id: 'cbum',
    name: 'Chris Bumstead',
    era: 'Modern Classic',
    description: 'Multiple Classic Physique Olympia champion with golden era aesthetics.',
    images: {
      [PoseType.FRONT_RELAXED]: '/images/pros/cbum-front-relaxed.jpg',
      [PoseType.FRONT_DOUBLE_BICEPS]: '/images/pros/cbum-front-double-biceps.jpg',
      [PoseType.SIDE_CHEST]: '/images/pros/cbum-side-chest.jpg',
      [PoseType.BACK_DOUBLE_BICEPS]: '/images/pros/cbum-back-double-biceps.jpg',
      [PoseType.SIDE_TRICEPS]: '/images/pros/cbum-side-triceps.jpg',
      [PoseType.ABDOMINAL_AND_THIGH]: '/images/pros/cbum-abs-thigh.jpg',
    }
  },
];

interface PhysiqueMirrorProps {
  userImageUrl: string | null;
  poseData: PoseData | null;
  poseType: PoseType;
  className?: string;
  onCaptureRequest?: () => void;
}

export function PhysiqueMirror({
  userImageUrl,
  poseData,
  poseType,
  className = '',
  onCaptureRequest
}: PhysiqueMirrorProps) {
  const [activeBodybuilder, setActiveBodybuilder] = useState(professionalBodybuilders[0]);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle bodybuilder navigation
  const navigateBodybuilder = (direction: 'next' | 'prev') => {
    const currentIndex = professionalBodybuilders.findIndex(bb => bb.id === activeBodybuilder.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % professionalBodybuilders.length;
    } else {
      newIndex = (currentIndex - 1 + professionalBodybuilders.length) % professionalBodybuilders.length;
    }
    
    setActiveBodybuilder(professionalBodybuilders[newIndex]);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Get reference image based on pose type
  const referenceImage = activeBodybuilder.images[poseType] || activeBodybuilder.images[PoseType.FRONT_RELAXED];

  return (
    <div ref={containerRef} className={`physique-mirror ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className="w-full h-full">
        <CardHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              PhysiqueMirror Pro
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              {onCaptureRequest && (
                <Button variant="outline" size="icon" onClick={onCaptureRequest}>
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Compare your physique with professional bodybuilders
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="side-by-side" className="w-full" onValueChange={(value) => setCompareMode(value as 'side-by-side' | 'overlay')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="overlay">Overlay</TabsTrigger>
            </TabsList>
            
            <TabsContent value="side-by-side" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                  {userImageUrl ? (
                    <Image 
                      src={userImageUrl} 
                      alt="Your pose" 
                      fill 
                      style={{objectFit: 'contain'}} 
                      className="rounded-md"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <p>Capture your pose</p>
                    </div>
                  )}
                </div>
                
                <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden">
                  <Image 
                    src={referenceImage} 
                    alt={`${activeBodybuilder.name} - ${PoseType[poseType]}`} 
                    fill 
                    style={{objectFit: 'contain'}} 
                    className="rounded-md"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="overlay" className="mt-0">
              <div className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden mx-auto max-w-md">
                {userImageUrl && (
                  <Image 
                    src={userImageUrl} 
                    alt="Your pose" 
                    fill 
                    style={{objectFit: 'contain'}} 
                    className="rounded-md"
                  />
                )}
                
                <div className="absolute inset-0">
                  <Image 
                    src={referenceImage} 
                    alt={`${activeBodybuilder.name} - ${PoseType[poseType]}`} 
                    fill 
                    style={{objectFit: 'contain', opacity: overlayOpacity}} 
                    className="rounded-md"
                  />
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs">Opacity:</span>
                    <Slider 
                      value={[overlayOpacity * 100]} 
                      min={10} 
                      max={90} 
                      step={1}
                      onValueChange={(values) => setOverlayOpacity(values[0] / 100)}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => navigateBodybuilder('prev')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              
              <div className="text-center">
                <h3 className="font-medium">{activeBodybuilder.name}</h3>
                <Badge variant="secondary">{activeBodybuilder.era}</Badge>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => navigateBodybuilder('next')}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              {activeBodybuilder.description}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between text-xs text-muted-foreground pt-2">
          <p>Pose: {PoseType[poseType].replace(/_/g, ' ')}</p>
          <p>Swipe to compare with other pros</p>
        </CardFooter>
      </Card>
    </div>
  );
} 