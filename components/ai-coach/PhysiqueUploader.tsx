'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { PhysiqueData } from '@/lib/ai-coach/pose-overlay-service';
import { Progress } from '@/components/ui/progress';
import { Upload, ImagePlus, X, Check } from 'lucide-react';

interface PhysiqueUploaderProps {
  onPhysiqueProcessed: (data: PhysiqueData) => void;
}

export function PhysiqueUploader({ onPhysiqueProcessed }: PhysiqueUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Generate preview URLs
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Process the uploaded physique data
  const processPhysique = async () => {
    if (files.length === 0) {
      setStatus('Please upload at least one physique photo.');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setStatus('Analyzing your physique...');

    try {
      // Simulate processing with a delay
      // In a real implementation, this would use TensorFlow.js or a similar library
      // to analyze the images and extract body measurements and keypoints
      
      // Simulate progress updates
      const totalSteps = 5;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(Math.floor((step / totalSteps) * 100));
        
        switch (step) {
          case 1:
            setStatus('Detecting body landmarks...');
            break;
          case 2:
            setStatus('Measuring proportions...');
            break;
          case 3:
            setStatus('Generating pose keypoints...');
            break;
          case 4:
            setStatus('Creating personalized overlays...');
            break;
          case 5:
            setStatus('Finalizing your profile...');
            break;
        }
      }

      // Generate mock data for demonstration
      // In a real implementation, this would be the result of the image analysis
      const mockPhysiqueData: PhysiqueData = {
        height: 180, // cm
        shoulderWidth: 50, // cm
        chestWidth: 110, // cm
        waistWidth: 80, // cm
        hipWidth: 95, // cm
        armLength: 75, // cm
        legLength: 95, // cm,
        poseKeypoints: {
          [PoseType.FRONT_RELAXED]: generateMockKeypoints(PoseType.FRONT_RELAXED),
          [PoseType.FRONT_DOUBLE_BICEPS]: generateMockKeypoints(PoseType.FRONT_DOUBLE_BICEPS),
          [PoseType.SIDE_CHEST]: generateMockKeypoints(PoseType.SIDE_CHEST),
          [PoseType.BACK_DOUBLE_BICEPS]: generateMockKeypoints(PoseType.BACK_DOUBLE_BICEPS),
          [PoseType.SIDE_TRICEPS]: generateMockKeypoints(PoseType.SIDE_TRICEPS),
          [PoseType.ABDOMINAL_AND_THIGH]: generateMockKeypoints(PoseType.ABDOMINAL_AND_THIGH),
        }
      };

      // Wait a moment before completing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call the callback with the processed data
      onPhysiqueProcessed(mockPhysiqueData);
      
      // Clean up previews to avoid memory leaks
      previews.forEach(preview => URL.revokeObjectURL(preview));
      
    } catch (error) {
      console.error('Error processing physique data:', error);
      setStatus('An error occurred while processing your photos. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Generate mock keypoints for demonstration
  // In a real implementation, these would be extracted from the images
  const generateMockKeypoints = (poseType: PoseType) => {
    // Basic keypoint structure for a generic pose
    // These would be normalized coordinates (0-1) that can be scaled to any canvas size
    const baseKeypoints = [
      { name: 'nose', x: 0.5, y: 0.1 },
      { name: 'left_eye', x: 0.45, y: 0.09 },
      { name: 'right_eye', x: 0.55, y: 0.09 },
      { name: 'left_ear', x: 0.4, y: 0.1 },
      { name: 'right_ear', x: 0.6, y: 0.1 },
      { name: 'left_shoulder', x: 0.35, y: 0.2 },
      { name: 'right_shoulder', x: 0.65, y: 0.2 },
      { name: 'left_elbow', x: 0.25, y: 0.35 },
      { name: 'right_elbow', x: 0.75, y: 0.35 },
      { name: 'left_wrist', x: 0.2, y: 0.45 },
      { name: 'right_wrist', x: 0.8, y: 0.45 },
      { name: 'left_hip', x: 0.4, y: 0.55 },
      { name: 'right_hip', x: 0.6, y: 0.55 },
      { name: 'left_knee', x: 0.4, y: 0.75 },
      { name: 'right_knee', x: 0.6, y: 0.75 },
      { name: 'left_ankle', x: 0.4, y: 0.9 },
      { name: 'right_ankle', x: 0.6, y: 0.9 },
      
      // Add enhanced visualization keypoints
      // Torso keypoints
      { name: 'sternum', x: 0.5, y: 0.25 },
      { name: 'solar_plexus', x: 0.5, y: 0.35 },
      { name: 'upper_abs', x: 0.5, y: 0.4 },
      { name: 'mid_abs', x: 0.5, y: 0.45 },
      { name: 'lower_abs', x: 0.5, y: 0.5 },
      { name: 'neck', x: 0.5, y: 0.15 },
      
      // Left side muscle keypoints
      { name: 'left_bicep_peak', x: 0.3, y: 0.25 },
      { name: 'left_tricep_peak', x: 0.28, y: 0.3 },
      { name: 'left_delt_front', x: 0.4, y: 0.18 },
      { name: 'left_delt_mid', x: 0.35, y: 0.17 },
      { name: 'left_delt_rear', x: 0.32, y: 0.19 },
      { name: 'left_lat_upper', x: 0.37, y: 0.25 },
      { name: 'left_lat_mid', x: 0.38, y: 0.35 },
      { name: 'left_lat_lower', x: 0.39, y: 0.45 },
      { name: 'left_serratus', x: 0.38, y: 0.3 },
      { name: 'left_oblique', x: 0.42, y: 0.45 },
      { name: 'left_quad', x: 0.4, y: 0.65 },
      { name: 'left_hamstring', x: 0.38, y: 0.65 },
      { name: 'left_calf', x: 0.38, y: 0.82 },
      { name: 'left_trap_upper', x: 0.45, y: 0.15 },
      
      // Right side muscle keypoints
      { name: 'right_bicep_peak', x: 0.7, y: 0.25 },
      { name: 'right_tricep_peak', x: 0.72, y: 0.3 },
      { name: 'right_delt_front', x: 0.6, y: 0.18 },
      { name: 'right_delt_mid', x: 0.65, y: 0.17 },
      { name: 'right_delt_rear', x: 0.68, y: 0.19 },
      { name: 'right_lat_upper', x: 0.63, y: 0.25 },
      { name: 'right_lat_mid', x: 0.62, y: 0.35 },
      { name: 'right_lat_lower', x: 0.61, y: 0.45 },
      { name: 'right_serratus', x: 0.62, y: 0.3 },
      { name: 'right_oblique', x: 0.58, y: 0.45 },
      { name: 'right_quad', x: 0.6, y: 0.65 },
      { name: 'right_hamstring', x: 0.62, y: 0.65 },
      { name: 'right_calf', x: 0.62, y: 0.82 },
      { name: 'right_trap_upper', x: 0.55, y: 0.15 }
    ];

    // Adjust keypoints based on pose type
    switch (poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        return baseKeypoints.map(kp => {
          if (kp.name === 'left_elbow') return { ...kp, x: 0.2, y: 0.3 };
          if (kp.name === 'right_elbow') return { ...kp, x: 0.8, y: 0.3 };
          if (kp.name === 'left_wrist') return { ...kp, x: 0.15, y: 0.15 };
          if (kp.name === 'right_wrist') return { ...kp, x: 0.85, y: 0.15 };
          if (kp.name === 'left_bicep_peak') return { ...kp, x: 0.25, y: 0.22 };
          if (kp.name === 'right_bicep_peak') return { ...kp, x: 0.75, y: 0.22 };
          if (kp.name === 'left_delt_front') return { ...kp, x: 0.38, y: 0.17 };
          if (kp.name === 'right_delt_front') return { ...kp, x: 0.62, y: 0.17 };
          if (kp.name === 'left_lat_upper') return { ...kp, x: 0.36, y: 0.23 };
          if (kp.name === 'right_lat_upper') return { ...kp, x: 0.64, y: 0.23 };
          return kp;
        });
      
      case PoseType.SIDE_CHEST:
        return baseKeypoints.map(kp => {
          // Adjust for side pose (assuming right side facing camera)
          if (kp.name.includes('left')) {
            return { ...kp, x: kp.x - 0.1 }; // Move left side points slightly behind
          }
          if (kp.name === 'right_elbow') return { ...kp, x: 0.4, y: 0.35 };
          if (kp.name === 'right_wrist') return { ...kp, x: 0.3, y: 0.25 };
          if (kp.name === 'right_bicep_peak') return { ...kp, x: 0.45, y: 0.25 };
          if (kp.name === 'sternum') return { ...kp, x: 0.45, y: 0.25 };
          if (kp.name === 'upper_pec') return { ...kp, x: 0.48, y: 0.22 };
          if (kp.name === 'lower_pec') return { ...kp, x: 0.5, y: 0.3 };
          if (kp.name === 'serratus') return { ...kp, x: 0.52, y: 0.32 };
          if (kp.name === 'shoulder') return { ...kp, x: 0.55, y: 0.2 };
          if (kp.name === 'tricep_peak') return { ...kp, x: 0.6, y: 0.3 };
          if (kp.name === 'quad') return { ...kp, x: 0.55, y: 0.65 };
          if (kp.name === 'hip') return { ...kp, x: 0.55, y: 0.55 };
          return kp;
        });
      
      case PoseType.BACK_DOUBLE_BICEPS:
        return baseKeypoints.map(kp => {
          // Flip horizontal for back pose
          const flippedKp = { ...kp, x: 1 - kp.x };
          
          // Adjust specific points for back double biceps
          if (kp.name === 'left_bicep_peak') return { ...flippedKp, x: 0.75, y: 0.22 };
          if (kp.name === 'right_bicep_peak') return { ...flippedKp, x: 0.25, y: 0.22 };
          if (kp.name === 'left_lat_upper') return { ...flippedKp, x: 0.64, y: 0.23 };
          if (kp.name === 'right_lat_upper') return { ...flippedKp, x: 0.36, y: 0.23 };
          if (kp.name === 'left_lat_mid') return { ...flippedKp, x: 0.62, y: 0.35 };
          if (kp.name === 'right_lat_mid') return { ...flippedKp, x: 0.38, y: 0.35 };
          if (kp.name === 'left_lat_lower') return { ...flippedKp, x: 0.61, y: 0.45 };
          if (kp.name === 'right_lat_lower') return { ...flippedKp, x: 0.39, y: 0.45 };
          if (kp.name === 'left_trap_upper') return { ...flippedKp, x: 0.55, y: 0.15 };
          if (kp.name === 'right_trap_upper') return { ...flippedKp, x: 0.45, y: 0.15 };
          
          return flippedKp;
        });
      
      case PoseType.SIDE_TRICEPS:
        return baseKeypoints.map(kp => {
          // Adjust for side triceps pose
          if (kp.name.includes('left')) {
            return { ...kp, x: kp.x - 0.15 }; // Move left side points further behind
          }
          if (kp.name === 'right_elbow') return { ...kp, x: 0.55, y: 0.4 };
          if (kp.name === 'right_wrist') return { ...kp, x: 0.4, y: 0.55 };
          if (kp.name === 'tricep_peak') return { ...kp, x: 0.6, y: 0.35 };
          if (kp.name === 'shoulder') return { ...kp, x: 0.55, y: 0.2 };
          if (kp.name === 'delt_mid') return { ...kp, x: 0.58, y: 0.18 };
          if (kp.name === 'quad') return { ...kp, x: 0.55, y: 0.65 };
          if (kp.name === 'hamstring') return { ...kp, x: 0.6, y: 0.65 };
          if (kp.name === 'hip') return { ...kp, x: 0.55, y: 0.55 };
          return kp;
        });
      
      case PoseType.ABDOMINAL_AND_THIGH:
        return baseKeypoints.map(kp => {
          if (kp.name === 'left_elbow') return { ...kp, x: 0.3, y: 0.4 };
          if (kp.name === 'right_elbow') return { ...kp, x: 0.7, y: 0.4 };
          if (kp.name === 'left_wrist') return { ...kp, x: 0.4, y: 0.5 };
          if (kp.name === 'right_wrist') return { ...kp, x: 0.6, y: 0.5 };
          if (kp.name === 'left_knee') return { ...kp, x: 0.35, y: 0.8 };
          if (kp.name === 'right_knee') return { ...kp, x: 0.65, y: 0.8 };
          if (kp.name === 'upper_abs') return { ...kp, x: 0.5, y: 0.38 };
          if (kp.name === 'mid_abs') return { ...kp, x: 0.5, y: 0.43 };
          if (kp.name === 'lower_abs') return { ...kp, x: 0.5, y: 0.48 };
          if (kp.name === 'left_oblique') return { ...kp, x: 0.43, y: 0.43 };
          if (kp.name === 'right_oblique') return { ...kp, x: 0.57, y: 0.43 };
          if (kp.name === 'left_quad') return { ...kp, x: 0.38, y: 0.65 };
          if (kp.name === 'right_quad') return { ...kp, x: 0.62, y: 0.65 };
          return kp;
        });
      
      case PoseType.FRONT_RELAXED:
      default:
        return baseKeypoints;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Personalized Pose Overlay</CardTitle>
        <CardDescription>
          Upload photos of your physique to get personalized pose overlays that match your body proportions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File upload area */}
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Your Physique Photos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your photos here, or click to browse
          </p>
          <Button variant="outline" onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}>
            <ImagePlus className="h-4 w-4 mr-2" />
            Select Photos
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-muted-foreground mt-4">
            For best results, include front, side, and back views of your physique
          </p>
        </div>

        {/* Preview area */}
        {previews.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                  <img 
                    src={preview} 
                    alt={`Physique preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white hover:bg-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing status */}
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{status}</span>
              <span className="text-sm">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
          <h4 className="font-medium">Tips for Best Results:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Include front, side, and back views</li>
            <li>Wear fitted clothing that shows your physique clearly</li>
            <li>Stand in good lighting with a neutral background</li>
            <li>Try to capture your full body in the frame</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onPhysiqueProcessed({
            height: 180,
            shoulderWidth: 50,
            chestWidth: 110,
            waistWidth: 80,
            hipWidth: 95,
            armLength: 75,
            legLength: 95,
            poseKeypoints: {}
          })}>
            Skip for Now
          </Button>
          <Button 
            variant="secondary"
            onClick={() => {
              window.open('https://www.youtube.com/watch?v=iHWKxQfKY8Q', '_blank');
            }}
          >
            Video Tutorial
          </Button>
        </div>
        <Button 
          onClick={processPhysique} 
          disabled={processing || files.length === 0}
        >
          {processing ? (
            <>Processing...</>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Process Photos
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 