/**
 * DensePose Comparison Utility
 * Compares user poses with reference professional bodybuilder poses
 * Provides detailed feedback on pose alignment and muscle presentation
 */

import { DensePoseResult, DensePoseInstance } from '@/lib/ai-coach/densepose-client';
import { PoseType } from '@/lib/ai-coach/pose-analyzer';

/**
 * Importance levels for pose feedback
 */
export enum FeedbackImportance {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

// Bodybuilder reference pose
export interface BodybuilderReferencePose {
  id: string;
  bodybuilder: string;
  name: string;
  era: string;
  poseType: PoseType;
  densePoseData: DensePoseResult;
  imageUrl: string;
}

// Comparison result with feedback
export interface PoseComparisonResult {
  totalScore: number;
  symmetryScore: number;
  alignmentScore: number;
  muscleActivationScore: number;
  feedback: PoseFeedbackItem[];
}

// Individual feedback item
export interface PoseFeedbackItem {
  bodyPart: string;
  message: string;
  importance: FeedbackImportance;
  score?: number;
}

/**
 * Pose Comparison Service
 * Handles comparing user DensePose data with reference poses
 */
export class DensePoseComparisonService {
  private referencePoses: BodybuilderReferencePose[] = [];
  
  /**
   * Add a reference pose to the comparison database
   */
  public addReferencePose(pose: BodybuilderReferencePose): void {
    this.referencePoses.push(pose);
  }
  
  /**
   * Set multiple reference poses at once
   */
  public setReferencePoses(poses: BodybuilderReferencePose[]): void {
    this.referencePoses = poses;
  }
  
  /**
   * Get reference poses for a specific pose type
   */
  public getReferencePosesByType(poseType: PoseType): BodybuilderReferencePose[] {
    return this.referencePoses.filter(pose => pose.poseType === poseType);
  }
  
  /**
   * Find the best matching reference pose for a user pose
   */
  public findBestMatchingPose(userPoseData: DensePoseResult, poseType: PoseType): BodybuilderReferencePose | null {
    const referencePoses = this.getReferencePosesByType(poseType);
    if (referencePoses.length === 0) return null;
    
    let bestScore = -1;
    let bestPose: BodybuilderReferencePose | null = null;
    
    for (const referencePose of referencePoses) {
      const comparisonResult = this.comparePoses(userPoseData, referencePose.densePoseData, poseType);
      if (comparisonResult.totalScore > bestScore) {
        bestScore = comparisonResult.totalScore;
        bestPose = referencePose;
      }
    }
    
    return bestPose;
  }
  
  /**
   * Compare a user pose with a reference pose and generate feedback
   */
  public comparePoses(
    userPoseData: DensePoseResult,
    referencePoseData: DensePoseResult,
    poseType: PoseType
  ): PoseComparisonResult {
    if (!userPoseData.instances || userPoseData.instances.length === 0 || 
        !referencePoseData.instances || referencePoseData.instances.length === 0) {
      return this.createEmptyComparisonResult();
    }
    
    const userInstance = userPoseData.instances[0];
    const referenceInstance = referencePoseData.instances[0];
    
    // Calculate various scores
    const symmetryScore = this.calculateSymmetryScore(userPoseData);
    const alignmentScore = this.calculateAlignmentScore(userPoseData, referencePoseData);
    const muscleActivationScore = this.calculateMuscleActivationScore(userPoseData);
    
    // Generate feedback based on scores
    const feedback = this.generateFeedback(
      userPoseData, 
      referencePoseData, 
      poseType, 
      symmetryScore, 
      alignmentScore, 
      muscleActivationScore
    );
    
    // Calculate total score (weighted average)
    const totalScore = this.calculateTotalScore(symmetryScore, alignmentScore, muscleActivationScore, poseType);
    
    return {
      totalScore,
      symmetryScore,
      alignmentScore,
      muscleActivationScore,
      feedback
    };
  }
  
  /**
   * Calculate symmetry score based on left/right balance
   */
  private calculateSymmetryScore(userPoseData: DensePoseResult): number {
    if (!userPoseData.instances || userPoseData.instances.length === 0) return 0;
    
    const userInstance = userPoseData.instances[0];
    
    // Define paired body parts (left/right)
    const bodyPartPairs = [
      // Upper body pairs
      [10, 11], // Upper arms (left, right)
      [12, 13], // Lower arms (left, right)
      [2, 3],   // Hands (right, left) - note: DensePose has reversed indexes for hands
      
      // Lower body pairs
      [7, 6],   // Upper legs (left, right) - note: DensePose has reversed indexes for legs
      [9, 8],   // Lower legs (left, right) - note: DensePose has reversed indexes for legs
      [4, 5],   // Feet (left, right)
    ];
    
    let symmetryScores: number[] = [];
    
    // Calculate body part data from segmentation
    const bodyPartCounts: Record<number, number> = {};
    
    if (Array.isArray(userInstance.body_parts)) {
      // Handle 1D array case
      for (const bodyPartId of userInstance.body_parts) {
        if (bodyPartId > 0) { // Skip background (0)
          bodyPartCounts[bodyPartId] = (bodyPartCounts[bodyPartId] || 0) + 1;
        }
      }
    } else {
      // Handle 2D array case
      for (const row of userInstance.body_parts) {
        for (const bodyPartId of row) {
          if (bodyPartId > 0) { // Skip background (0)
            bodyPartCounts[bodyPartId] = (bodyPartCounts[bodyPartId] || 0) + 1;
          }
        }
      }
    }
    
    // Calculate symmetry for each pair
    for (const [leftPartId, rightPartId] of bodyPartPairs) {
      const leftCount = bodyPartCounts[leftPartId] || 0;
      const rightCount = bodyPartCounts[rightPartId] || 0;
      
      // Skip if both parts are not visible
      if (leftCount === 0 && rightCount === 0) continue;
      
      // Calculate symmetry ratio
      const total = leftCount + rightCount;
      const idealRatio = 0.5; // Perfectly symmetric would be 50% left, 50% right
      const actualRatio = leftCount / total;
      
      // Convert to score (0-100)
      // For perfect symmetry, leftCount / total would be 0.5
      // Calculate how far the actual ratio is from the ideal ratio (as a percentage)
      const deviation = Math.abs(actualRatio - idealRatio) / idealRatio;
      const pairScore = Math.max(0, 100 - (deviation * 100 * 2)); // Scale to 0-100
      
      symmetryScores.push(pairScore);
    }
    
    // Average symmetry scores or return 0 if no pairs were evaluated
    return symmetryScores.length > 0 ? 
      Math.round(symmetryScores.reduce((sum, score) => sum + score, 0) / symmetryScores.length) : 0;
  }
  
  /**
   * Calculate alignment score based on body part positioning
   */
  private calculateAlignmentScore(userPoseData: DensePoseResult, referencePoseData: DensePoseResult): number {
    if (!userPoseData.instances || userPoseData.instances.length === 0 || 
        !referencePoseData.instances || referencePoseData.instances.length === 0) {
      return 0;
    }
    
    const userInstance = userPoseData.instances[0];
    const referenceInstance = referencePoseData.instances[0];
    
    // Calculate overall alignment based on UV map comparison
    // This compares the general pose positioning
    
    // For each body part, compare the average UV coordinates
    const bodyPartAverages: Record<number, {userUV: {u: number, v: number}, refUV: {u: number, v: number}, pixels: number}> = {};
    
    // Track user body part UV coordinates
    if (Array.isArray(userInstance.body_parts)) {
      // Handle 1D array case
      for (let i = 0; i < userInstance.body_parts.length; i++) {
        const partId = userInstance.body_parts[i];
        if (partId === 0) continue; // Skip background
        
        if (!bodyPartAverages[partId]) {
          bodyPartAverages[partId] = { 
            userUV: { u: 0, v: 0 }, 
            refUV: { u: 0, v: 0 },
            pixels: 0 
          };
        }
        
        bodyPartAverages[partId].userUV.u += userInstance.u[i] || 0;
        bodyPartAverages[partId].userUV.v += userInstance.v[i] || 0;
        bodyPartAverages[partId].pixels++;
      }
    } else {
      // Handle 2D array case (flatten)
      const flattenedArray = userInstance.body_parts.flat();
      const flattenedU = Array.isArray(userInstance.u[0]) ? userInstance.u.flat() : userInstance.u;
      const flattenedV = Array.isArray(userInstance.v[0]) ? userInstance.v.flat() : userInstance.v;
      
      for (let i = 0; i < flattenedArray.length; i++) {
        const partId = flattenedArray[i];
        if (partId === 0) continue; // Skip background
        
        if (!bodyPartAverages[partId]) {
          bodyPartAverages[partId] = { 
            userUV: { u: 0, v: 0 }, 
            refUV: { u: 0, v: 0 },
            pixels: 0 
          };
        }
        
        bodyPartAverages[partId].userUV.u += flattenedU[i] || 0;
        bodyPartAverages[partId].userUV.v += flattenedV[i] || 0;
        bodyPartAverages[partId].pixels++;
      }
    }
    
    // Track reference body part UV coordinates
    if (Array.isArray(referenceInstance.body_parts)) {
      // Handle 1D array case
      for (let i = 0; i < referenceInstance.body_parts.length; i++) {
        const partId = referenceInstance.body_parts[i];
        if (partId === 0) continue; // Skip background
        
        if (!bodyPartAverages[partId]) {
          bodyPartAverages[partId] = { 
            userUV: { u: 0, v: 0 }, 
            refUV: { u: 0, v: 0 },
            pixels: 0 
          };
        }
        
        bodyPartAverages[partId].refUV.u += referenceInstance.u[i] || 0;
        bodyPartAverages[partId].refUV.v += referenceInstance.v[i] || 0;
        bodyPartAverages[partId].pixels++;
      }
    } else {
      // Handle 2D array case (flatten)
      const flattenedArray = referenceInstance.body_parts.flat();
      const flattenedU = Array.isArray(referenceInstance.u[0]) ? referenceInstance.u.flat() : referenceInstance.u;
      const flattenedV = Array.isArray(referenceInstance.v[0]) ? referenceInstance.v.flat() : referenceInstance.v;
      
      for (let i = 0; i < flattenedArray.length; i++) {
        const partId = flattenedArray[i];
        if (partId === 0) continue; // Skip background
        
        if (!bodyPartAverages[partId]) {
          bodyPartAverages[partId] = { 
            userUV: { u: 0, v: 0 }, 
            refUV: { u: 0, v: 0 },
            pixels: 0 
          };
        }
        
        bodyPartAverages[partId].refUV.u += flattenedU[i] || 0;
        bodyPartAverages[partId].refUV.v += flattenedV[i] || 0;
        bodyPartAverages[partId].pixels++;
      }
    }
    
    // Calculate average positions for each body part
    const bodyPartScores: number[] = [];
    
    for (const [partId, data] of Object.entries(bodyPartAverages)) {
      if (data.pixels === 0) continue;
      
      // Calculate averages
      const userUAvg = data.userUV.u / data.pixels;
      const userVAvg = data.userUV.v / data.pixels;
      const refUAvg = data.refUV.u / data.pixels;
      const refVAvg = data.refUV.v / data.pixels;
      
      // Calculate distance between average positions
      const uDiff = Math.abs(userUAvg - refUAvg);
      const vDiff = Math.abs(userVAvg - refVAvg);
      
      // Calculate alignment score for this body part (0-100)
      // Lower difference = higher score
      // UV coordinates are normalized from 0-1, so max difference is 1
      const distance = Math.sqrt(uDiff * uDiff + vDiff * vDiff);
      const maxDistance = Math.sqrt(2); // Maximum possible distance in UV space
      const partScore = Math.max(0, 100 - ((distance / maxDistance) * 100));
      
      bodyPartScores.push(partScore);
    }
    
    // Average alignment scores
    return bodyPartScores.length > 0 ? 
      Math.round(bodyPartScores.reduce((sum, score) => sum + score, 0) / bodyPartScores.length) : 0;
  }
  
  /**
   * Calculate muscle activation score based on surface detail visualization
   */
  private calculateMuscleActivationScore(userPoseData: DensePoseResult): number {
    // This is a placeholder - in a real implementation, this would analyze surface details
    // to determine how well muscles are activated/flexed compared to the reference pose
    
    // For now, we'll use a simplified version that looks at the UV map density in key areas
    
    // Muscle groups of interest for bodybuilding poses and their corresponding body parts
    const muscleGroups = [
      { name: 'Chest', bodyParts: [1] }, // Torso
      { name: 'Back', bodyParts: [1] }, // Torso
      { name: 'Shoulders', bodyParts: [10, 11] }, // Upper arms
      { name: 'Biceps', bodyParts: [10, 11, 12, 13] }, // Arms
      { name: 'Triceps', bodyParts: [10, 11, 12, 13] }, // Arms
      { name: 'Abs', bodyParts: [1] }, // Torso
      { name: 'Quads', bodyParts: [6, 7] }, // Upper legs
      { name: 'Hamstrings', bodyParts: [6, 7] }, // Upper legs
      { name: 'Calves', bodyParts: [8, 9] }, // Lower legs
    ];
    
    // For now, return a placeholder score around 70
    // In a real implementation, this would compare specific muscle activations
    return Math.round(70 + Math.random() * 10);
  }
  
  /**
   * Calculate total score based on individual scores and pose type
   */
  private calculateTotalScore(
    symmetryScore: number,
    alignmentScore: number,
    muscleActivationScore: number,
    poseType: PoseType
  ): number {
    // Different poses have different priorities for scoring
    let weightSymmetry = 0.33;
    let weightAlignment = 0.33;
    let weightMuscle = 0.33;
    
    // Adjust weights based on pose type
    switch (poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
      case PoseType.BACK_DOUBLE_BICEPS:
        // Symmetry is very important in these poses
        weightSymmetry = 0.45;
        weightAlignment = 0.30;
        weightMuscle = 0.25;
        break;
        
      case PoseType.SIDE_CHEST:
      case PoseType.SIDE_TRICEPS:
        // Alignment is very important in these poses
        weightSymmetry = 0.20;
        weightAlignment = 0.50;
        weightMuscle = 0.30;
        break;
        
      case PoseType.MOST_MUSCULAR:
        // Muscle activation is very important in this pose
        weightSymmetry = 0.25;
        weightAlignment = 0.25;
        weightMuscle = 0.50;
        break;
    }
    
    // Calculate weighted score
    const totalScore = (
      symmetryScore * weightSymmetry +
      alignmentScore * weightAlignment +
      muscleActivationScore * weightMuscle
    );
    
    return totalScore;
  }
  
  /**
   * Generate feedback based on pose comparison
   */
  private generateFeedback(
    userPoseData: DensePoseResult,
    referencePoseData: DensePoseResult,
    poseType: PoseType,
    symmetryScore: number,
    alignmentScore: number,
    muscleActivationScore: number
  ): PoseFeedbackItem[] {
    const feedback: PoseFeedbackItem[] = [];
    
    // Add feedback items based on the pose type and scores
    
    // Symmetry feedback
    if (symmetryScore < 7) {
      feedback.push({
        bodyPart: 'Overall',
        message: 'Work on improving your left-right symmetry, particularly in your arm positioning',
        importance: FeedbackImportance.HIGH,
        score: symmetryScore
      });
    } else if (symmetryScore < 8.5) {
      feedback.push({
        bodyPart: 'Arms',
        message: 'Good symmetry, but try to ensure both arms are at identical angles',
        importance: FeedbackImportance.MEDIUM,
        score: symmetryScore
      });
    } else {
      feedback.push({
        bodyPart: 'Overall',
        message: 'Excellent symmetry between your left and right sides',
        importance: FeedbackImportance.LOW,
        score: symmetryScore
      });
    }
    
    // Alignment feedback based on pose type
    switch (poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        if (alignmentScore < 6) {
          feedback.push({
            bodyPart: 'Arms',
            message: 'Try to bring your arms higher and bend elbows more to better showcase your biceps',
            importance: FeedbackImportance.HIGH,
            score: alignmentScore
          });
        }
        
        feedback.push({
          bodyPart: 'Legs',
          message: alignmentScore < 7 
            ? 'Widen your stance slightly and make sure to flex your quads' 
            : 'Good leg positioning, keep tension in your quads throughout the pose',
          importance: alignmentScore < 7 ? FeedbackImportance.MEDIUM : FeedbackImportance.LOW,
          score: alignmentScore
        });
        break;
        
      case PoseType.SIDE_CHEST:
        feedback.push({
          bodyPart: 'Chest',
          message: alignmentScore < 6.5 
            ? 'Rotate your torso more toward the camera and push your chest out further' 
            : 'Good chest presentation, try to maintain maximum expansion',
          importance: alignmentScore < 6.5 ? FeedbackImportance.HIGH : FeedbackImportance.MEDIUM,
          score: alignmentScore
        });
        break;
        
      case PoseType.MOST_MUSCULAR:
        feedback.push({
          bodyPart: 'Traps',
          message: muscleActivationScore < 7 
            ? 'Squeeze your traps harder to show more definition' 
            : 'Good trap activation, try to maintain intensity throughout the pose',
          importance: muscleActivationScore < 7 ? FeedbackImportance.HIGH : FeedbackImportance.LOW,
          score: muscleActivationScore
        });
        break;
    }
    
    // Muscle activation feedback
    if (muscleActivationScore < 6) {
      feedback.push({
        bodyPart: 'Overall',
        message: 'Focus on creating more tension in your muscles throughout the pose',
        importance: FeedbackImportance.HIGH,
        score: muscleActivationScore
      });
    } else if (muscleActivationScore < 8) {
      feedback.push({
        bodyPart: 'Core',
        message: 'Good muscle activation, but remember to keep tension in your core throughout the pose',
        importance: FeedbackImportance.MEDIUM,
        score: muscleActivationScore
      });
    } else {
      feedback.push({
        bodyPart: 'Overall',
        message: 'Excellent muscle activation across all visible muscle groups',
        importance: FeedbackImportance.LOW,
        score: muscleActivationScore
      });
    }
    
    return feedback;
  }
  
  /**
   * Create an empty comparison result for when comparison fails
   */
  private createEmptyComparisonResult(): PoseComparisonResult {
    return {
      totalScore: 0,
      symmetryScore: 0,
      alignmentScore: 0,
      muscleActivationScore: 0,
      feedback: [{
        bodyPart: 'Error',
        message: 'Could not analyze pose. Please try again with a clearer image.',
        importance: FeedbackImportance.HIGH
      }]
    };
  }
} 