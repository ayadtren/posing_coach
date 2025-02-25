/**
 * Vision provider for the AI coach
 * Uses TensorFlow.js and PoseNet for pose detection
 */
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// Define pose data structure
export interface PoseData {
  score: number;
  keypoints: {
    name: string;
    x: number;
    y: number;
    score: number;
  }[];
  imageWidth: number;
  imageHeight: number;
}

export class VisionProvider {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized: boolean = false;
  
  constructor() {}
  
  /**
   * Initialize TensorFlow.js with fallback options
   */
  private async initializeTensorFlow(): Promise<void> {
    // Try backends in order of preference
    const backends = ['webgl', 'cpu'];
    
    for (const backend of backends) {
      try {
        console.log(`Attempting to initialize TensorFlow.js with ${backend} backend...`);
        await tf.setBackend(backend);
        await tf.ready();
        console.log(`Successfully initialized TensorFlow.js with ${backend} backend`);
        return;
      } catch (error) {
        console.warn(`Failed to initialize ${backend} backend:`, error);
      }
    }
    
    throw new Error('Failed to initialize TensorFlow.js with any backend');
  }
  
  /**
   * Initialize the pose detector
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize TensorFlow.js with fallback options
      await this.initializeTensorFlow();
      
      // Create detector using MoveNet (faster and more accurate than PoseNet)
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25
      };
      
      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing pose detector:', error);
      throw new Error('Failed to initialize pose detector');
    }
  }
  
  /**
   * Detect poses in a video element
   */
  async detectPose(video: HTMLVideoElement): Promise<PoseData | null> {
    if (!this.detector || !this.isInitialized) {
      throw new Error('Pose detector not initialized');
    }
    
    try {
      // Detect poses
      const poses = await this.detector.estimatePoses(video, {
        flipHorizontal: false
      });
      
      // We're only interested in the first pose (single person)
      if (poses.length > 0) {
        const pose = poses[0];
        
        // Convert to our PoseData format
        return {
          score: pose.score || 0,
          keypoints: pose.keypoints.map(kp => ({
            name: kp.name || 'unknown',
            x: kp.x,
            y: kp.y,
            score: kp.score || 0
          })),
          imageWidth: video.videoWidth,
          imageHeight: video.videoHeight
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting pose:', error);
      throw new Error('Failed to detect pose');
    }
  }
  
  /**
   * Dispose of the detector resources
   */
  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
    }
  }
} 