'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { VisionProvider } from '@/lib/ai-coach/vision-provider';
import { PoseAnalyzer, PoseFeedback, PoseType, CompetitionCategory } from '@/lib/ai-coach/pose-analyzer';
import { VoiceFeedbackProvider } from '@/lib/ai-coach/voice-feedback';
import { Progress } from '@/components/ui/progress';
import { PhysiqueUploader } from './PhysiqueUploader';
import { PoseOverlayService, PhysiqueData } from '@/lib/ai-coach/pose-overlay-service';
import { EnhancedOverlayService, EnhancedPhysiqueData } from '@/lib/ai-coach/enhanced-overlay-service';
import { EnhancedMuscleVisualization, MuscleGroup } from '@/lib/ai-coach/enhanced-muscle-visualization';
import { Award } from 'lucide-react';

// Legendary bodybuilder reference images for comparison
const legendaryPoseReferences: Record<PoseType, {name: string, image: string}> = {
  [PoseType.FRONT_RELAXED]: {
    name: 'Frank Zane',
    image: '/images/legends/zane-front-relaxed.jpg'
  },
  [PoseType.FRONT_DOUBLE_BICEPS]: {
    name: 'Arnold Schwarzenegger',
    image: '/images/legends/arnold-front-double-biceps.jpg'
  },
  [PoseType.SIDE_CHEST]: {
    name: 'Franco Columbu',
    image: '/images/legends/columbu-side-chest.jpg'
  },
  [PoseType.BACK_DOUBLE_BICEPS]: {
    name: 'Ronnie Coleman',
    image: '/images/legends/coleman-back-double-biceps.jpg'
  },
  [PoseType.SIDE_TRICEPS]: {
    name: 'Frank Zane',
    image: '/images/legends/zane-side-triceps.jpg'
  },
  [PoseType.ABDOMINAL_AND_THIGH]: {
    name: 'Frank Zane',
    image: '/images/legends/zane-front-relaxed.jpg' // Fallback to front relaxed
  }
};

interface CoachViewProps {
  poseType?: PoseType;
}

export function CoachView({ poseType }: CoachViewProps = {}) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedOverlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedMuscleCanvasRef = useRef<HTMLCanvasElement>(null);
  const legendCanvasRef = useRef<HTMLCanvasElement>(null);
  const legendImageRef = useRef<HTMLImageElement | null>(null);
  
  // State
  const [isCoaching, setIsCoaching] = useState(false);
  const [feedback, setFeedback] = useState<PoseFeedback | null>(null);
  const [selectedPose, setSelectedPose] = useState<PoseType>(poseType || PoseType.FRONT_RELAXED);
  const [selectedCategory, setSelectedCategory] = useState<CompetitionCategory>(CompetitionCategory.CLASSIC_PHYSIQUE);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [useEnhancedOverlay, setUseEnhancedOverlay] = useState(true);
  const [useEnhancedMuscleVisualization, setUseEnhancedMuscleVisualization] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [physiqueData, setPhysiqueData] = useState<PhysiqueData | null>(null);
  const [showPhysiqueUploader, setShowPhysiqueUploader] = useState(true);
  const [llmFeedbackEnabled, setLLMFeedbackEnabled] = useState(true);
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);
  const [feedbackCooldown, setFeedbackCooldown] = useState(5000); // 5 seconds between feedback
  const [lastFeedbackScore, setLastFeedbackScore] = useState<number | null>(null);
  const [feedbackFrequency, setFeedbackFrequency] = useState<'high' | 'medium' | 'low'>('medium');
  const [showLegendComparison, setShowLegendComparison] = useState<boolean>(false);
  const [poseHoldTimer, setPoseHoldTimer] = useState(0);
  const [poseHoldStartTime, setPoseHoldStartTime] = useState<number | null>(null);
  const [isHoldingPose, setIsHoldingPose] = useState(false);
  const REQUIRED_HOLD_TIME = 30; // 30 seconds for a complete pose hold
  const POSE_SCORE_THRESHOLD = 70; // Minimum score to consider a pose as being held correctly
  
  // Video tutorial URLs for each pose
  const videoTutorials = {
    [PoseType.FRONT_RELAXED]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
    [PoseType.FRONT_DOUBLE_BICEPS]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
    [PoseType.SIDE_CHEST]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
    [PoseType.BACK_DOUBLE_BICEPS]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
    [PoseType.SIDE_TRICEPS]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
    [PoseType.ABDOMINAL_AND_THIGH]: 'https://www.youtube.com/watch?v=Rl7dAs-Gq00',
  };

  // Function to open video tutorial based on selected pose
  const openVideoTutorial = (poseType: PoseType) => {
    const url = videoTutorials[poseType] || 'https://www.youtube.com/watch?v=Rl7dAs-Gq00';
    window.open(url, '_blank');
  };
  
  // Providers
  const visionProviderRef = useRef<VisionProvider | null>(null);
  const poseAnalyzerRef = useRef<PoseAnalyzer | null>(null);
  const voiceFeedbackRef = useRef<VoiceFeedbackProvider | null>(null);
  const poseOverlayServiceRef = useRef<PoseOverlayService | null>(null);
  const enhancedOverlayServiceRef = useRef<EnhancedOverlayService | null>(null);
  const enhancedMuscleVisualizationRef = useRef<EnhancedMuscleVisualization | null>(null);
  
  // Animation frame ID for cleanup
  const requestAnimationFrameId = useRef<number | null>(null);
  
  // Initialize providers
  useEffect(() => {
    visionProviderRef.current = new VisionProvider();
    poseAnalyzerRef.current = new PoseAnalyzer();
    voiceFeedbackRef.current = new VoiceFeedbackProvider();
    poseOverlayServiceRef.current = new PoseOverlayService();
    enhancedOverlayServiceRef.current = new EnhancedOverlayService();
    enhancedMuscleVisualizationRef.current = new EnhancedMuscleVisualization();
    
    return () => {
      // Cleanup
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
      
      if (visionProviderRef.current) {
        visionProviderRef.current.dispose();
      }
      
      if (voiceFeedbackRef.current) {
        voiceFeedbackRef.current.stop();
      }
      
      if (enhancedOverlayServiceRef.current) {
        enhancedOverlayServiceRef.current.dispose();
      }
    };
  }, []);
  
  // Update pose analyzer settings when selections change
  useEffect(() => {
    if (poseAnalyzerRef.current) {
      poseAnalyzerRef.current.setPoseType(selectedPose);
      poseAnalyzerRef.current.setCompetitionCategory(selectedCategory);
    }
    
    if (poseOverlayServiceRef.current) {
      poseOverlayServiceRef.current.setPoseType(selectedPose);
    }
    
    if (enhancedOverlayServiceRef.current) {
      enhancedOverlayServiceRef.current.setPoseType(selectedPose);
    }
    
    if (enhancedMuscleVisualizationRef.current) {
      enhancedMuscleVisualizationRef.current.setPoseType(selectedPose);
    }
  }, [selectedPose, selectedCategory]);
  
  // Initialize enhanced overlay when canvas is ready
  useEffect(() => {
    if (enhancedOverlayCanvasRef.current && enhancedOverlayServiceRef.current) {
      enhancedOverlayServiceRef.current.initialize(enhancedOverlayCanvasRef.current);
    }
  }, [enhancedOverlayCanvasRef.current]);
  
  // Initialize enhanced muscle visualization when canvas is ready
  useEffect(() => {
    if (enhancedMuscleCanvasRef.current && enhancedMuscleVisualizationRef.current) {
      const ctx = enhancedMuscleCanvasRef.current.getContext('2d');
      if (ctx) {
        enhancedMuscleVisualizationRef.current.initialize(ctx);
      }
    }
  }, [enhancedMuscleCanvasRef.current]);
  
  // Update voice feedback settings
  useEffect(() => {
    if (voiceFeedbackRef.current) {
      voiceFeedbackRef.current.setMuted(!voiceEnabled);
      voiceFeedbackRef.current.setLLMEnabled(llmFeedbackEnabled);
    }
  }, [voiceEnabled, llmFeedbackEnabled]);
  
  // Update feedback cooldown based on frequency setting
  useEffect(() => {
    switch (feedbackFrequency) {
      case 'high':
        setFeedbackCooldown(3000); // More frequent feedback
        break;
      case 'medium':
        setFeedbackCooldown(5000); // Default
        break;
      case 'low':
        setFeedbackCooldown(8000); // Less frequent feedback
        break;
    }
  }, [feedbackFrequency]);
  
  // Handle physique data processing
  const handlePhysiqueProcessed = (data: PhysiqueData) => {
    setPhysiqueData(data);
    if (poseOverlayServiceRef.current) {
      poseOverlayServiceRef.current.setPhysiqueData(data);
    }
    
    // Convert to enhanced physique data
    if (enhancedOverlayServiceRef.current) {
      const enhancedData: EnhancedPhysiqueData = {
        ...data,
        bodyFat: 12, // Default estimated body fat percentage
        muscleDefinition: 8, // Default muscle definition on 0-10 scale
      };
      enhancedOverlayServiceRef.current.setPhysiqueData(enhancedData);
    }
    
    // Set pose type for enhanced muscle visualization
    if (enhancedMuscleVisualizationRef.current) {
      enhancedMuscleVisualizationRef.current.setPoseType(selectedPose);
    }
    
    setShowPhysiqueUploader(false);
  };
  
  // Start camera
  const startCamera = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          setCameraReady(true);
          setError(null);
        }
      };
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraReady(false);
    }
  };
  
  // Start coaching session
  const startCoaching = async () => {
    if (!cameraReady) {
      // Start the camera first if it's not ready
      try {
        await startCamera();
        // Give a small delay for camera to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Error starting camera:', err);
        setError('Could not access camera. Please ensure you have granted camera permissions.');
        return;
      }
    }
    
    if (!visionProviderRef.current || !poseAnalyzerRef.current) return;
    
    try {
      setError(null);
      // Show loading state
      setIsCoaching(true);
      
      // Reset pose hold timer
      setPoseHoldTimer(REQUIRED_HOLD_TIME);
      setPoseHoldStartTime(null);
      setIsHoldingPose(false);
      
      // Reset LLM feedback session to avoid repetitive feedback
      if (voiceFeedbackRef.current && voiceFeedbackRef.current.isLLMReady()) {
        voiceFeedbackRef.current.resetLLMSession();
      }
      
      // Initialize TensorFlow and the pose detector
      await visionProviderRef.current.initialize();
      
      // Start the detection loop
      detectPose();
    } catch (err) {
      console.error('Error starting coaching session:', err);
      setIsCoaching(false);
      setError('Failed to initialize AI coach. This might be due to browser compatibility issues. Please try using Chrome or Edge for best results, or try refreshing the page.');
    }
  };
  
  // Stop coaching session
  const stopCoaching = () => {
    if (requestAnimationFrameId.current) {
      cancelAnimationFrame(requestAnimationFrameId.current);
      requestAnimationFrameId.current = null;
    }
    
    setIsCoaching(false);
    setFeedback(null);
    setPoseHoldTimer(0);
    setPoseHoldStartTime(null);
    setIsHoldingPose(false);
  };
  
  // Detect pose and provide feedback
  const detectPose = async () => {
    if (!videoRef.current || !visionProviderRef.current || !poseAnalyzerRef.current) return;
    
    try {
      const poseData = await visionProviderRef.current.detectPose(videoRef.current);
      
      if (poseData) {
        // Analyze pose and get feedback
        const newFeedback = poseAnalyzerRef.current.analyzePose(poseData);
        setFeedback(newFeedback);
        
        // Update pose holding status
        const isPoseCorrect = newFeedback.score >= POSE_SCORE_THRESHOLD;
        
        if (isPoseCorrect) {
          if (!isHoldingPose) {
            // Just started holding the pose correctly
            setIsHoldingPose(true);
            setPoseHoldStartTime(Date.now());
            
            if (voiceFeedbackRef.current) {
              voiceFeedbackRef.current.speak("Good! Now hold this pose.");
            }
          } else if (poseHoldStartTime !== null) {
            // Continue holding the pose, update timer
            const elapsedSeconds = Math.floor((Date.now() - poseHoldStartTime) / 1000);
            const remainingTime = Math.max(0, REQUIRED_HOLD_TIME - elapsedSeconds);
            setPoseHoldTimer(remainingTime);
            
            // Check if pose has been held for the required time
            if (remainingTime === 0 && voiceFeedbackRef.current) {
              voiceFeedbackRef.current.speak("Excellent! You've held the pose for the required time.");
            }
          }
        } else if (isHoldingPose) {
          // Lost the correct pose
          setIsHoldingPose(false);
          setPoseHoldStartTime(null);
          setPoseHoldTimer(REQUIRED_HOLD_TIME);
          
          if (voiceFeedbackRef.current) {
            voiceFeedbackRef.current.speak("Try to maintain the correct pose position.");
          }
        }
        
        // Provide voice feedback if significant changes or periodically
        if (voiceEnabled && voiceFeedbackRef.current && shouldProvideVoiceFeedback(newFeedback)) {
          const now = Date.now();
          if (now - lastFeedbackTime > feedbackCooldown) {
            setLastFeedbackTime(now);
            
            if (llmFeedbackEnabled) {
              // Use LLM-powered feedback
              voiceFeedbackRef.current.speakWithLLM(
                newFeedback, 
                selectedPose, 
                selectedCategory
              );
            } else {
              // Use regular feedback
              voiceFeedbackRef.current.speak(newFeedback.overallFeedback);
            }
          }
        }
        
        // Draw pose overlay if enabled
        if (overlayEnabled && canvasRef.current) {
          drawPoseOverlay(poseData);
        }
        
        // Draw personalized pose overlay if available
        if (overlayEnabled && !useEnhancedOverlay && overlayCanvasRef.current && 
            poseOverlayServiceRef.current && poseOverlayServiceRef.current.hasPhysiqueDataForCurrentPose()) {
          try {
            drawPersonalizedPoseOverlay(poseData);
          } catch (error) {
            console.error('Error drawing personalized pose overlay:', error);
          }
        }
        
        // Draw enhanced overlay if enabled
        if (overlayEnabled && useEnhancedOverlay && enhancedOverlayCanvasRef.current && 
            enhancedOverlayServiceRef.current && enhancedOverlayServiceRef.current.hasPhysiqueDataForCurrentPose()) {
          try {
            enhancedOverlayServiceRef.current.generateOverlay(
              poseData, 
              enhancedOverlayCanvasRef.current.width, 
              enhancedOverlayCanvasRef.current.height
            );
          } catch (error) {
            console.error('Error drawing enhanced pose overlay:', error);
          }
        }
        
        // Draw enhanced muscle visualization if enabled
        if (overlayEnabled && useEnhancedMuscleVisualization && enhancedMuscleCanvasRef.current && 
            enhancedMuscleVisualizationRef.current) {
          try {
            const ctx = enhancedMuscleCanvasRef.current.getContext('2d');
            if (ctx) {
              // Set canvas dimensions to match video
              enhancedMuscleCanvasRef.current.width = videoRef.current?.videoWidth || 640;
              enhancedMuscleCanvasRef.current.height = videoRef.current?.videoHeight || 480;
              
              // Clear previous drawing
              ctx.clearRect(0, 0, enhancedMuscleCanvasRef.current.width, enhancedMuscleCanvasRef.current.height);
              
              // Define muscle groups
              const muscleGroups: MuscleGroup[] = [
                { name: 'chest', color: '#ff5500', keypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'] },
                { name: 'biceps', color: '#ff0066', keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'] },
                { name: 'triceps', color: '#cc00ff', keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'] },
                { name: 'abs', color: '#00aaff', keypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'] },
                { name: 'quads', color: '#33cc33', keypoints: ['left_hip', 'left_knee', 'left_ankle'] },
              ];
              
              // Draw the enhanced muscle visualization
              enhancedMuscleVisualizationRef.current.drawMuscleVisualization(poseData, muscleGroups);
            }
          } catch (error) {
            console.error('Error drawing enhanced muscle visualization:', error);
          }
        }
      }
      
      // Continue the detection loop
      requestAnimationFrameId.current = requestAnimationFrame(detectPose);
    } catch (err) {
      console.error('Error in pose detection:', err);
      stopCoaching();
      setError('An error occurred during pose detection. Please try again.');
    }
  };
  
  // Determine if we should provide voice feedback
  const shouldProvideVoiceFeedback = (feedback: PoseFeedback): boolean => {
    // Only provide feedback if we haven't recently given feedback
    const now = Date.now();
    if (now - lastFeedbackTime < feedbackCooldown) {
      return false;
    }
    
    // Always provide feedback for significant changes in score
    const scoreDifference = feedback.score - (lastFeedbackScore || 0);
    if (Math.abs(scoreDifference) > 10) {
      setLastFeedbackScore(feedback.score);
      return true;
    }
    
    // Provide more frequent feedback for lower scores
    if (feedback.score < 50) {
      // For poor performance, give feedback more often (every ~8-12 seconds)
      if (now - lastFeedbackTime > 8000 + Math.random() * 4000) {
        setLastFeedbackScore(feedback.score);
        return true;
      }
    } else if (feedback.score < 75) {
      // For average performance, give feedback every ~12-18 seconds
      if (now - lastFeedbackTime > 12000 + Math.random() * 6000) {
        setLastFeedbackScore(feedback.score);
        return true;
      }
    } else {
      // For good performance, give feedback less frequently (every ~15-25 seconds)
      if (now - lastFeedbackTime > 15000 + Math.random() * 10000) {
        setLastFeedbackScore(feedback.score);
        return true;
      }
    }
    
    return false;
  };
  
  // Draw pose overlay on canvas
  const drawPoseOverlay = (poseData: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    // Clear previous drawing
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Define connections (pairs of keypoints that should be connected)
      const connections = [
      // Basic skeleton
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['right_shoulder', 'right_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['right_hip', 'right_knee'],
        ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle'],
      
      // Enhanced muscle group connections
      // Chest (pectorals)
      ['left_shoulder', 'sternum'], // Upper left pec
      ['right_shoulder', 'sternum'], // Upper right pec
      ['sternum', 'solar_plexus'], // Mid-chest
      ['left_shoulder', 'solar_plexus'], // Lower left pec
      ['right_shoulder', 'solar_plexus'], // Lower right pec
      
      // Back
      ['left_shoulder', 'left_lat'], // Left upper back
      ['right_shoulder', 'right_lat'], // Right upper back
      ['left_lat', 'left_hip'], // Left lat
      ['right_lat', 'right_hip'], // Right lat
      ['left_shoulder', 'mid_spine'], // Left trapezius
      ['right_shoulder', 'mid_spine'], // Right trapezius
      ['mid_spine', 'lower_spine'], // Erector spinae
      
      // Arms
      ['left_shoulder', 'left_bicep_peak'], // Left bicep
      ['right_shoulder', 'right_bicep_peak'], // Right bicep
      ['left_bicep_peak', 'left_elbow'], // Left bicep to elbow
      ['right_bicep_peak', 'right_elbow'], // Right bicep to elbow
      ['left_elbow', 'left_tricep'], // Left tricep
      ['right_elbow', 'right_tricep'], // Right tricep
      
      // Abs
      ['solar_plexus', 'upper_abs'], // Upper abs
      ['upper_abs', 'mid_abs'], // Mid abs
      ['mid_abs', 'lower_abs'], // Lower abs
      ['upper_abs', 'left_oblique'], // Left oblique
      ['upper_abs', 'right_oblique'], // Right oblique
      ['left_oblique', 'left_hip'], // Left oblique to hip
      ['right_oblique', 'right_hip'], // Right oblique to hip
      ['left_oblique', 'left_serratus'], // Left serratus
      ['right_oblique', 'right_serratus'], // Right serratus
      ['mid_abs', 'left_serratus'], // Left serratus
      ['mid_abs', 'right_serratus'], // Right serratus
    ];
    
    // Define muscle groups for coloring
    const muscleGroups = {
      chest: [
        ['left_shoulder', 'sternum', 'solar_plexus'],
        ['right_shoulder', 'sternum', 'solar_plexus']
      ],
      back: [
        ['left_shoulder', 'left_lat', 'left_hip'],
        ['right_shoulder', 'right_lat', 'right_hip'],
        ['left_shoulder', 'mid_spine', 'lower_spine', 'right_shoulder']
      ],
      arms: [
        ['left_shoulder', 'left_bicep_peak', 'left_elbow'],
        ['right_shoulder', 'right_bicep_peak', 'right_elbow'],
        ['left_elbow', 'left_tricep', 'left_wrist'],
        ['right_elbow', 'right_tricep', 'right_wrist']
      ],
      abs: [
        ['solar_plexus', 'upper_abs', 'mid_abs', 'lower_abs'],
        ['upper_abs', 'left_oblique', 'left_hip'],
        ['upper_abs', 'right_oblique', 'right_hip']
      ],
      legs: [
        ['left_hip', 'left_quad', 'left_knee', 'left_calf', 'left_ankle'],
        ['right_hip', 'right_quad', 'right_knee', 'right_calf', 'right_ankle'],
        ['left_hip', 'left_hamstring', 'left_knee'],
        ['right_hip', 'right_hamstring', 'right_knee']
      ]
    };
    
    // Create a map to store additional keypoints that aren't provided by the model
    const additionalKeypoints = new Map();
    
    // Function to calculate or estimate positions of additional keypoints
    const calculateAdditionalKeypoints = () => {
      const keypoints = poseData.keypoints.reduce((acc: any, kp: any) => {
        acc[kp.name] = kp;
        return acc;
      }, {});
      
      // Only proceed if we have the basic keypoints
      if (!keypoints.left_shoulder || !keypoints.right_shoulder || 
          !keypoints.left_hip || !keypoints.right_hip ||
          !keypoints.left_knee || !keypoints.right_knee) {
        return;
      }
      
      // Calculate sternum (mid-point between shoulders, slightly lower)
      const sternumX = (keypoints.left_shoulder.x + keypoints.right_shoulder.x) / 2;
      const sternumY = (keypoints.left_shoulder.y + keypoints.right_shoulder.y) / 2 + 15;
      additionalKeypoints.set('sternum', { x: sternumX, y: sternumY, score: 0.8 });
      
      // Calculate solar plexus (between sternum and navel)
      const solarPlexusX = sternumX;
      const solarPlexusY = sternumY + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - sternumY) * 0.3;
      additionalKeypoints.set('solar_plexus', { x: solarPlexusX, y: solarPlexusY, score: 0.8 });
      
      // Calculate abs
      const upperAbsX = solarPlexusX;
      const upperAbsY = solarPlexusY + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - solarPlexusY) * 0.25;
      additionalKeypoints.set('upper_abs', { x: upperAbsX, y: upperAbsY, score: 0.8 });
      
      const midAbsX = upperAbsX;
      const midAbsY = upperAbsY + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - upperAbsY) * 0.5;
      additionalKeypoints.set('mid_abs', { x: midAbsX, y: midAbsY, score: 0.8 });
      
      const lowerAbsX = midAbsX;
      const lowerAbsY = midAbsY + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - midAbsY) * 0.7;
      additionalKeypoints.set('lower_abs', { x: lowerAbsX, y: lowerAbsY, score: 0.8 });
      
      // Calculate obliques
      const leftObliqueX = upperAbsX - 
        (upperAbsX - keypoints.left_hip.x) * 0.5;
      const leftObliqueY = upperAbsY + 
        (keypoints.left_hip.y - upperAbsY) * 0.3;
      additionalKeypoints.set('left_oblique', { x: leftObliqueX, y: leftObliqueY, score: 0.8 });
      
      const rightObliqueX = upperAbsX + 
        (keypoints.right_hip.x - upperAbsX) * 0.5;
      const rightObliqueY = upperAbsY + 
        (keypoints.right_hip.y - upperAbsY) * 0.3;
      additionalKeypoints.set('right_oblique', { x: rightObliqueX, y: rightObliqueY, score: 0.8 });
      
      // Calculate serratus
      const leftSerratusX = leftObliqueX - 10;
      const leftSerratusY = leftObliqueY - 15;
      additionalKeypoints.set('left_serratus', { x: leftSerratusX, y: leftSerratusY, score: 0.8 });
      
      const rightSerratusX = rightObliqueX + 10;
      const rightSerratusY = rightObliqueY - 15;
      additionalKeypoints.set('right_serratus', { x: rightSerratusX, y: rightSerratusY, score: 0.8 });
      
      // Calculate spine points
      const midSpineX = (keypoints.left_shoulder.x + keypoints.right_shoulder.x) / 2;
      const midSpineY = (keypoints.left_shoulder.y + keypoints.right_shoulder.y) / 2 + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - 
         ((keypoints.left_shoulder.y + keypoints.right_shoulder.y) / 2)) * 0.3;
      additionalKeypoints.set('mid_spine', { x: midSpineX, y: midSpineY, score: 0.8 });
      
      const lowerSpineX = midSpineX;
      const lowerSpineY = midSpineY + 
        (((keypoints.left_hip.y + keypoints.right_hip.y) / 2) - midSpineY) * 0.6;
      additionalKeypoints.set('lower_spine', { x: lowerSpineX, y: lowerSpineY, score: 0.8 });
      
      // Calculate lats
      const leftLatX = keypoints.left_shoulder.x - 
        (keypoints.left_shoulder.x - keypoints.left_hip.x) * 0.2;
      const leftLatY = keypoints.left_shoulder.y + 
        (keypoints.left_hip.y - keypoints.left_shoulder.y) * 0.3;
      additionalKeypoints.set('left_lat', { x: leftLatX, y: leftLatY, score: 0.8 });
      
      const rightLatX = keypoints.right_shoulder.x + 
        (keypoints.right_hip.x - keypoints.right_shoulder.x) * 0.2;
      const rightLatY = keypoints.right_shoulder.y + 
        (keypoints.right_hip.y - keypoints.right_shoulder.y) * 0.3;
      additionalKeypoints.set('right_lat', { x: rightLatX, y: rightLatY, score: 0.8 });
      
      // Calculate bicep peaks
      const leftBicepPeakX = keypoints.left_shoulder.x - 
        (keypoints.left_shoulder.x - keypoints.left_elbow.x) * 0.4;
      const leftBicepPeakY = keypoints.left_shoulder.y + 
        (keypoints.left_elbow.y - keypoints.left_shoulder.y) * 0.4 - 5;
      additionalKeypoints.set('left_bicep_peak', { x: leftBicepPeakX, y: leftBicepPeakY, score: 0.8 });
      
      const rightBicepPeakX = keypoints.right_shoulder.x + 
        (keypoints.right_elbow.x - keypoints.right_shoulder.x) * 0.4;
      const rightBicepPeakY = keypoints.right_shoulder.y + 
        (keypoints.right_elbow.y - keypoints.right_shoulder.y) * 0.4 - 5;
      additionalKeypoints.set('right_bicep_peak', { x: rightBicepPeakX, y: rightBicepPeakY, score: 0.8 });
      
      // Calculate triceps
      const leftTricepX = keypoints.left_elbow.x + 
        (keypoints.left_shoulder.x - keypoints.left_elbow.x) * 0.2;
      const leftTricepY = keypoints.left_elbow.y - 5;
      additionalKeypoints.set('left_tricep', { x: leftTricepX, y: leftTricepY, score: 0.8 });
      
      const rightTricepX = keypoints.right_elbow.x - 
        (keypoints.right_elbow.x - keypoints.right_shoulder.x) * 0.2;
      const rightTricepY = keypoints.right_elbow.y - 5;
      additionalKeypoints.set('right_tricep', { x: rightTricepX, y: rightTricepY, score: 0.8 });
      
      // Calculate quads
      const leftQuadX = keypoints.left_hip.x - 
        (keypoints.left_hip.x - keypoints.left_knee.x) * 0.3;
      const leftQuadY = keypoints.left_hip.y + 
        (keypoints.left_knee.y - keypoints.left_hip.y) * 0.5;
      additionalKeypoints.set('left_quad', { x: leftQuadX, y: leftQuadY, score: 0.8 });
      
      const rightQuadX = keypoints.right_hip.x + 
        (keypoints.right_knee.x - keypoints.right_hip.x) * 0.3;
      const rightQuadY = keypoints.right_hip.y + 
        (keypoints.right_knee.y - keypoints.right_hip.y) * 0.5;
      additionalKeypoints.set('right_quad', { x: rightQuadX, y: rightQuadY, score: 0.8 });
      
      // Calculate hamstrings
      const leftHamstringX = keypoints.left_hip.x - 
        (keypoints.left_hip.x - keypoints.left_knee.x) * 0.3;
      const leftHamstringY = keypoints.left_hip.y + 
        (keypoints.left_knee.y - keypoints.left_hip.y) * 0.6;
      additionalKeypoints.set('left_hamstring', { x: leftHamstringX, y: leftHamstringY, score: 0.8 });
      
      const rightHamstringX = keypoints.right_hip.x + 
        (keypoints.right_knee.x - keypoints.right_hip.x) * 0.3;
      const rightHamstringY = keypoints.right_hip.y + 
        (keypoints.right_knee.y - keypoints.right_hip.y) * 0.6;
      additionalKeypoints.set('right_hamstring', { x: rightHamstringX, y: rightHamstringY, score: 0.8 });
      
      // Calculate calves
      const leftCalfX = keypoints.left_knee.x - 
        (keypoints.left_knee.x - keypoints.left_ankle.x) * 0.3;
      const leftCalfY = keypoints.left_knee.y + 
        (keypoints.left_ankle.y - keypoints.left_knee.y) * 0.4;
      additionalKeypoints.set('left_calf', { x: leftCalfX, y: leftCalfY, score: 0.8 });
      
      const rightCalfX = keypoints.right_knee.x + 
        (keypoints.right_ankle.x - keypoints.right_knee.x) * 0.3;
      const rightCalfY = keypoints.right_knee.y + 
        (keypoints.right_ankle.y - keypoints.right_knee.y) * 0.4;
      additionalKeypoints.set('right_calf', { x: rightCalfX, y: rightCalfY, score: 0.8 });
      
      // Calculate glutes
      const leftGluteX = keypoints.left_hip.x - 10;
      const leftGluteY = keypoints.left_hip.y + 15;
      additionalKeypoints.set('left_glute', { x: leftGluteX, y: leftGluteY, score: 0.8 });
      
      const rightGluteX = keypoints.right_hip.x + 10;
      const rightGluteY = keypoints.right_hip.y + 15;
      additionalKeypoints.set('right_glute', { x: rightGluteX, y: rightGluteY, score: 0.8 });
    };
    
    // Calculate additional keypoints
    calculateAdditionalKeypoints();
    
    // Apply a semi-transparent overlay to the entire canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw muscle group areas with semi-transparent gradients
    const drawMuscleGroup = (points: string[], color: string, alpha: number = 0.3) => {
      const coords: {x: number, y: number}[] = [];
      
      // Collect all valid points
      for (const point of points) {
        let keypoint = poseData.keypoints.find((kp: any) => kp.name === point);
        
        if (!keypoint && additionalKeypoints.has(point)) {
          keypoint = additionalKeypoints.get(point);
        }
        
        if (keypoint && (keypoint.score > 0.5 || additionalKeypoints.has(point))) {
          coords.push({x: keypoint.x, y: keypoint.y});
        }
      }
      
      // Only draw if we have at least 3 points
      if (coords.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        
        for (let i = 1; i < coords.length; i++) {
          ctx.lineTo(coords[i].x, coords[i].y);
        }
        
        ctx.closePath();
        
        // Create gradient
        const gradient = ctx.createLinearGradient(
          coords[0].x, coords[0].y, 
          coords[coords.length-1].x, coords[coords.length-1].y
        );
        gradient.addColorStop(0, `${color}00`);
        gradient.addColorStop(0.5, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };
    
    // Draw muscle groups
    if (selectedPose === PoseType.FRONT_DOUBLE_BICEPS || selectedPose === PoseType.FRONT_RELAXED) {
      // Front pose muscle groups
      muscleGroups.chest.forEach(points => drawMuscleGroup(points, '#ff5500'));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.abs.forEach(points => drawMuscleGroup(points, '#00aaff'));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    } else if (selectedPose === PoseType.BACK_DOUBLE_BICEPS) {
      // Back pose muscle groups
      muscleGroups.back.forEach(points => drawMuscleGroup(points, '#ff5500'));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    } else if (selectedPose === PoseType.SIDE_CHEST || selectedPose === PoseType.SIDE_TRICEPS) {
      // Side pose muscle groups
      muscleGroups.chest.forEach(points => drawMuscleGroup(points, '#ff5500', 0.2));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.abs.forEach(points => drawMuscleGroup(points, '#00aaff', 0.2));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    }
    
    // Draw connections with smooth, gradient lines
      connections.forEach(([from, to]) => {
      let fromKeypoint = poseData.keypoints.find((kp: any) => kp.name === from);
      let toKeypoint = poseData.keypoints.find((kp: any) => kp.name === to);
      
      // If keypoint not found in original data, check additional keypoints
      if (!fromKeypoint && additionalKeypoints.has(from)) {
        fromKeypoint = additionalKeypoints.get(from);
      }
      
      if (!toKeypoint && additionalKeypoints.has(to)) {
        toKeypoint = additionalKeypoints.get(to);
      }
      
      if (fromKeypoint && toKeypoint && 
          (fromKeypoint.score > 0.5 || additionalKeypoints.has(from)) && 
          (toKeypoint.score > 0.5 || additionalKeypoints.has(to))) {
        
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(
          fromKeypoint.x, fromKeypoint.y, 
          toKeypoint.x, toKeypoint.y
        );
        
        // Set color based on body part
        let color1 = '#ffffff';
        let color2 = '#ffffff';
        
        if (from.includes('shoulder') || to.includes('shoulder') || 
            from.includes('sternum') || to.includes('sternum')) {
          // Chest/shoulder area
          color1 = '#ff5500';
          color2 = '#ffaa00';
        } else if (from.includes('bicep') || to.includes('bicep') || 
                  from.includes('tricep') || to.includes('tricep') || 
                  from.includes('elbow') || to.includes('elbow') || 
                  from.includes('wrist') || to.includes('wrist')) {
          // Arms
          color1 = '#ff0066';
          color2 = '#ff66cc';
        } else if (from.includes('abs') || to.includes('abs') || 
                  from.includes('oblique') || to.includes('oblique')) {
          // Abs
          color1 = '#00aaff';
          color2 = '#00ffff';
        } else if (from.includes('quad') || to.includes('quad') || 
                  from.includes('hamstring') || to.includes('hamstring') || 
                  from.includes('calf') || to.includes('calf') || 
                  from.includes('knee') || to.includes('knee') || 
                  from.includes('ankle') || to.includes('ankle')) {
          // Legs
          color1 = '#33cc33';
          color2 = '#99ff66';
        } else if (from.includes('spine') || to.includes('spine') || 
                  from.includes('lat') || to.includes('lat')) {
          // Back
          color1 = '#9933ff';
          color2 = '#cc99ff';
        }
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw the line with shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
          ctx.beginPath();
          ctx.moveTo(fromKeypoint.x, fromKeypoint.y);
          ctx.lineTo(toKeypoint.x, toKeypoint.y);
          ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });
    
    // Draw keypoints with glowing effect
    const drawKeypoint = (x: number, y: number, color: string, size: number = 5, label?: string) => {
      // Outer glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, `${color}ff`);
      gradient.addColorStop(0.5, `${color}88`);
      gradient.addColorStop(1, `${color}00`);
      
      ctx.fillStyle = gradient;
          ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
          ctx.fill();
      
      // Inner point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.7, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add label if provided
      if (label) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + size * 3);
      }
    };
    
    // Draw original keypoints
    poseData.keypoints.forEach((keypoint: any) => {
      if (keypoint.score > 0.5) {
        drawKeypoint(keypoint.x, keypoint.y, '#ff3300');
      }
    });
    
    // Draw additional keypoints
    additionalKeypoints.forEach((keypoint, name) => {
      let color = '#00aaff';
      
      // Color based on muscle group
      if (name.includes('bicep') || name.includes('tricep')) {
        color = '#ff0066'; // Arms
      } else if (name.includes('quad') || name.includes('hamstring') || name.includes('calf')) {
        color = '#33cc33'; // Legs
      } else if (name.includes('abs') || name.includes('oblique')) {
        color = '#00aaff'; // Abs
      } else if (name.includes('lat') || name.includes('spine')) {
        color = '#9933ff'; // Back
      } else if (name.includes('sternum') || name.includes('solar_plexus')) {
        color = '#ff5500'; // Chest
      }
      
      drawKeypoint(keypoint.x, keypoint.y, color, 4, 
        // Only show labels for major muscle groups
        (name.includes('bicep') || name.includes('tricep') || 
         name.includes('quad') || name.includes('calf') || 
         name.includes('lat') || name.includes('abs')) ? name : undefined
      );
    });
    
    // Add a legend for muscle groups
    const drawLegend = () => {
      const legendItems = [
        { color: '#ff5500', label: 'Chest' },
        { color: '#ff0066', label: 'Arms' },
        { color: '#00aaff', label: 'Abs' },
        { color: '#33cc33', label: 'Legs' },
        { color: '#9933ff', label: 'Back' }
      ];
      
      const legendX = 20;
      let legendY = 30;
      const spacing = 25;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(legendX - 10, legendY - 20, 120, spacing * legendItems.length + 10);
      
      legendItems.forEach(item => {
        // Color box
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY, 15, 15);
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, legendX + 25, legendY + 7);
        
        legendY += spacing;
      });
    };
    
    // Draw the legend
    drawLegend();
  };
  
  // Draw personalized pose overlay
  const drawPersonalizedPoseOverlay = (poseData: any) => {
    if (!overlayCanvasRef.current || !videoRef.current || !poseOverlayServiceRef.current) return;
    
    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    overlayCanvasRef.current.width = videoRef.current.videoWidth;
    overlayCanvasRef.current.height = videoRef.current.videoHeight;
    
    // Clear previous drawing
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    
    // Apply a semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    
    // Generate personalized pose overlay
    const overlay = poseOverlayServiceRef.current.generateOverlay(
      poseData, 
      overlayCanvasRef.current.width, 
      overlayCanvasRef.current.height
    );
    
    // Define muscle groups for the ideal pose
    const muscleGroups = {
      chest: [
        ['left_shoulder', 'sternum', 'solar_plexus'],
        ['right_shoulder', 'sternum', 'solar_plexus']
      ],
      back: [
        ['left_shoulder', 'left_lat', 'left_hip'],
        ['right_shoulder', 'right_lat', 'right_hip'],
        ['left_shoulder', 'mid_spine', 'lower_spine', 'right_shoulder']
      ],
      arms: [
        ['left_shoulder', 'left_bicep_peak', 'left_elbow'],
        ['right_shoulder', 'right_bicep_peak', 'right_elbow'],
        ['left_elbow', 'left_tricep', 'left_wrist'],
        ['right_elbow', 'right_tricep', 'right_wrist']
      ],
      abs: [
        ['solar_plexus', 'upper_abs', 'mid_abs', 'lower_abs'],
        ['upper_abs', 'left_oblique', 'left_hip'],
        ['upper_abs', 'right_oblique', 'right_hip']
      ],
      legs: [
        ['left_hip', 'left_quad', 'left_knee', 'left_calf', 'left_ankle'],
        ['right_hip', 'right_quad', 'right_knee', 'right_calf', 'right_ankle'],
        ['left_hip', 'left_hamstring', 'left_knee'],
        ['right_hip', 'right_hamstring', 'right_knee']
      ],
      // Additional detailed muscle groups for enhanced visualization
      deltoids: [
        ['left_shoulder', 'left_delt_front', 'left_delt_mid', 'left_delt_rear'],
        ['right_shoulder', 'right_delt_front', 'right_delt_mid', 'right_delt_rear']
      ],
      pecs: [
        ['left_shoulder', 'left_upper_pec', 'sternum', 'left_lower_pec', 'solar_plexus'],
        ['right_shoulder', 'right_upper_pec', 'sternum', 'right_lower_pec', 'solar_plexus']
      ],
      lats: [
        ['left_shoulder', 'left_lat_upper', 'left_lat_mid', 'left_lat_lower', 'left_hip'],
        ['right_shoulder', 'right_lat_upper', 'right_lat_mid', 'right_lat_lower', 'right_hip']
      ],
      traps: [
        ['left_shoulder', 'left_trap_upper', 'neck', 'right_trap_upper', 'right_shoulder'],
        ['left_shoulder', 'left_trap_mid', 'mid_spine', 'right_trap_mid', 'right_shoulder']
      ],
      quads: [
        ['left_hip', 'left_quad_outer', 'left_knee'],
        ['left_hip', 'left_quad_inner', 'left_knee'],
        ['right_hip', 'right_quad_outer', 'right_knee'],
        ['right_hip', 'right_quad_inner', 'right_knee']
      ],
      calves: [
        ['left_knee', 'left_calf_outer', 'left_ankle'],
        ['left_knee', 'left_calf_inner', 'left_ankle'],
        ['right_knee', 'right_calf_outer', 'right_ankle'],
        ['right_knee', 'right_calf_inner', 'right_ankle']
      ]
    };
    
    // Enhanced function to draw muscle groups with realistic contours and shading
    const drawMuscleGroup = (points: string[], color: string, alpha: number = 0.3) => {
      const coords: {x: number, y: number}[] = [];
      
      // Collect all valid points
      for (const point of points) {
        const keypoint = overlay.keypoints.find((kp: any) => kp.name === point);
        if (keypoint) {
          coords.push({x: keypoint.x, y: keypoint.y});
        }
      }
      
      // Only draw if we have at least 3 points
      if (coords.length >= 3) {
        // Create a path for the muscle group
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        
        // Use bezier curves for smoother, more natural muscle shapes
        for (let i = 1; i < coords.length - 1; i++) {
          const xc = (coords[i].x + coords[i+1].x) / 2;
          const yc = (coords[i].y + coords[i+1].y) / 2;
          
          // Add slight randomness for more organic look
          const randomFactor = 0.05;
          const randomX = xc + (Math.random() * 2 - 1) * randomFactor * (coords[i+1].x - coords[i].x);
          const randomY = yc + (Math.random() * 2 - 1) * randomFactor * (coords[i+1].y - coords[i].y);
          
          ctx.quadraticCurveTo(coords[i].x, coords[i].y, randomX, randomY);
        }
        
        // Complete the curve
        ctx.quadraticCurveTo(
          coords[coords.length-1].x, 
          coords[coords.length-1].y, 
          coords[0].x, 
          coords[0].y
        );
        
        ctx.closePath();
        
        // Create a more complex gradient for 3D effect
        const centerX = coords.reduce((sum, coord) => sum + coord.x, 0) / coords.length;
        const centerY = coords.reduce((sum, coord) => sum + coord.y, 0) / coords.length;
        
        // Find the farthest point from center for gradient radius
        const radius = Math.max(...coords.map(coord => 
          Math.sqrt(Math.pow(coord.x - centerX, 2) + Math.pow(coord.y - centerY, 2))
        ));
        
        // Create base muscle fill with enhanced 3D effect
        // First, draw the base muscle with a subtle gradient
        const baseColor = color.startsWith('#') ? color : `#${color}`;
        
        // Convert hex to RGB for better color manipulation
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : {r: 0, g: 0, b: 0};
        };
        
        const rgbColor = hexToRgb(baseColor);
        
        // ENHANCED: Create a more realistic base layer with depth
        // First layer: base muscle color with depth and subsurface scattering effect
        const baseGradient = ctx.createRadialGradient(
          centerX, centerY, radius * 0.1,
          centerX, centerY, radius
        );
        
        // Enhanced color stops for more realistic muscle appearance with subsurface scattering
        baseGradient.addColorStop(0, `rgba(${rgbColor.r + 40}, ${rgbColor.g + 20}, ${rgbColor.b + 20}, ${alpha + 0.4})`);
        baseGradient.addColorStop(0.4, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${alpha + 0.2})`);
        baseGradient.addColorStop(0.7, `rgba(${rgbColor.r * 0.8}, ${rgbColor.g * 0.8}, ${rgbColor.b * 0.8}, ${alpha})`);
        baseGradient.addColorStop(1, `rgba(${rgbColor.r * 0.6}, ${rgbColor.g * 0.6}, ${rgbColor.b * 0.6}, ${alpha - 0.1})`);
        
        ctx.fillStyle = baseGradient;
        ctx.fill();
        
        // ENHANCED: Add a more pronounced highlight for better 3D effect
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        
        for (let i = 1; i < coords.length - 1; i++) {
          const xc = (coords[i].x + coords[i+1].x) / 2;
          const yc = (coords[i].y + coords[i+1].y) / 2;
          ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
        }
        
        ctx.quadraticCurveTo(
          coords[coords.length-1].x, 
          coords[coords.length-1].y, 
          coords[0].x, 
          coords[0].y
        );
        
        ctx.closePath();
        
        // Create a directional gradient for better 3D effect (light from top-left)
        const lightAngle = Math.PI * 0.25; // 45 degrees
        const lightDirX = Math.cos(lightAngle);
        const lightDirY = Math.sin(lightAngle);
        
        // Calculate gradient start and end points based on light direction
        const gradientStartX = centerX - lightDirX * radius;
        const gradientStartY = centerY - lightDirY * radius;
        const gradientEndX = centerX + lightDirX * radius;
        const gradientEndY = centerY + lightDirY * radius;
        
        const highlightGradient = ctx.createLinearGradient(
          gradientStartX, gradientStartY,
          gradientEndX, gradientEndY
        );
        
        // ENHANCED: Create more pronounced highlight and shadow for stronger 3D effect
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
        highlightGradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.3})`);
        highlightGradient.addColorStop(0.7, `rgba(${rgbColor.r * 0.5}, ${rgbColor.g * 0.5}, ${rgbColor.b * 0.5}, ${alpha * 0.1})`);
        highlightGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.5})`);
        
        ctx.fillStyle = highlightGradient;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        // ENHANCED: Add more defined contour lines
        ctx.strokeStyle = `rgba(${Math.floor(rgbColor.r*0.6)}, ${Math.floor(rgbColor.g*0.6)}, ${Math.floor(rgbColor.b*0.6)}, ${alpha + 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // ENHANCED: Add more realistic muscle striations
        const drawEnhancedStriations = () => {
          // Number of striation lines based on muscle size
          const numStriations = Math.max(4, Math.min(9, Math.floor(radius / 12)));
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.lineWidth = 1;
          
          // Create a pattern of striations that follow muscle fiber direction
          // For most muscles, fibers run along the length of the muscle
          const muscleLength = Math.max(...coords.map((coord, i) => {
            const nextCoord = coords[(i + 1) % coords.length];
            return Math.sqrt(Math.pow(coord.x - nextCoord.x, 2) + Math.pow(coord.y - nextCoord.y, 2));
          }));
          
          // Determine the primary direction of the muscle
          let sumX = 0, sumY = 0;
          for (let i = 0; i < coords.length; i++) {
            const nextCoord = coords[(i + 1) % coords.length];
            sumX += nextCoord.x - coords[i].x;
            sumY += nextCoord.y - coords[i].y;
          }
          
          // Normalize the direction
          const dirLength = Math.sqrt(sumX * sumX + sumY * sumY);
          const dirX = sumX / dirLength;
          const dirY = sumY / dirLength;
          
          // Perpendicular direction for striation lines
          const perpX = -dirY;
          const perpY = dirX;
          
          for (let i = 0; i < numStriations; i++) {
            // Calculate position along muscle length
            const t = (i / (numStriations - 1)) * 0.8 + 0.1; // Keep within central 80% of muscle
            const posX = centerX + (Math.random() * 0.2 - 0.1) * radius * dirX;
            const posY = centerY + (Math.random() * 0.2 - 0.1) * radius * dirY;
            
            // Calculate striation length
            const striationLength = radius * (0.5 + Math.random() * 0.3);
            
            // Calculate start and end points
            const startX = posX - perpX * striationLength / 2;
            const startY = posY - perpY * striationLength / 2;
            const endX = posX + perpX * striationLength / 2;
            const endY = posY + perpY * striationLength / 2;
            
            // Draw curved striation line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Add curve to the striation
            const controlOffset = (Math.random() * 0.3 + 0.1) * striationLength;
            const controlX = posX + dirX * controlOffset;
            const controlY = posY + dirY * controlOffset;
            
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            
            // Use white with varying opacity for more realistic striations
            const opacity = 0.1 + Math.random() * 0.15;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.stroke();
            
            // Add a shadow striation for more depth
            ctx.beginPath();
            ctx.moveTo(startX + 1, startY + 1);
            ctx.quadraticCurveTo(controlX + 1, controlY + 1, endX + 1, endY + 1);
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
            ctx.stroke();
          }
          
          ctx.globalCompositeOperation = 'source-over';
        };
        
        // ENHANCED: Add a more realistic heatmap effect for muscle activation
        const drawEnhancedHeatmapEffect = (activationLevel = 0.7) => {
          // Create a smaller path inside the muscle for the heatmap effect
          const scaleFactor = 0.65;
          const scaledCoords = coords.map(coord => ({
            x: centerX + (coord.x - centerX) * scaleFactor,
            y: centerY + (coord.y - centerY) * scaleFactor
          }));
          
          ctx.beginPath();
          ctx.moveTo(scaledCoords[0].x, scaledCoords[0].y);
          
          for (let i = 1; i < scaledCoords.length - 1; i++) {
            const xc = (scaledCoords[i].x + scaledCoords[i+1].x) / 2;
            const yc = (scaledCoords[i].y + scaledCoords[i+1].y) / 2;
            ctx.quadraticCurveTo(scaledCoords[i].x, scaledCoords[i].y, xc, yc);
          }
          
          ctx.quadraticCurveTo(
            scaledCoords[scaledCoords.length-1].x, 
            scaledCoords[scaledCoords.length-1].y, 
            scaledCoords[0].x, 
            scaledCoords[0].y
          );
          
          ctx.closePath();
          
          // Create a heatmap gradient based on activation level
          const heatGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius * 0.65
          );
          
          // Use a color that transitions from yellow to red based on activation
          const heatR = Math.min(255, Math.floor(255 * activationLevel));
          const heatG = Math.min(255, Math.floor(255 * (1 - activationLevel * 0.7)));
          const heatB = Math.min(255, Math.floor(100 * (1 - activationLevel)));
          
          heatGradient.addColorStop(0, `rgba(${heatR}, ${heatG}, ${heatB}, ${alpha + 0.4 * activationLevel})`);
          heatGradient.addColorStop(0.6, `rgba(${heatR * 0.8}, ${heatG * 0.5}, ${heatB}, ${alpha * 0.6 * activationLevel})`);
          heatGradient.addColorStop(1, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0)`);
          
          ctx.fillStyle = heatGradient;
          ctx.globalCompositeOperation = 'overlay';
          ctx.fill();
          
          // Add a pulsing effect for active muscles
          if (activationLevel > 0.6) {
            const pulseSize = 0.6 + Math.sin(Date.now() / 500) * 0.1;
            const pulseCoords = coords.map(coord => ({
              x: centerX + (coord.x - centerX) * pulseSize,
              y: centerY + (coord.y - centerY) * pulseSize
            }));
            
            ctx.beginPath();
            ctx.moveTo(pulseCoords[0].x, pulseCoords[0].y);
            
            for (let i = 1; i < pulseCoords.length - 1; i++) {
              const xc = (pulseCoords[i].x + pulseCoords[i+1].x) / 2;
              const yc = (pulseCoords[i].y + pulseCoords[i+1].y) / 2;
              ctx.quadraticCurveTo(pulseCoords[i].x, pulseCoords[i].y, xc, yc);
            }
            
            ctx.quadraticCurveTo(
              pulseCoords[pulseCoords.length-1].x, 
              pulseCoords[pulseCoords.length-1].y, 
              pulseCoords[0].x, 
              pulseCoords[0].y
            );
            
            ctx.closePath();
            
            const pulseOpacity = 0.2 + Math.sin(Date.now() / 300) * 0.1;
            ctx.fillStyle = `rgba(255, 200, 150, ${pulseOpacity})`;
            ctx.fill();
          }
          
          ctx.globalCompositeOperation = 'source-over';
        };
        
        // Determine muscle activation level based on pose type and muscle group
        let activationLevel = 0.5; // Default activation
        
        // Set activation levels based on pose type and muscle group
        if (selectedPose === PoseType.FRONT_DOUBLE_BICEPS) {
          if (points.some(p => p.includes('bicep'))) activationLevel = 0.9;
          else if (points.some(p => p.includes('delt'))) activationLevel = 0.8;
          else if (points.some(p => p.includes('pec'))) activationLevel = 0.7;
        } else if (selectedPose === PoseType.SIDE_CHEST) {
          if (points.some(p => p.includes('pec'))) activationLevel = 0.9;
          else if (points.some(p => p.includes('delt'))) activationLevel = 0.8;
          else if (points.some(p => p.includes('tricep'))) activationLevel = 0.7;
        } else if (selectedPose === PoseType.BACK_DOUBLE_BICEPS) {
          if (points.some(p => p.includes('lat'))) activationLevel = 0.9;
          else if (points.some(p => p.includes('trap'))) activationLevel = 0.8;
          else if (points.some(p => p.includes('bicep'))) activationLevel = 0.7;
        } else if (selectedPose === PoseType.SIDE_TRICEPS) {
          if (points.some(p => p.includes('tricep'))) activationLevel = 0.9;
          else if (points.some(p => p.includes('delt'))) activationLevel = 0.7;
          else if (points.some(p => p.includes('quad'))) activationLevel = 0.8;
        }
        
        // Apply enhanced effects
        drawEnhancedStriations();
        drawEnhancedHeatmapEffect(activationLevel);
      }
    };
    
    // Draw body silhouette first (as a base layer)
    ctx.fillStyle = 'rgba(30, 30, 40, 0.4)';
    ctx.beginPath();
    
    // Draw muscle groups
    if (selectedPose === PoseType.FRONT_DOUBLE_BICEPS || selectedPose === PoseType.FRONT_RELAXED) {
      // Front pose muscle groups
      muscleGroups.chest.forEach(points => drawMuscleGroup(points, '#ff5500'));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.abs.forEach(points => drawMuscleGroup(points, '#00aaff'));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    } else if (selectedPose === PoseType.BACK_DOUBLE_BICEPS) {
      // Back pose muscle groups
      muscleGroups.back.forEach(points => drawMuscleGroup(points, '#ff5500'));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    } else if (selectedPose === PoseType.SIDE_CHEST || selectedPose === PoseType.SIDE_TRICEPS) {
      // Side pose muscle groups
      muscleGroups.chest.forEach(points => drawMuscleGroup(points, '#ff5500', 0.2));
      muscleGroups.arms.forEach(points => drawMuscleGroup(points, '#ff0066'));
      muscleGroups.abs.forEach(points => drawMuscleGroup(points, '#00aaff', 0.2));
      muscleGroups.legs.forEach(points => drawMuscleGroup(points, '#33cc33'));
    }
    
    // Draw connections with smooth, gradient lines
      connections.forEach(([from, to]) => {
      let fromKeypoint = poseData.keypoints.find((kp: any) => kp.name === from);
      let toKeypoint = poseData.keypoints.find((kp: any) => kp.name === to);
      
      // If keypoint not found in original data, check additional keypoints
      if (!fromKeypoint && additionalKeypoints.has(from)) {
        fromKeypoint = additionalKeypoints.get(from);
      }
      
      if (!toKeypoint && additionalKeypoints.has(to)) {
        toKeypoint = additionalKeypoints.get(to);
      }
      
      if (fromKeypoint && toKeypoint && 
          (fromKeypoint.score > 0.5 || additionalKeypoints.has(from)) && 
          (toKeypoint.score > 0.5 || additionalKeypoints.has(to))) {
        
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(
          fromKeypoint.x, fromKeypoint.y, 
          toKeypoint.x, toKeypoint.y
        );
        
        // Set color based on body part
        let color1 = '#ffffff';
        let color2 = '#ffffff';
        
        if (from.includes('shoulder') || to.includes('shoulder') || 
            from.includes('sternum') || to.includes('sternum')) {
          // Chest/shoulder area
          color1 = '#ff5500';
          color2 = '#ffaa00';
        } else if (from.includes('bicep') || to.includes('bicep') || 
                  from.includes('tricep') || to.includes('tricep') || 
                  from.includes('elbow') || to.includes('elbow') || 
                  from.includes('wrist') || to.includes('wrist')) {
          // Arms
          color1 = '#ff0066';
          color2 = '#ff66cc';
        } else if (from.includes('abs') || to.includes('abs') || 
                  from.includes('oblique') || to.includes('oblique')) {
          // Abs
          color1 = '#00aaff';
          color2 = '#00ffff';
        } else if (from.includes('quad') || to.includes('quad') || 
                  from.includes('hamstring') || to.includes('hamstring') || 
                  from.includes('calf') || to.includes('calf') || 
                  from.includes('knee') || to.includes('knee') || 
                  from.includes('ankle') || to.includes('ankle')) {
          // Legs
          color1 = '#33cc33';
          color2 = '#99ff66';
        } else if (from.includes('spine') || to.includes('spine') || 
                  from.includes('lat') || to.includes('lat')) {
          // Back
          color1 = '#9933ff';
          color2 = '#cc99ff';
        }
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw the line with shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
          ctx.beginPath();
          ctx.moveTo(fromKeypoint.x, fromKeypoint.y);
          ctx.lineTo(toKeypoint.x, toKeypoint.y);
          ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });
    
    // Draw keypoints with glowing effect
    const drawKeypoint = (x: number, y: number, color: string, size: number = 5, label?: string) => {
      // Create a more subtle glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, `${color}aa`);
      gradient.addColorStop(0.5, `${color}55`);
      gradient.addColorStop(1, `${color}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add label if provided
      if (label) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + size * 3);
      }
    };
    
    // Draw only key anatomical points (not all keypoints)
    const keyAnatomicalPoints = [
      'left_shoulder', 'right_shoulder', 
      'left_elbow', 'right_elbow',
      'left_hip', 'right_hip',
      'left_knee', 'right_knee'
    ];
    
    overlay.keypoints
      .filter((keypoint: any) => keyAnatomicalPoints.includes(keypoint.name))
      .forEach((keypoint: any) => {
        let color = '#ffffff';
        
        // Color based on muscle group
        if (keypoint.name.includes('shoulder')) {
          color = '#3498db'; // Shoulders
        } else if (keypoint.name.includes('elbow')) {
          color = '#9b59b6'; // Arms
        } else if (keypoint.name.includes('hip')) {
          color = '#f1c40f'; // Core
        } else if (keypoint.name.includes('knee')) {
          color = '#e74c3c'; // Legs
        }
        
        drawKeypoint(keypoint.x, keypoint.y, color, 3);
      });
    
    // Add a title for the ideal pose overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Enhanced Physique Guide', 20, 25);
    
    // Draw alignment indicators with improved visuals
    if (overlay.alignmentFeedback) {
      Object.entries(overlay.alignmentFeedback).forEach(([part, feedback]: [string, any]) => {
        if (feedback.adjustment && Math.abs(feedback.deviation) > 5) {
          const keypoint = overlay.keypoints.find((kp: any) => kp.name === part);
          if (keypoint) {
            // Draw arrow indicating direction to move
            const arrowLength = Math.min(30, Math.abs(feedback.deviation));
            const arrowWidth = 8;
            
            // Use more visible colors with glow effect
            ctx.fillStyle = feedback.deviation > 0 ? '#ff3366' : '#33ff99';
            ctx.strokeStyle = feedback.deviation > 0 ? '#ff3366' : '#33ff99';
            ctx.lineWidth = 2;
            
            // Add glow effect
            ctx.shadowColor = feedback.deviation > 0 ? '#ff3366' : '#33ff99';
            ctx.shadowBlur = 10;
            
            // Arrow direction based on adjustment type
            let angle = 0;
            if (feedback.adjustment === 'move_left') angle = Math.PI;
            else if (feedback.adjustment === 'move_right') angle = 0;
            else if (feedback.adjustment === 'move_up') angle = -Math.PI/2;
            else if (feedback.adjustment === 'move_down') angle = Math.PI/2;
            
            // Draw arrow
            ctx.save();
            ctx.translate(keypoint.x, keypoint.y);
            ctx.rotate(angle);
            
      ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(arrowLength, 0);
      ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(arrowLength, 0);
            ctx.lineTo(arrowLength - arrowWidth, -arrowWidth);
            ctx.lineTo(arrowLength - arrowWidth, arrowWidth);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
        }
      });
    }
  };
  
  // Reset the physique data and show the uploader again
  const resetPhysiqueData = () => {
    setPhysiqueData(null);
    setShowPhysiqueUploader(true);
    if (poseOverlayServiceRef.current) {
      poseOverlayServiceRef.current.setPhysiqueData({
        height: 0,
        shoulderWidth: 0,
        chestWidth: 0,
        waistWidth: 0,
        hipWidth: 0,
        armLength: 0,
        legLength: 0,
        poseKeypoints: {}
      });
    }
    
    if (enhancedOverlayServiceRef.current) {
      enhancedOverlayServiceRef.current.setPhysiqueData({
        height: 0,
        shoulderWidth: 0,
        chestWidth: 0,
        waistWidth: 0,
        hipWidth: 0,
        armLength: 0,
        legLength: 0,
        bodyFat: 12,
        muscleDefinition: 8,
        poseKeypoints: {}
      });
    }
  };
  
  // Initialize legend image
  useEffect(() => {
    if (showLegendComparison) {
      const legendImage = new Image();
      const imagePath = legendaryPoseReferences[selectedPose].image;
      console.log('Loading legend image:', imagePath);
      
      legendImage.src = imagePath;
      
      legendImage.onload = () => {
        console.log('Legend image loaded successfully');
        legendImageRef.current = legendImage;
        if (legendCanvasRef.current && legendImageRef.current) {
          const ctx = legendCanvasRef.current.getContext('2d');
          if (ctx) {
            // Set canvas dimensions to match the image aspect ratio
            const canvasWidth = legendCanvasRef.current.width;
            const canvasHeight = legendCanvasRef.current.height;
            
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Draw with proper scaling to maintain aspect ratio
            const imgAspect = legendImage.width / legendImage.height;
            const canvasAspect = canvasWidth / canvasHeight;
            
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            
            if (imgAspect > canvasAspect) {
              // Image is wider than canvas
              drawWidth = canvasWidth;
              drawHeight = canvasWidth / imgAspect;
              offsetY = (canvasHeight - drawHeight) / 2;
            } else {
              // Image is taller than canvas
              drawHeight = canvasHeight;
              drawWidth = canvasHeight * imgAspect;
              offsetX = (canvasWidth - drawWidth) / 2;
            }
            
            ctx.drawImage(
              legendImageRef.current,
              offsetX, offsetY,
              drawWidth, drawHeight
            );
          }
        }
      };
      
      legendImage.onerror = (err) => {
        console.error('Error loading legend image:', imagePath, err);
        // Try to load a fallback image
        legendImage.src = '/images/legends/placeholder.jpg';
      };
    }
  }, [showLegendComparison, selectedPose]);
  
  return (
    <div className="space-y-6">
      {showPhysiqueUploader ? (
        <PhysiqueUploader onPhysiqueProcessed={handlePhysiqueProcessed} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Camera and Overlay View */}
            <div className="flex-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Camera View</CardTitle>
                  <CardDescription>
                    Position yourself in frame and select a pose to analyze
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    {!useEnhancedOverlay && !useEnhancedMuscleVisualization && (
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    )}
                    {useEnhancedOverlay && !useEnhancedMuscleVisualization && (
                      <canvas
                        ref={enhancedOverlayCanvasRef}
                        className="absolute inset-0 w-full h-full"
                      />
                    )}
                    {useEnhancedMuscleVisualization && (
                      <canvas
                        ref={enhancedMuscleCanvasRef}
                        className="absolute inset-0 w-full h-full"
                      />
                    )}
                    
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button onClick={startCamera}>
                          Start Camera
                        </Button>
                      </div>
                    )}
                    
                    {/* Pose holding timer overlay */}
                    {isCoaching && poseHoldTimer > 0 && (
                      <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <span className="mr-2">Hold pose:</span>
                        <span className={poseHoldTimer <= 10 ? "text-destructive" : "text-primary"}>
                          {poseHoldTimer}s
                        </span>
                      </div>
                    )}
                    
                    {/* Score display */}
                    {feedback && (
                      <div className="absolute top-2 left-2 bg-background/80 px-3 py-1 rounded-full text-sm font-medium">
                        Score: <span className="text-primary">{feedback.score}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Pose controls */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isCoaching ? (
                      <Button onClick={startCoaching} className="flex-1">
                        Start Practice
                      </Button>
                    ) : (
                      <Button onClick={stopCoaching} variant="outline" className="flex-1">
                        Stop Practice
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPhysiqueUploader(true)}
                      className="flex-1"
                    >
                      Upload Physique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Settings and Feedback Panel */}
            <div className="md:w-80 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pose Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pose-type">Pose Type</Label>
                    <Select
                      value={selectedPose}
                      onValueChange={(value) => setSelectedPose(value as PoseType)}
                    >
                      <SelectTrigger id="pose-type">
                        <SelectValue placeholder="Select a pose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PoseType.FRONT_RELAXED}>Front Relaxed</SelectItem>
                        <SelectItem value={PoseType.FRONT_DOUBLE_BICEPS}>Front Double Biceps</SelectItem>
                        <SelectItem value={PoseType.SIDE_CHEST}>Side Chest</SelectItem>
                        <SelectItem value={PoseType.BACK_DOUBLE_BICEPS}>Back Double Biceps</SelectItem>
                        <SelectItem value={PoseType.SIDE_TRICEPS}>Side Triceps</SelectItem>
                        <SelectItem value={PoseType.ABDOMINAL_AND_THIGH}>Abdominal and Thigh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competition-category">Competition Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => setSelectedCategory(value as CompetitionCategory)}
                    >
                      <SelectTrigger id="competition-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CompetitionCategory.MENS_PHYSIQUE}>Men's Physique</SelectItem>
                        <SelectItem value={CompetitionCategory.CLASSIC_PHYSIQUE}>Classic Physique</SelectItem>
                        <SelectItem value={CompetitionCategory.MENS_OPEN}>Men's Open</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    className="w-full mt-2"
                    onClick={() => openVideoTutorial(selectedPose)}
                  >
                    Video Tutorial
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Settings content */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="voice-feedback">Voice Feedback</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive audio guidance
                      </p>
                    </div>
                    <Switch
                      id="voice-feedback"
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pose-overlay">Pose Overlay</Label>
                      <p className="text-sm text-muted-foreground">
                        Show visual guides
                      </p>
                    </div>
                    <Switch
                      id="pose-overlay"
                      checked={overlayEnabled}
                      onCheckedChange={setOverlayEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enhanced-overlay">Enhanced Visualization</Label>
                      <p className="text-sm text-muted-foreground">
                        Use advanced 3D-like muscle visualization
                      </p>
                    </div>
                    <Switch
                      id="enhanced-overlay"
                      checked={useEnhancedOverlay}
                      onCheckedChange={(checked) => {
                        setUseEnhancedOverlay(checked);
                        if (checked) {
                          setUseEnhancedMuscleVisualization(false);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="muscle-visualization">Heatmap Muscle Overlay</Label>
                      <p className="text-sm text-muted-foreground">
                        Show realistic muscle activation heatmap
                      </p>
                    </div>
                    <Switch
                      id="muscle-visualization"
                      checked={useEnhancedMuscleVisualization}
                      onCheckedChange={(checked) => {
                        setUseEnhancedMuscleVisualization(checked);
                        if (checked) {
                          setUseEnhancedOverlay(false);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Feedback Display */}
          {feedback && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Pose Feedback</CardTitle>
                <CardDescription>
                  Analysis of your {selectedPose.replace(/_/g, ' ').toLowerCase()} pose
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium">Overall Score</h3>
                    <span className="text-lg font-medium">{feedback.score}/100</span>
                  </div>
                  <Progress value={feedback.score} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Alignment</h4>
                    <Progress value={feedback.alignmentScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{feedback.alignmentScore}/100</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Symmetry</h4>
                    <Progress value={feedback.symmetryScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{feedback.symmetryScore}/100</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Muscle Engagement</h4>
                    <Progress value={feedback.muscleEngagementScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{feedback.muscleEngagementScore}/100</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Feedback</h3>
                  <p>{feedback.overallFeedback}</p>
                  
                  <h4 className="text-md font-medium mt-2">Improvement Tips</h4>
                  <p>{feedback.improvementTips}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Legend Comparison Toggle */}
          <div className="mt-6 mb-4 flex items-center">
            <Switch
              id="legend-comparison"
              checked={showLegendComparison}
              onCheckedChange={setShowLegendComparison}
            />
            <Label htmlFor="legend-comparison" className="ml-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Compare with Legend</span>
            </Label>
          </div>
          
          {/* Legend Comparison View */}
          {showLegendComparison && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legend Comparison</CardTitle>
                  <CardDescription>
                    Compare your pose with a professional example
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 aspect-video relative bg-black rounded-md overflow-hidden">
                      <canvas
                        ref={legendCanvasRef}
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 