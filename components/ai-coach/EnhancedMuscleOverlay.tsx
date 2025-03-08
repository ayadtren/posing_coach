'use client';

import React, { useEffect, useRef } from 'react';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { PoseData } from '@/lib/ai-coach/vision-provider';
import { EnhancedMuscleVisualization, MuscleGroup, MuscleGroupData } from '@/lib/ai-coach/enhanced-muscle-visualization';

interface EnhancedMuscleOverlayProps {
  poseData: PoseData | null;
  poseType: PoseType;
  width: number;
  height: number;
  className?: string;
}

interface MuscleGroupOverlay {
  name: string;
  color: string;
  keypoints: string[];
}

// Define muscle groups for different pose types
const MUSCLE_GROUPS: Record<PoseType, MuscleGroupOverlay[]> = {
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_elbow', 'neck', 'left_ear']
    },
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'neck', 'right_ear']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'forearms',
      color: '#5fd3bc',
      keypoints: ['left_elbow', 'left_wrist', 'left_index']
    },
    {
      name: 'forearms',
      color: '#5fd3bc',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
    },
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_elbow', 'neck', 'left_ear']
    },
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'neck', 'right_ear']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'pecs',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'obliques',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'left_hip', 'left_knee']
    },
    {
      name: 'hamstrings',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'traps',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
    },
    {
      name: 'rear_delts',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_elbow', 'neck']
    },
    {
      name: 'rear_delts',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'neck']
    },
    {
      name: 'forearms',
      color: '#d3c15f',
      keypoints: ['left_elbow', 'left_wrist', 'left_index']
    },
    {
      name: 'forearms',
      color: '#d3c15f',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['left_knee', 'left_ankle', 'left_foot_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'forearms',
      color: '#5fd3bc',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
    },
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'neck', 'right_ear']
    },
    {
      name: 'obliques',
      color: '#d3c15f',
      keypoints: ['right_shoulder', 'right_hip', 'right_knee']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'upper_abs',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'lower_abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_knee', 'left_knee']
    },
    {
      name: 'quad_sweep',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'quad_sweep',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['left_knee', 'left_ankle', 'left_foot_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
    }
  ],
  [PoseType.FRONT_LAT_SPREAD]: [
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
    },
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
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
  [PoseType.BACK_LAT_SPREAD]: [
    {
      name: 'back',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
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
      name: 'traps',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
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
  [PoseType.MOST_MUSCULAR]: [
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
      name: 'traps',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
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
      name: 'forearms',
      color: '#d35f9c',
      keypoints: ['left_elbow', 'left_wrist', 'left_index']
    },
    {
      name: 'forearms',
      color: '#d35f9c',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'pecs',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'serratus',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'obliques',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'left_hip', 'left_knee']
    },
    {
      name: 'hamstrings',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'traps',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
    },
    {
      name: 'rear_delts',
      color: '#5fd3bc',
      keypoints: ['left_shoulder', 'left_elbow', 'neck']
    },
    {
      name: 'rear_delts',
      color: '#5fd3bc',
      keypoints: ['right_shoulder', 'right_elbow', 'neck']
    },
    {
      name: 'forearms',
      color: '#d3c15f',
      keypoints: ['left_elbow', 'left_wrist', 'left_index']
    },
    {
      name: 'forearms',
      color: '#d3c15f',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['left_knee', 'left_ankle', 'left_foot_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'forearms',
      color: '#5fd3bc',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
    },
    {
      name: 'deltoids',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_elbow', 'neck', 'right_ear']
    },
    {
      name: 'obliques',
      color: '#d3c15f',
      keypoints: ['right_shoulder', 'right_hip', 'right_knee']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
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
    },
    // Enhanced detailed muscle groups
    {
      name: 'upper_abs',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'lower_abs',
      color: '#d3c15f',
      keypoints: ['left_hip', 'right_hip', 'right_knee', 'left_knee']
    },
    {
      name: 'quad_sweep',
      color: '#8c5fd3',
      keypoints: ['left_hip', 'left_knee', 'left_ankle']
    },
    {
      name: 'quad_sweep',
      color: '#8c5fd3',
      keypoints: ['right_hip', 'right_knee', 'right_ankle']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['left_knee', 'left_ankle', 'left_foot_index']
    },
    {
      name: 'calves',
      color: '#d35f9c',
      keypoints: ['right_knee', 'right_ankle', 'right_foot_index']
    }
  ],
  [PoseType.FRONT_LAT_SPREAD]: [
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
    },
    {
      name: 'chest',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
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
  [PoseType.BACK_LAT_SPREAD]: [
    {
      name: 'back',
      color: '#d35f5f',
      keypoints: ['left_shoulder', 'right_shoulder', 'right_hip', 'left_hip']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['left_shoulder', 'left_hip', 'left_elbow']
    },
    {
      name: 'lats',
      color: '#5f87d3',
      keypoints: ['right_shoulder', 'right_hip', 'right_elbow']
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
      name: 'traps',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
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
  [PoseType.MOST_MUSCULAR]: [
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
      name: 'traps',
      color: '#d3c15f',
      keypoints: ['left_shoulder', 'right_shoulder', 'neck', 'left_ear', 'right_ear']
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
      name: 'forearms',
      color: '#d35f9c',
      keypoints: ['left_elbow', 'left_wrist', 'left_index']
    },
    {
      name: 'forearms',
      color: '#d35f9c',
      keypoints: ['right_elbow', 'right_wrist', 'right_index']
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
      // Clean up animation loop when component unmounts
      if (visualizationRef.current) {
        visualizationRef.current = null;
      }
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
    
    // Update the visualization with the current pose data
    if (visualizationRef.current) {
      // Set the pose type
      visualizationRef.current.setPoseType(poseType);
      
      // Process the pose data if needed
      // Note: This assumes poseData is in a format that can be used directly
      // You might need to adapt this based on your actual data structure
      
      // Draw the visualization
      visualizationRef.current.draw();
    }
    
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