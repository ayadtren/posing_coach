import { PoseType } from './pose-analyzer';
import { PoseData } from './vision-provider';

export interface PhysiqueData {
  height: number;
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  armLength: number;
  legLength: number;
  poseKeypoints: {
    [key in PoseType]?: any[];
  };
}

export class PoseOverlayService {
  private physiqueData: PhysiqueData | null = null;
  private currentPoseType: PoseType = PoseType.FRONT_RELAXED;
  
  constructor() {}
  
  /**
   * Set the user's physique data
   */
  setPhysiqueData(data: PhysiqueData): void {
    this.physiqueData = data;
  }
  
  /**
   * Set the current pose type
   */
  setPoseType(poseType: PoseType): void {
    this.currentPoseType = poseType;
  }
  
  /**
   * Check if physique data is available
   */
  hasPhysiqueData(): boolean {
    return this.physiqueData !== null;
  }
  
  /**
   * Check if physique data is available for the current pose type
   */
  hasPhysiqueDataForCurrentPose(): boolean {
    return this.physiqueData !== null && 
           this.physiqueData.poseKeypoints !== undefined && 
           Array.isArray(this.physiqueData.poseKeypoints[this.currentPoseType]);
  }
  
  /**
   * Generate a personalized pose overlay based on the user's physique and current pose
   */
  generateOverlay(currentPoseData: PoseData, canvasWidth: number, canvasHeight: number): any {
    if (!this.hasPhysiqueDataForCurrentPose()) {
      throw new Error('Physique data not available for the current pose type');
    }
    
    // Get the ideal keypoints for the current pose type
    // We can safely use the non-null assertion operator here because we've checked in hasPhysiqueDataForCurrentPose
    const idealKeypoints = this.physiqueData!.poseKeypoints[this.currentPoseType]!;
    
    // Scale and position the ideal keypoints based on the current pose
    const scaledKeypoints = this.scaleKeypoints(idealKeypoints, currentPoseData, canvasWidth, canvasHeight);
    
    // Return the scaled keypoints for rendering
    return {
      keypoints: scaledKeypoints,
      connections: this.getPoseConnections()
    };
  }
  
  /**
   * Scale and position the ideal keypoints based on the current pose
   */
  private scaleKeypoints(idealKeypoints: any[], currentPoseData: PoseData, canvasWidth: number, canvasHeight: number): any[] {
    if (!currentPoseData.keypoints || currentPoseData.keypoints.length === 0) {
      return idealKeypoints;
    }
    
    // Find key reference points in the current pose
    const currentNose = currentPoseData.keypoints.find(kp => kp.name === 'nose');
    const currentLeftShoulder = currentPoseData.keypoints.find(kp => kp.name === 'left_shoulder');
    const currentRightShoulder = currentPoseData.keypoints.find(kp => kp.name === 'right_shoulder');
    const currentLeftHip = currentPoseData.keypoints.find(kp => kp.name === 'left_hip');
    const currentRightHip = currentPoseData.keypoints.find(kp => kp.name === 'right_hip');
    
    // Find the same reference points in the ideal pose
    const idealNose = idealKeypoints.find((kp: any) => kp.name === 'nose');
    const idealLeftShoulder = idealKeypoints.find((kp: any) => kp.name === 'left_shoulder');
    const idealRightShoulder = idealKeypoints.find((kp: any) => kp.name === 'right_shoulder');
    
    // If we can't find the reference points, return the original keypoints
    if (!currentNose || !currentLeftShoulder || !currentRightShoulder || 
        !idealNose || !idealLeftShoulder || !idealRightShoulder) {
      return idealKeypoints;
    }
    
    // Calculate the scale factor based on shoulder width
    const currentShoulderWidth = Math.sqrt(
      Math.pow(currentRightShoulder.x - currentLeftShoulder.x, 2) + 
      Math.pow(currentRightShoulder.y - currentLeftShoulder.y, 2)
    );
    
    const idealShoulderWidth = Math.sqrt(
      Math.pow(idealRightShoulder.x - idealLeftShoulder.x, 2) + 
      Math.pow(idealRightShoulder.y - idealLeftShoulder.y, 2)
    );
    
    const scaleFactor = currentShoulderWidth / idealShoulderWidth;
    
    // Calculate the translation to align the nose positions
    const translateX = currentNose.x - (idealNose.x * scaleFactor);
    const translateY = currentNose.y - (idealNose.y * scaleFactor);
    
    // Scale and translate all keypoints
    return idealKeypoints.map((kp: any) => ({
      name: kp.name,
      x: (kp.x * scaleFactor) + translateX,
      y: (kp.y * scaleFactor) + translateY,
      score: 1.0 // Ideal keypoints have perfect confidence
    }));
  }
  
  /**
   * Get the connections between keypoints for rendering
   */
  private getPoseConnections(): [string, string][] {
    return [
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
      ['right_knee', 'right_ankle']
    ];
  }
} 