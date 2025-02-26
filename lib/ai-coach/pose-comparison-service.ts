/**
 * Pose Comparison Service
 * Handles comparison between user poses and professional reference poses
 */

import { DensePoseComparisonService, PoseComparisonResult } from './densepose-comparison';
import { referencePosesService } from './reference-poses';
import { DensePoseData, DensePoseClient } from './densepose-client';
import { PoseType } from './pose-analyzer';

/**
 * Service for comparing user poses with professional reference poses
 */
export class PoseComparisonService {
  private densePoseComparisonService: DensePoseComparisonService;
  private densePoseClient: DensePoseClient;
  
  constructor() {
    this.densePoseComparisonService = new DensePoseComparisonService();
    this.densePoseClient = new DensePoseClient();
  }
  
  /**
   * Compare a user's pose (via image URL) with a specific reference pose
   * @param userImageUrl URL of the user's pose image
   * @param referencePoseId ID of the reference pose to compare against
   */
  public async compareWithReferencePose(
    userImageUrl: string, 
    referencePoseId: string
  ): Promise<PoseComparisonResult | null> {
    try {
      // Get the reference pose
      const referencePose = referencePosesService.getReferenceById(referencePoseId);
      if (!referencePose) {
        console.error(`Reference pose with ID ${referencePoseId} not found`);
        return null;
      }
      
      // Get DensePose data for the user image
      const userDensePoseData = await this.densePoseClient.analyzeImage(userImageUrl);
      if (!userDensePoseData || !userDensePoseData.instances || userDensePoseData.instances.length === 0) {
        console.error('Failed to get DensePose data for user image');
        return null;
      }
      
      // Compare the poses
      const comparisonResult = this.densePoseComparisonService.comparePoses(
        userDensePoseData,
        referencePose.densePoseData,
        referencePose.poseType
      );
      
      return comparisonResult;
    } catch (error) {
      console.error('Error comparing poses:', error);
      return null;
    }
  }
  
  /**
   * Find the best matching reference pose for a user's pose
   * @param userImageUrl URL of the user's pose image
   * @param poseType Optional pose type to filter reference poses
   */
  public async findBestMatchingPose(
    userImageUrl: string,
    poseType?: PoseType
  ): Promise<{referencePose: string, comparisonResult: PoseComparisonResult} | null> {
    try {
      // Get DensePose data for the user image
      const userDensePoseData = await this.densePoseClient.analyzeImage(userImageUrl);
      if (!userDensePoseData || !userDensePoseData.instances || userDensePoseData.instances.length === 0) {
        console.error('Failed to get DensePose data for user image');
        return null;
      }
      
      // Get reference poses, filtered by pose type if provided
      const referencePoses = poseType 
        ? referencePosesService.getReferencePosesByType(poseType)
        : referencePosesService.getAllReferencePoses();
      
      if (referencePoses.length === 0) {
        console.error('No reference poses available for comparison');
        return null;
      }
      
      // Compare with each reference pose and find the best match
      let bestMatch = null;
      let highestScore = -1;
      
      for (const referencePose of referencePoses) {
        const comparisonResult = this.densePoseComparisonService.comparePoses(
          userDensePoseData,
          referencePose.densePoseData,
          referencePose.poseType
        );
        
        if (comparisonResult.totalScore > highestScore) {
          highestScore = comparisonResult.totalScore;
          bestMatch = {
            referencePose: referencePose.id,
            comparisonResult
          };
        }
      }
      
      return bestMatch;
    } catch (error) {
      console.error('Error finding best matching pose:', error);
      return null;
    }
  }
  
  /**
   * Get detailed feedback for a pose comparison
   * @param comparisonResult The result of a pose comparison
   */
  public getDetailedFeedback(comparisonResult: PoseComparisonResult): string {
    // Compile feedback into a comprehensive text
    let feedback = `Overall Score: ${comparisonResult.totalScore.toFixed(2)} / 10\n\n`;
    
    feedback += `Symmetry: ${comparisonResult.symmetryScore.toFixed(2)} / 10\n`;
    feedback += `Alignment: ${comparisonResult.alignmentScore.toFixed(2)} / 10\n`;
    feedback += `Muscle Activation: ${comparisonResult.muscleActivationScore.toFixed(2)} / 10\n\n`;
    
    feedback += "Detailed Feedback:\n";
    
    // Add each feedback item
    comparisonResult.feedback.forEach((item, index) => {
      feedback += `${index + 1}. ${item.message} (Importance: ${item.importance})\n`;
    });
    
    return feedback;
  }
}

// Create and export a singleton instance
export const poseComparisonService = new PoseComparisonService(); 