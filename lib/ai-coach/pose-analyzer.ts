// Remove the import for PoseData and define all types locally
// Define pose types
export enum PoseType {
  FRONT_RELAXED = 'FRONT_RELAXED',
  FRONT_DOUBLE_BICEPS = 'FRONT_DOUBLE_BICEPS',
  SIDE_CHEST = 'SIDE_CHEST',
  BACK_DOUBLE_BICEPS = 'BACK_DOUBLE_BICEPS',
  SIDE_TRICEPS = 'SIDE_TRICEPS',
  ABDOMINAL_AND_THIGH = 'ABDOMINAL_AND_THIGH'
}

// Define competition categories
export enum CompetitionCategory {
  MENS_PHYSIQUE = 'MENS_PHYSIQUE',
  CLASSIC_PHYSIQUE = 'CLASSIC_PHYSIQUE',
  MENS_OPEN = 'MENS_OPEN'
}

// Define Point interface
export interface Point {
  x: number;
  y: number;
}

// Define Keypoint interface
export interface Keypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

// Define PoseData interface
export interface PoseData {
  keypoints: Keypoint[];
  score: number;
  imageWidth: number;
  imageHeight: number;
}

// Define MuscleGroupFeedback interface
export interface MuscleGroupFeedback {
  name: string;
  score: number;
  feedback: string;
}

// Define PoseFeedback interface
export interface PoseFeedback {
  score: number;
  alignmentScore: number;
  symmetryScore: number;
  muscleEngagementScore: number;
  overallFeedback: string;
  improvementTips: string;
  muscleGroups: MuscleGroupFeedback[];
  timestamp: number;
}

/**
 * Pose analyzer for the AI coach
 * Analyzes detected poses and provides feedback
 */

// Reference poses database
const POSE_DESCRIPTIONS: Record<PoseType, { description: string, tips: string }> = {
  [PoseType.FRONT_RELAXED]: {
    description: "Stand with feet shoulder-width apart, arms slightly away from body, palms facing thighs, shoulders back, chest up.",
    tips: "Keep your shoulders pulled back, chest high, and maintain a slight flex in all muscle groups. Distribute weight evenly on both feet."
  },
  [PoseType.FRONT_DOUBLE_BICEPS]: {
    description: "Arms raised to shoulder height, elbows bent, fists clenched, biceps and forearms flexed, lats spread, abs tight.",
    tips: "Focus on expanding your lats while flexing biceps. Keep shoulders down to maximize arm size appearance. Tighten core and slightly twist wrists outward."
  },
  [PoseType.SIDE_CHEST]: {
    description: "Stand sideways, rear leg bent, chest expanded, arm closest to judges bent with fist against hip, other arm grasping wrist or hand.",
    tips: "Push chest forward and up, squeeze pecs, pull shoulders back. The bent leg should push against the straight leg to show quad definition."
  },
  [PoseType.BACK_DOUBLE_BICEPS]: {
    description: "Back to judges, arms raised to sides, elbows bent, fists clenched, back muscles flexed, one leg extended back with heel raised.",
    tips: "Spread your lats as wide as possible. Pull your elbows back to accentuate back width. Slightly bend forward at the waist to show back detail."
  },
  [PoseType.SIDE_TRICEPS]: {
    description: "Stand sideways, rear leg bent, front arm extended down and back with tricep flexed, rear arm grasping front wrist.",
    tips: "Keep your tricep arm straight and locked. Twist your torso slightly to show more of your chest. Flex the hamstring of your rear leg."
  },
  [PoseType.ABDOMINAL_AND_THIGH]: {
    description: "Arms positioned behind head or at sides, one leg extended forward, abs contracted, thighs flexed.",
    tips: "Exhale fully and contract abs hard. Place hands behind head with elbows wide or hold arms out to sides. Flex the quad of your extended leg."
  }
};

// Define muscle groups for each pose type
const POSE_MUSCLE_GROUPS: Record<PoseType, string[]> = {
  [PoseType.FRONT_RELAXED]: ['shoulders', 'chest', 'arms', 'abs', 'quads'],
  [PoseType.FRONT_DOUBLE_BICEPS]: ['biceps', 'forearms', 'shoulders', 'lats', 'abs', 'quads'],
  [PoseType.SIDE_CHEST]: ['chest', 'shoulders', 'triceps', 'quads', 'calves'],
  [PoseType.BACK_DOUBLE_BICEPS]: ['back', 'lats', 'biceps', 'glutes', 'hamstrings', 'calves'],
  [PoseType.SIDE_TRICEPS]: ['triceps', 'shoulders', 'chest', 'abs', 'quads', 'hamstrings'],
  [PoseType.ABDOMINAL_AND_THIGH]: ['abs', 'serratus', 'obliques', 'quads', 'adductors']
};

export class PoseAnalyzer {
  private poseType: PoseType = PoseType.FRONT_RELAXED;
  private competitionCategory: CompetitionCategory = CompetitionCategory.CLASSIC_PHYSIQUE;
  
  /**
   * Set the pose type to analyze
   */
  setPoseType(poseType: PoseType): void {
    this.poseType = poseType;
  }
  
  /**
   * Set the competition category
   */
  setCompetitionCategory(category: CompetitionCategory): void {
    this.competitionCategory = category;
  }
  
  /**
   * Analyze the detected pose and provide feedback
   */
  analyzePose(poseData: PoseData): PoseFeedback {
    // Calculate scores for different aspects of the pose
    const alignmentScore = this.calculateAlignmentScore(poseData);
    const symmetryScore = this.calculateSymmetryScore(poseData);
    const muscleEngagementScore = this.calculateMuscleEngagementScore(poseData);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (alignmentScore * 0.4) + 
      (symmetryScore * 0.3) + 
      (muscleEngagementScore * 0.3)
    );
    
    // Generate feedback based on scores
    const overallFeedback = this.generateOverallFeedback(
      overallScore, 
      alignmentScore, 
      symmetryScore, 
      muscleEngagementScore
    );
    
    // Generate improvement tips
    const improvementTips = this.generateImprovementTips(
      alignmentScore, 
      symmetryScore, 
      muscleEngagementScore
    );
    
    // Analyze specific muscle groups
    const muscleGroups = this.analyzeMuscleGroups(poseData);
    
    return {
      score: overallScore,
      alignmentScore,
      symmetryScore,
      muscleEngagementScore,
      overallFeedback,
      improvementTips,
      muscleGroups,
      timestamp: Date.now()
    };
  }
  
  private calculateAlignmentScore(poseData: PoseData): number {
    // Improved alignment score calculation
    let score = 80; // Start with a base score
    
    // Check if key points are present
    if (!poseData.keypoints || poseData.keypoints.length === 0) {
      return 0;
    }
    
    // Get key points for alignment check
    const keypoints = this.getKeypointsByName(poseData.keypoints);
    
    // Check shoulder alignment (horizontal)
    if (keypoints.left_shoulder && keypoints.right_shoulder) {
      const shoulderDiff = Math.abs(keypoints.left_shoulder.y - keypoints.right_shoulder.y);
      const shoulderWidth = Math.abs(keypoints.left_shoulder.x - keypoints.right_shoulder.x);
      const shoulderAlignmentRatio = shoulderDiff / shoulderWidth;
      
      // Penalize if shoulders are not level
      if (shoulderAlignmentRatio > 0.1) {
        score -= Math.min(30, Math.round(shoulderAlignmentRatio * 200));
      }
    }
    
    // Check hip alignment (horizontal)
    if (keypoints.left_hip && keypoints.right_hip) {
      const hipDiff = Math.abs(keypoints.left_hip.y - keypoints.right_hip.y);
      const hipWidth = Math.abs(keypoints.left_hip.x - keypoints.right_hip.x);
      const hipAlignmentRatio = hipDiff / hipWidth;
      
      // Penalize if hips are not level
      if (hipAlignmentRatio > 0.1) {
        score -= Math.min(30, Math.round(hipAlignmentRatio * 200));
      }
    }
    
    // Check vertical alignment (spine)
    if (keypoints.nose && keypoints.left_hip && keypoints.right_hip) {
      const midHipX = (keypoints.left_hip.x + keypoints.right_hip.x) / 2;
      const verticalAlignmentRatio = Math.abs(keypoints.nose.x - midHipX) / poseData.imageWidth;
      
      // Penalize if spine is not vertical
      if (verticalAlignmentRatio > 0.05) {
        score -= Math.min(20, Math.round(verticalAlignmentRatio * 300));
      }
    }
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateSymmetryScore(poseData: PoseData): number {
    // Improved symmetry score calculation
    let score = 85; // Start with a base score
    
    // Check if key points are present
    if (!poseData.keypoints || poseData.keypoints.length === 0) {
      return 0;
    }
    
    // Get key points for symmetry check
    const keypoints = this.getKeypointsByName(poseData.keypoints);
    
    // Check arm symmetry
    if (keypoints.left_elbow && keypoints.right_elbow && 
        keypoints.left_shoulder && keypoints.right_shoulder &&
        keypoints.left_wrist && keypoints.right_wrist) {
      
      // Calculate left arm angle
      const leftArmAngle = this.calculateAngle(
        keypoints.left_shoulder,
        keypoints.left_elbow,
        keypoints.left_wrist
      );
      
      // Calculate right arm angle
      const rightArmAngle = this.calculateAngle(
        keypoints.right_shoulder,
        keypoints.right_elbow,
        keypoints.right_wrist
      );
      
      // Compare arm angles
      const armAngleDiff = Math.abs(leftArmAngle - rightArmAngle);
      if (armAngleDiff > 10) {
        score -= Math.min(25, Math.round(armAngleDiff / 2));
      }
    }
    
    // Check leg symmetry
    if (keypoints.left_knee && keypoints.right_knee && 
        keypoints.left_hip && keypoints.right_hip &&
        keypoints.left_ankle && keypoints.right_ankle) {
      
      // Calculate left leg angle
      const leftLegAngle = this.calculateAngle(
        keypoints.left_hip,
        keypoints.left_knee,
        keypoints.left_ankle
      );
      
      // Calculate right leg angle
      const rightLegAngle = this.calculateAngle(
        keypoints.right_hip,
        keypoints.right_knee,
        keypoints.right_ankle
      );
      
      // Compare leg angles
      const legAngleDiff = Math.abs(leftLegAngle - rightLegAngle);
      if (legAngleDiff > 10) {
        score -= Math.min(25, Math.round(legAngleDiff / 2));
      }
    }
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateMuscleEngagementScore(poseData: PoseData): number {
    // Improved muscle engagement score calculation
    let score = 75; // Start with a base score
    
    // Check if key points are present
    if (!poseData.keypoints || poseData.keypoints.length === 0) {
      return 0;
    }
    
    // Get key points for muscle engagement check
    const keypoints = this.getKeypointsByName(poseData.keypoints);
    
    // Check arm engagement (biceps/triceps)
    if (keypoints.left_elbow && keypoints.right_elbow && 
        keypoints.left_shoulder && keypoints.right_shoulder &&
        keypoints.left_wrist && keypoints.right_wrist) {
      
      // Calculate arm extension (straighter arms = less bicep engagement)
      const leftArmAngle = this.calculateAngle(
        keypoints.left_shoulder,
        keypoints.left_elbow,
        keypoints.left_wrist
      );
      
      const rightArmAngle = this.calculateAngle(
        keypoints.right_shoulder,
        keypoints.right_elbow,
        keypoints.right_wrist
      );
      
      // Ideal arm angle depends on the pose type
      const idealArmAngle = this.getIdealArmAngle(this.poseType);
      const armAngleAvg = (leftArmAngle + rightArmAngle) / 2;
      const armAngleDiff = Math.abs(armAngleAvg - idealArmAngle);
      
      if (armAngleDiff > 20) {
        score -= Math.min(20, Math.round(armAngleDiff / 3));
      }
    }
    
    // Check torso engagement (abs/back)
    if (keypoints.left_shoulder && keypoints.right_shoulder && 
        keypoints.left_hip && keypoints.right_hip) {
      
      // Calculate torso angle (vertical = better engagement)
      const leftTorsoAngle = this.calculateAngle(
        { x: keypoints.left_shoulder.x, y: 0 },
        keypoints.left_shoulder,
        keypoints.left_hip
      );
      
      const rightTorsoAngle = this.calculateAngle(
        { x: keypoints.right_shoulder.x, y: 0 },
        keypoints.right_shoulder,
        keypoints.right_hip
      );
      
      // Ideal torso angle depends on the pose type
      const idealTorsoAngle = this.getIdealTorsoAngle(this.poseType);
      const torsoAngleAvg = (leftTorsoAngle + rightTorsoAngle) / 2;
      const torsoAngleDiff = Math.abs(torsoAngleAvg - idealTorsoAngle);
      
      if (torsoAngleDiff > 10) {
        score -= Math.min(20, Math.round(torsoAngleDiff / 2));
      }
    }
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }
  
  private getIdealArmAngle(poseType: PoseType): number {
    // Return ideal arm angle based on pose type
    switch (poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        return 90; // 90 degrees for maximum bicep contraction
      case PoseType.SIDE_CHEST:
        return 110; // Slightly more extended for side chest
      case PoseType.BACK_DOUBLE_BICEPS:
        return 90; // 90 degrees for maximum bicep contraction
      case PoseType.SIDE_TRICEPS:
        return 160; // More extended for tricep display
      case PoseType.ABDOMINAL_AND_THIGH:
        return 170; // Arms almost straight
      case PoseType.FRONT_RELAXED:
      default:
        return 175; // Almost straight for relaxed pose
    }
  }
  
  private getIdealTorsoAngle(poseType: PoseType): number {
    // Return ideal torso angle based on pose type
    switch (poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        return 90; // Vertical
      case PoseType.SIDE_CHEST:
        return 80; // Slightly leaned back
      case PoseType.BACK_DOUBLE_BICEPS:
        return 90; // Vertical
      case PoseType.SIDE_TRICEPS:
        return 75; // Leaned back for tricep display
      case PoseType.ABDOMINAL_AND_THIGH:
        return 95; // Slightly leaned forward
      case PoseType.FRONT_RELAXED:
      default:
        return 90; // Vertical for relaxed pose
    }
  }
  
  private calculateAngle(p1: Point, p2: Point, p3: Point): number {
    // Calculate angle between three points in degrees
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    
    // Ensure angle is between 0 and 180
    if (angle > 180) {
      angle = 360 - angle;
    }
    
    return angle;
  }
  
  private getKeypointsByName(keypoints: Keypoint[]): Record<string, Point> {
    // Convert array of keypoints to object with name keys
    const result: Record<string, Point> = {};
    
    for (const keypoint of keypoints) {
      result[keypoint.name] = {
        x: keypoint.x,
        y: keypoint.y
      };
    }
    
    return result;
  }
  
  private generateOverallFeedback(
    overallScore: number,
    alignmentScore: number,
    symmetryScore: number,
    muscleEngagementScore: number
  ): string {
    // Generate overall feedback based on scores
    if (overallScore >= 90) {
      return "Excellent pose execution! Your form is nearly perfect with great alignment, symmetry, and muscle engagement.";
    } else if (overallScore >= 80) {
      return "Very good pose! Your overall form is strong with good balance between alignment, symmetry, and muscle engagement.";
    } else if (overallScore >= 70) {
      return "Good pose with room for improvement. Focus on maintaining proper alignment and symmetry.";
    } else if (overallScore >= 60) {
      return "Decent attempt at the pose. Work on improving your alignment and muscle engagement for better results.";
    } else if (overallScore >= 50) {
      return "You're on the right track, but need significant improvements in alignment, symmetry, and muscle engagement.";
    } else {
      return "Keep practicing! Focus on the basic form of the pose before working on details.";
    }
  }
  
  private generateImprovementTips(
    alignmentScore: number,
    symmetryScore: number,
    muscleEngagementScore: number
  ): string {
    // Generate specific improvement tips based on the lowest scores
    const tips = [];
    
    if (alignmentScore < 70) {
      tips.push("Focus on proper body alignment: keep your shoulders and hips level, and maintain a straight spine.");
    }
    
    if (symmetryScore < 70) {
      tips.push("Work on symmetry by ensuring both sides of your body are in identical positions. Use a mirror to check your form.");
    }
    
    if (muscleEngagementScore < 70) {
      tips.push("Increase muscle engagement by consciously contracting the target muscles. Remember to breathe and maintain tension throughout the pose.");
    }
    
    if (tips.length === 0) {
      return "Continue refining your pose and work on holding it for longer periods to build endurance.";
    }
    
    return tips.join(" ");
  }
  
  private analyzeMuscleGroups(poseData: PoseData): MuscleGroupFeedback[] {
    // Analyze specific muscle groups based on the pose type
    const muscleGroups: MuscleGroupFeedback[] = [];
    
    // Add specific muscle group analysis based on pose type
    switch (this.poseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        muscleGroups.push(this.analyzeBiceps(poseData));
        muscleGroups.push(this.analyzeShoulders(poseData));
        muscleGroups.push(this.analyzeQuads(poseData));
        break;
      case PoseType.SIDE_CHEST:
        muscleGroups.push(this.analyzeChest(poseData));
        muscleGroups.push(this.analyzeArms(poseData));
        muscleGroups.push(this.analyzeLegs(poseData));
        break;
      case PoseType.BACK_DOUBLE_BICEPS:
        muscleGroups.push(this.analyzeBack(poseData));
        muscleGroups.push(this.analyzeBiceps(poseData));
        muscleGroups.push(this.analyzeGlutes(poseData));
        break;
      case PoseType.SIDE_TRICEPS:
        muscleGroups.push(this.analyzeTriceps(poseData));
        muscleGroups.push(this.analyzeShoulders(poseData));
        muscleGroups.push(this.analyzeLegs(poseData));
        break;
      case PoseType.ABDOMINAL_AND_THIGH:
        muscleGroups.push(this.analyzeAbdominals(poseData));
        muscleGroups.push(this.analyzeQuads(poseData));
        muscleGroups.push(this.analyzeCalves(poseData));
        break;
      case PoseType.FRONT_RELAXED:
      default:
        muscleGroups.push(this.analyzeOverallPhysique(poseData));
        break;
    }
    
    return muscleGroups;
  }
  
  // Muscle group analysis methods
  private analyzeBiceps(poseData: PoseData): MuscleGroupFeedback {
    // Analyze biceps based on arm position and angle
    const keypoints = this.getKeypointsByName(poseData.keypoints);
    let score = 75;
    
    if (keypoints.left_elbow && keypoints.right_elbow && 
        keypoints.left_shoulder && keypoints.right_shoulder &&
        keypoints.left_wrist && keypoints.right_wrist) {
      
      // Calculate arm angles
      const leftArmAngle = this.calculateAngle(
        keypoints.left_shoulder,
        keypoints.left_elbow,
        keypoints.left_wrist
      );
      
      const rightArmAngle = this.calculateAngle(
        keypoints.right_shoulder,
        keypoints.right_elbow,
        keypoints.right_wrist
      );
      
      // Ideal angle for bicep display is around 90 degrees
      const leftAngleDiff = Math.abs(leftArmAngle - 90);
      const rightAngleDiff = Math.abs(rightArmAngle - 90);
      const avgAngleDiff = (leftAngleDiff + rightAngleDiff) / 2;
      
      if (avgAngleDiff < 10) {
        score += 20;
      } else if (avgAngleDiff < 20) {
        score += 10;
      } else if (avgAngleDiff > 30) {
        score -= 15;
      }
    }
    
    // Ensure score is within 0-100 range
    score = Math.max(0, Math.min(100, score));
    
    let feedback = "";
    if (score >= 90) {
      feedback = "Excellent bicep display with optimal arm positioning and contraction.";
    } else if (score >= 80) {
      feedback = "Good bicep display. Try to maintain a 90-degree angle at the elbow for maximum peak.";
    } else if (score >= 70) {
      feedback = "Decent bicep display. Focus on contracting harder and positioning your arms at the optimal angle.";
    } else {
      feedback = "Work on your arm positioning to better display your biceps. Aim for a 90-degree bend at the elbow.";
    }
    
    return {
      name: "biceps",
      score,
      feedback
    };
  }
  
  // Add other muscle group analysis methods (similar structure)
  private analyzeShoulders(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "shoulders",
      score: 80,
      feedback: "Good shoulder display. Try to raise your shoulders slightly higher for better definition."
    };
  }
  
  private analyzeQuads(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "quadriceps",
      score: 75,
      feedback: "Decent quad display. Flex your quads harder and ensure your stance highlights their development."
    };
  }
  
  private analyzeChest(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "chest",
      score: 85,
      feedback: "Good chest display. Push your chest out more and contract harder for better definition."
    };
  }
  
  private analyzeArms(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "arms",
      score: 80,
      feedback: "Good arm display. Focus on contracting both biceps and triceps simultaneously."
    };
  }
  
  private analyzeLegs(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "legs",
      score: 75,
      feedback: "Decent leg display. Ensure proper stance to highlight quad sweep and hamstring development."
    };
  }
  
  private analyzeBack(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "back",
      score: 85,
      feedback: "Good back display. Spread your lats wider and contract your upper back for better V-taper."
    };
  }
  
  private analyzeGlutes(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "glutes",
      score: 70,
      feedback: "Work on glute contraction and hamstring definition by adjusting your stance slightly."
    };
  }
  
  private analyzeTriceps(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "triceps",
      score: 80,
      feedback: "Good tricep display. Extend your arm more fully and push against your side for better definition."
    };
  }
  
  private analyzeAbdominals(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "abdominals",
      score: 85,
      feedback: "Good abdominal display. Vacuum harder and contract your abs for better definition."
    };
  }
  
  private analyzeCalves(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "calves",
      score: 75,
      feedback: "Decent calf display. Point your toes more to accentuate calf development."
    };
  }
  
  private analyzeOverallPhysique(poseData: PoseData): MuscleGroupFeedback {
    // Simplified for brevity
    return {
      name: "overall physique",
      score: 80,
      feedback: "Good overall presentation. Focus on maintaining proper posture and muscle tension throughout the pose."
    };
  }
} 