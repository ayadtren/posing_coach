'use client';

import React, { useEffect, useRef } from 'react';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { PoseData } from '@/lib/ai-coach/vision-provider';
import { EnhancedMuscleVisualization, MuscleGroup } from '@/lib/ai-coach/enhanced-muscle-visualization';

interface EnhancedMuscleOverlayProps {
  poseData: PoseData | null;
  poseType: PoseType;
  width: number;
  height: number;
  className?: string;
}

// Define muscle groups for different pose types
const MUSCLE_GROUPS: Record<PoseType, MuscleGroup[]> = {
  [PoseType.FRONT_RELAXED]: [
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_elbow', 'left_ear', 'neck']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'right_ear', 'neck']
    },
    {
      name: 'biceps',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist']
    },
    {
      name: 'biceps',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'right_wrist']
    },
    {
      name: 'abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_shoulder', 'left_shoulder']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    }
  ],
  [PoseType.FRONT_DOUBLE_BICEPS]: [
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_elbow', 'left_ear', 'neck']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'right_ear', 'neck']
    },
    {
      name: 'biceps',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist']
    },
    {
      name: 'biceps',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'right_wrist']
    },
    {
      name: 'abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_shoulder', 'left_shoulder']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    }
  ],
  [PoseType.SIDE_CHEST]: [
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_elbow', 'left_ear', 'neck']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'right_ear', 'neck']
    },
    {
      name: 'triceps',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'right_wrist']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['left_knee', 'left_ankle', 'left_foot_index']
    }
  ],
  [PoseType.BACK_DOUBLE_BICEPS]: [
    {
      name: 'back',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_knee']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_knee']
    },
    {
      name: 'shoulders',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_elbow', 'left_ear', 'neck']
    },
    {
      name: 'shoulders',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'right_ear', 'neck']
    },
    {
      name: 'biceps',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'left_elbow', 'left_wrist']
    },
    {
      name: 'biceps',
      color: '#d3c15f',
      keypoints: ['right_shoulder', 'right_elbow', 'right_wrist']
    },
    {
      name: 'glutes',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'right_hip', 'right_knee', 'left_knee']
    },
    {
      name: 'hamstrings',
      color: '#d35f9c',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'hamstrings',
      color: '#d35f9c',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    }
  ],
  [PoseType.SIDE_TRICEPS]: [
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'shoulders',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'right_ear', 'neck']
    },
    {
      name: 'triceps',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'right_wrist']
    },
    {
      name: 'abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_shoulder', 'left_shoulder']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    },
    {
      name: 'hamstrings',
      color: '#d35f9c',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    }
  ],
  [PoseType.ABDOMINAL_AND_THIGH]: [
    {
      name: 'abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_shoulder', 'left_shoulder']
    },
    {
      name: 'obliques',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_hip', 'left_knee']
    },
    {
      name: 'obliques',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_hip', 'right_knee']
    },
    {
      name: 'serratus',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'serratus',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'quads',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    },
    {
      name: 'adductors',
      color: '#d35f9c',
      keypoints: ['left_hip', 'right_hip', 'right_knee', 'left_knee']
    }
  ]
};

export function EnhancedMuscleOverlay({ poseData, poseType, width, height, className = '' }: EnhancedMuscleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizationRef = useRef<EnhancedMuscleVisualization | null>(null);
  
  // Initialize the visualization service
  useEffect(() => {
    if (!visualizationRef.current) {
      visualizationRef.current = new EnhancedMuscleVisualization();
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        visualizationRef.current.initialize(ctx);
      }
    }
    
    return () => {
      // No cleanup needed as we don't have a dispose method
    };
  }, []);
  
  // Update the pose type when it changes
  useEffect(() => {
    if (visualizationRef.current) {
      visualizationRef.current.setPoseType(poseType);
    }
  }, [poseType]);
  
  // Draw the visualization when pose data changes
  useEffect(() => {
    if (!canvasRef.current || !visualizationRef.current || !poseData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the muscle visualization
    const muscleGroups = MUSCLE_GROUPS[poseType] || [];
    visualizationRef.current.drawMuscleVisualization(poseData, muscleGroups);
    
  }, [poseData, poseType]);
  
  // Update canvas dimensions when width/height change
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
} 