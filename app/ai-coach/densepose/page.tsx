'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DensePoseVisualizer from '@/components/ai-coach/DensePoseVisualizer';
import { DensePoseClient, DensePoseResult } from '@/lib/ai-coach/densepose-client';

export default function DensePosePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [densePoseData, setDensePoseData] = useState<DensePoseResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const densePoseClient = new DensePoseClient();
  
  // Check if service is running
  useEffect(() => {
    const checkService = async () => {
      try {
        const isHealthy = await densePoseClient.checkHealth();
        if (!isHealthy) {
          setError("DensePose service is not available. Please start the service.");
        }
      } catch (err) {
        setError("Failed to connect to DensePose service.");
      }
    };
    
    checkService();
  }, []);
  
  // Handle file upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImageUrl(dataUrl);
        
        try {
          // Analyze with DensePose
          const result = await densePoseClient.analyzeImage(dataUrl);
          if ('error' in result) {
            setError(result.error);
          } else {
            setDensePoseData(result);
          }
        } catch (err) {
          setError("Error analyzing image with DensePose.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading image file.");
      setIsLoading(false);
    }
  };
  
  // Start camera
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported by your browser.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      setError("Failed to access camera: " + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // Capture image from camera
  const captureImage = async () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageUrl(dataUrl);
        
        // Analyze with DensePose
        const result = await densePoseClient.analyzeImage(dataUrl);
        if ('error' in result) {
          setError(result.error);
        } else {
          setDensePoseData(result);
        }
      }
    } catch (err) {
      setError("Error capturing or analyzing image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">DensePose Body Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload or Capture Image</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={() => fileInputRef.current?.click()}>
                Upload Image
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              <Button 
                onClick={cameraActive ? captureImage : startCamera}
                variant={cameraActive ? "default" : "outline"}
              >
                {cameraActive ? "Capture" : "Use Camera"}
              </Button>
            </div>
            
            {cameraActive && (
              <div className="relative border rounded overflow-hidden">
                <video 
                  ref={videoRef} 
                  className="w-full"
                  autoPlay 
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </Card>
        
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : imageUrl ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Original Image</h2>
              <img 
                src={imageUrl} 
                alt="Uploaded" 
                className="max-w-full rounded border"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100 rounded p-8">
              <p className="text-slate-500 text-center">
                Upload an image or use your camera to analyze body posture and muscle groups with DensePose
              </p>
            </div>
          )}
        </div>
      </div>
      
      {densePoseData && !isLoading && (
        <div className="mt-8">
          <DensePoseVisualizer 
            originalImage={imageUrl!}
            densePoseData={densePoseData}
            width={640}
            height={480}
          />
        </div>
      )}
    </div>
  );
} 