'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { referencePosesService } from '@/lib/ai-coach/reference-poses';
import { poseComparisonService } from '@/lib/ai-coach/pose-comparison-service';
import { PoseComparisonResult as PoseComparisonResultType } from '@/lib/ai-coach/densepose-comparison';
import { BodybuilderReferencePose } from '@/lib/ai-coach/densepose-comparison';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PoseComparisonResult } from '@/components/ai-coach/PoseComparisonResult';

export default function PoseComparisonPage() {
  // State for user image
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for video
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for reference poses
  const [selectedPoseType, setSelectedPoseType] = useState<PoseType | null>(null);
  const [referencePoses, setReferencePoses] = useState<BodybuilderReferencePose[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  
  // State for comparison results
  const [comparisonResult, setComparisonResult] = useState<PoseComparisonResultType | null>(null);
  const [selectedReferencePose, setSelectedReferencePose] = useState<BodybuilderReferencePose | null>(null);

  // Initialize reference poses
  useEffect(() => {
    const poses = referencePosesService.getAllReferencePoses();
    setReferencePoses(poses);
    
    if (poses.length > 0) {
      setSelectedReferenceId(poses[0].id);
      setSelectedReferencePose(poses[0]);
    }
  }, []);
  
  // Update reference poses when pose type changes
  useEffect(() => {
    if (selectedPoseType) {
      const filteredPoses = referencePosesService.getReferencePosesByType(selectedPoseType);
      setReferencePoses(filteredPoses);
      
      if (filteredPoses.length > 0) {
        setSelectedReferenceId(filteredPoses[0].id);
        setSelectedReferencePose(filteredPoses[0]);
      }
    } else {
      const allPoses = referencePosesService.getAllReferencePoses();
      setReferencePoses(allPoses);
    }
  }, [selectedPoseType]);
  
  // Update selected reference pose when ID changes
  useEffect(() => {
    if (selectedReferenceId) {
      const pose = referencePosesService.getReferenceById(selectedReferenceId);
      if (pose) {
        setSelectedReferencePose(pose);
      }
    }
  }, [selectedReferenceId]);
  
  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setProcessingImage(true);
    setError(null);
    
    try {
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setUserImageUrl(imageUrl);
      
      if (selectedReferenceId) {
        const result = await poseComparisonService.compareWithReferencePose(
          imageUrl,
          selectedReferenceId
        );
        
        if (result) {
          setComparisonResult(result);
        } else {
          setError('Failed to compare poses. Please try a different image or pose.');
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError('An error occurred while processing the image.');
    } finally {
      setProcessingImage(false);
    }
  };
  
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };
  
  // Capture image from camera
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    setProcessingImage(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg'));
        
        // Create URL for the blob
        const imageUrl = URL.createObjectURL(blob);
        setUserImageUrl(imageUrl);
        
        if (selectedReferenceId) {
          const result = await poseComparisonService.compareWithReferencePose(
            imageUrl,
            selectedReferenceId
          );
          
          if (result) {
            setComparisonResult(result);
          } else {
            setError('Failed to compare poses. Please try a different image or pose.');
          }
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('An error occurred while capturing the image.');
    } finally {
      setProcessingImage(false);
    }
  };
  
  // Find best matching pose
  const findBestMatchingPose = async () => {
    if (!userImageUrl) return;
    
    setProcessingImage(true);
    setError(null);
    
    try {
      const result = await poseComparisonService.findBestMatchingPose(
        userImageUrl,
        selectedPoseType || undefined
      );
      
      if (result) {
        setComparisonResult(result.comparisonResult);
        setSelectedReferenceId(result.referencePose);
        
        const pose = referencePosesService.getReferenceById(result.referencePose);
        if (pose) {
          setSelectedReferencePose(pose);
        }
      } else {
        setError('Failed to find matching pose. Please try a different image.');
      }
    } catch (error) {
      console.error('Error finding best matching pose:', error);
      setError('An error occurred while finding the best matching pose.');
    } finally {
      setProcessingImage(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Bodybuilding Pose Comparison</h1>
      <p className="text-gray-600">
        Compare your poses with professional bodybuilders and get feedback on your form
      </p>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="camera">Use Camera</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload your pose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full"
                  disabled={processingImage}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="camera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Use your camera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!cameraActive ? (
                  <Button onClick={startCamera} disabled={processingImage}>
                    Start Camera
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={captureImage} disabled={processingImage}>
                        Capture and Compare
                      </Button>
                      <Button variant="secondary" onClick={stopCamera} disabled={processingImage}>
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reference pose selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Reference Pose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Pose Type</label>
              <Select
                onValueChange={(value) => setSelectedPoseType(value === 'all' ? null : value as PoseType)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Pose Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pose Types</SelectItem>
                  {Object.values(PoseType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Reference Pose</label>
              <Select
                value={selectedReferenceId || ''}
                onValueChange={setSelectedReferenceId}
                disabled={referencePoses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reference pose" />
                </SelectTrigger>
                <SelectContent>
                  {referencePoses.map((pose) => (
                    <SelectItem key={pose.id} value={pose.id}>
                      {pose.bodybuilder} - {pose.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedReferencePose && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">
                  {selectedReferencePose.bodybuilder} - {selectedReferencePose.name}
                </h3>
                <div className="relative w-full h-[300px] bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={selectedReferencePose.imageUrl}
                    alt={`${selectedReferencePose.bodybuilder} ${selectedReferencePose.name}`}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Era: {selectedReferencePose.era}
                </p>
              </div>
            )}
            
            {userImageUrl && (
              <Button 
                onClick={findBestMatchingPose} 
                className="w-full mt-4"
                disabled={processingImage || !userImageUrl}
              >
                Find Best Matching Pose
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* User image and results */}
        <Card>
          <CardHeader>
            <CardTitle>Your Pose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userImageUrl ? (
              <div className="space-y-4">
                <div className="relative w-full h-[300px] bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={userImageUrl}
                    alt="Your pose"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                {processingImage && (
                  <div className="text-center py-4">
                    <p>Processing image...</p>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 py-2">
                    {error}
                  </div>
                )}
                
                {comparisonResult && selectedReferencePose && (
                  <PoseComparisonResult
                    comparisonResult={comparisonResult}
                    userImageUrl={userImageUrl}
                    referencePose={selectedReferencePose}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-100 rounded-md">
                <p className="text-gray-500">
                  Upload an image or use your camera to compare poses
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 