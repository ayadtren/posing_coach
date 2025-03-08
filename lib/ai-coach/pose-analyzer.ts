/**
 * Pose Analyzer
 * Analyzes bodybuilding poses and provides feedback
 */

export enum PoseType {
  FRONT_RELAXED = 0,
  FRONT_DOUBLE_BICEPS = 1,
  SIDE_CHEST = 2,
  BACK_DOUBLE_BICEPS = 3,
  SIDE_TRICEPS = 4,
  ABDOMINAL_AND_THIGH = 5,
  FRONT_LAT_SPREAD = 6,
  BACK_LAT_SPREAD = 7,
  MOST_MUSCULAR = 8
}

export enum CompetitionCategory {
  MENS_PHYSIQUE = "Men's Physique",
  CLASSIC_PHYSIQUE = "Classic Physique",
  BODYBUILDING = "Bodybuilding",
  BIKINI = "Bikini",
  FIGURE = "Figure",
  WELLNESS = "Wellness",
  WOMENS_PHYSIQUE = "Women's Physique",
  WOMENS_OPEN = "Women's Open"
}

export interface PoseAnalysis {
  type: PoseType;
  score: number;
  feedback: string[];
  muscleActivation: Record<string, number>;
}

export interface MuscleGroupFeedback {
  name: string;
  score: number;
  feedback: string;
  improvementTips: string[];
}

export interface PoseFeedback {
  id: string;
  poseType: PoseType;
  category: CompetitionCategory;
  score: number;
  feedback: string[];
  muscleActivation: Record<string, number>;
  timestamp: number;
}

export interface PoseRequirement {
  name: string;
  description: string;
}

export interface PoseData {
  keypoints: any[];
  score: number;
}

export class PoseAnalyzer {
  private currentPoseType: PoseType = PoseType.FRONT_RELAXED;
  private currentCategory: CompetitionCategory = CompetitionCategory.MENS_PHYSIQUE;
  private idealPoseKeypoints: Record<PoseType, any> = {
    [PoseType.FRONT_RELAXED]: null,
    [PoseType.FRONT_DOUBLE_BICEPS]: null,
    [PoseType.SIDE_CHEST]: null,
    [PoseType.BACK_DOUBLE_BICEPS]: null,
    [PoseType.SIDE_TRICEPS]: null,
    [PoseType.ABDOMINAL_AND_THIGH]: null,
    [PoseType.FRONT_LAT_SPREAD]: null,
    [PoseType.BACK_LAT_SPREAD]: null,
    [PoseType.MOST_MUSCULAR]: null
  };
  private lastAnalysisResult: PoseFeedback | null = null;
  private analysisHistory: PoseFeedback[] = [];
  
  // Detailed pose requirements for each pose type
  private poseRequirements: Record<PoseType, PoseRequirement[]> = {
    [PoseType.FRONT_RELAXED]: [
      { name: 'Stance', description: 'Feet should be shoulder-width apart, toes pointed slightly outward' },
      { name: 'Arms', description: 'Arms should hang naturally at sides, slightly away from body' },
      { name: 'Shoulders', description: 'Shoulders should be pulled back and down to display chest' },
      { name: 'Chest', description: 'Chest should be lifted and expanded' },
      { name: 'Abs', description: 'Abdominals should be contracted and visible' },
      { name: 'Quads', description: 'Quadriceps should be flexed and visible' }
    ],
    [PoseType.FRONT_DOUBLE_BICEPS]: [
      { name: 'Arms', description: 'Both arms should be raised with biceps fully contracted' },
      { name: 'Wrists', description: 'Wrists should be curled down to maximize bicep peak' },
      { name: 'Shoulders', description: 'Shoulders should be elevated and rotated forward' },
      { name: 'Lats', description: 'Lats should be spread wide to create V-taper' },
      { name: 'Legs', description: 'Legs should be spread shoulder-width apart with quads flexed' },
      { name: 'Abs', description: 'Abdominals should be contracted throughout the pose' }
    ],
    [PoseType.SIDE_CHEST]: [
      { name: 'Chest', description: 'Chest should be expanded and pushed toward the judges' },
      { name: 'Arms', description: 'Near arm should grasp far wrist/hand to contract chest' },
      { name: 'Shoulders', description: 'Near shoulder should be rotated forward to maximize width' },
      { name: 'Legs', description: 'Near leg should be bent with foot flat, far leg extended with heel raised' },
      { name: 'Waist', description: 'Waist should be tight and vacuum applied if possible' }
    ],
    [PoseType.BACK_DOUBLE_BICEPS]: [
      { name: 'Back', description: 'Back should be fully spread to show maximum width and detail' },
      { name: 'Arms', description: 'Both arms should be raised with biceps and triceps contracted' },
      { name: 'Shoulders', description: 'Shoulders should be pulled back to accentuate upper back' },
      { name: 'Legs', description: 'One leg should be extended back with hamstring and glute contracted' },
      { name: 'Calves', description: 'Calf of extended leg should be flexed and visible' }
    ],
    [PoseType.SIDE_TRICEPS]: [
      { name: 'Triceps', description: 'Near arm should be extended back with tricep fully contracted' },
      { name: 'Far Arm', description: 'Far arm should grasp the wrist of near arm to stabilize' },
      { name: 'Chest', description: 'Chest should be lifted and expanded' },
      { name: 'Waist', description: 'Waist should be pulled in tight to show taper' },
      { name: 'Legs', description: 'Near leg should be straight with heel raised, far leg bent' }
    ],
    [PoseType.ABDOMINAL_AND_THIGH]: [
      { name: 'Arms', description: 'Arms should be positioned behind head or at sides' },
      { name: 'Abs', description: 'Abdominals should be maximally contracted' },
      { name: 'Thighs', description: 'One leg should be extended forward with quadriceps flexed' },
      { name: 'Stance', description: 'Feet should be positioned to maximize thigh separation' },
      { name: 'Chest', description: 'Chest should be lifted to stretch abdominals' }
    ],
    [PoseType.FRONT_LAT_SPREAD]: [
      { name: 'Lats', description: 'Lats should be spread maximally to create width' },
      { name: 'Arms', description: 'Hands should be placed on waist with elbows flared' },
      { name: 'Shoulders', description: 'Shoulders should be depressed to accentuate trap development' },
      { name: 'Chest', description: 'Chest should be lifted and expanded' },
      { name: 'Legs', description: 'Legs should be shoulder-width apart with quads flexed' }
    ],
    [PoseType.BACK_LAT_SPREAD]: [
      { name: 'Back', description: 'Back should be spread maximally to show width and detail' },
      { name: 'Arms', description: 'Hands should be on waist with elbows flared wide' },
      { name: 'Shoulders', description: 'Shoulders should be pulled back to accentuate upper back' },
      { name: 'Legs', description: 'One leg should be extended back with hamstring and glute contracted' },
      { name: 'Waist', description: 'Waist should appear narrow to maximize V-taper' }
    ],
    [PoseType.MOST_MUSCULAR]: [
      { name: 'Traps', description: 'Traps should be elevated and contracted' },
      { name: 'Shoulders', description: 'Shoulders should be brought forward and contracted' },
      { name: 'Arms', description: 'Arms should be positioned to maximize forearm and bicep vascularity' },
      { name: 'Chest', description: 'Chest should be contracted and pushed forward' },
      { name: 'Legs', description: 'Legs should be positioned to maintain balance while flexing upper body' }
    ]
  };
  
  constructor() {
    // Initialize with default values
  }

  /**
   * Set the current pose type for analysis
   */
  setPoseType(poseType: PoseType): void {
    this.currentPoseType = poseType;
  }

  /**
   * Set the competition category for analysis
   */
  setCompetitionCategory(category: CompetitionCategory): void {
    this.currentCategory = category;
  }

  /**
   * Get the current pose type
   */
  getPoseType(): PoseType {
    return this.currentPoseType;
  }

  /**
   * Get the current competition category
   */
  getCompetitionCategory(): CompetitionCategory {
    return this.currentCategory;
  }

  /**
   * Analyze a pose and provide feedback
   */
  analyze(poseData: PoseData): PoseFeedback {
    if (!poseData || !poseData.keypoints || poseData.keypoints.length === 0) {
      return {
        id: `pose_${Date.now()}`,
        poseType: this.currentPoseType,
        category: this.currentCategory,
        score: 0,
        feedback: ["No pose detected. Please ensure you're visible in the frame."],
        muscleActivation: {},
        timestamp: Date.now()
      };
    }
    
    // Get requirements for the current pose
    const requirements = this.poseRequirements[this.currentPoseType] || [];
    
    // Calculate scores for different aspects of the pose
    const scores = this.calculatePoseScores(poseData);
    
    // Generate detailed feedback based on scores and requirements
    const detailedFeedback = this.generateDetailedFeedback(scores, requirements);
    
    // Calculate overall score (weighted average of individual scores)
    const overallScore = this.calculateOverallScore(scores);
    
    // Generate overall feedback
    const overallFeedback = this.generateOverallFeedback(overallScore, detailedFeedback);
    
    // Create feedback object
    const feedback: PoseFeedback = {
      id: `pose_${Date.now()}`,
      poseType: this.currentPoseType,
      category: this.currentCategory,
      score: overallScore,
      feedback: [overallFeedback, ...detailedFeedback],
      muscleActivation: {},
      timestamp: Date.now()
    };
    
    // Store the analysis result
    this.lastAnalysisResult = feedback;
    this.analysisHistory.push(feedback);
    
    // Limit history to last 10 analyses
    if (this.analysisHistory.length > 10) {
      this.analysisHistory.shift();
    }
    
    return feedback;
  }
  
  /**
   * Calculate scores for different aspects of the pose
   */
  private calculatePoseScores(poseData: PoseData): Record<string, number> {
    const scores: Record<string, number> = {};
    const keypoints = poseData.keypoints;
    
    // Extract key body points
    const keypointMap = keypoints.reduce((map, kp) => {
      map[kp.name] = kp;
      return map;
    }, {} as Record<string, any>);
    
    // Calculate scores based on pose type
    switch (this.currentPoseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
        // Check arm positioning
        scores.armPosition = this.calculateArmPositionScore(keypointMap);
        // Check shoulder elevation
        scores.shoulderElevation = this.calculateShoulderElevationScore(keypointMap);
        // Check lat spread
        scores.latSpread = this.calculateLatSpreadScore(keypointMap);
        // Check leg positioning
        scores.legPosition = this.calculateLegPositionScore(keypointMap);
        break;
        
      case PoseType.FRONT_RELAXED:
        // Check arm positioning
        scores.armPosition = this.calculateRelaxedArmScore(keypointMap);
        // Check shoulder positioning
        scores.shoulderPosition = this.calculateShoulderPositionScore(keypointMap);
        // Check stance
        scores.stance = this.calculateStanceScore(keypointMap);
        break;
        
      case PoseType.SIDE_CHEST:
        // Check chest expansion
        scores.chestExpansion = this.calculateChestExpansionScore(keypointMap);
        // Check arm positioning
        scores.armPosition = this.calculateSideChestArmScore(keypointMap);
        // Check leg positioning
        scores.legPosition = this.calculateSideChestLegScore(keypointMap);
        break;
        
      // Add cases for other pose types
      
      default:
        // Default scoring for any pose
        scores.bodyAlignment = this.calculateBodyAlignmentScore(keypointMap);
        scores.stability = this.calculateStabilityScore(poseData.score);
    }
    
    // Common scores for all poses
    scores.confidence = poseData.score;
    scores.symmetry = this.calculateSymmetryScore(keypointMap);
    
    return scores;
  }
  
  /**
   * Generate detailed feedback based on scores and requirements
   */
  private generateDetailedFeedback(scores: Record<string, number>, requirements: PoseRequirement[]): string[] {
    const feedback: string[] = [];
    
    // Add feedback for each requirement
    requirements.forEach(req => {
      const relatedScore = this.getRelatedScore(req.name.toLowerCase(), scores);
      let quality = "good";
      
      if (relatedScore < 0.5) {
        quality = "needs improvement";
      } else if (relatedScore < 0.8) {
        quality = "fair";
      }
      
      let feedbackText = `${req.name}: ${quality.toUpperCase()}. ${req.description}`;
      
      // Add specific advice based on score
      if (quality !== "good") {
        feedbackText += this.getSpecificAdvice(req.name.toLowerCase(), relatedScore);
      }
      
      feedback.push(feedbackText);
    });
    
    return feedback;
  }
  
  /**
   * Get a related score for a requirement
   */
  private getRelatedScore(requirement: string, scores: Record<string, number>): number {
    // Map requirements to score keys
    const scoreMap: Record<string, string[]> = {
      'arms': ['armPosition', 'armAlignment'],
      'shoulders': ['shoulderElevation', 'shoulderPosition', 'shoulderAlignment'],
      'chest': ['chestExpansion', 'chestPresentation'],
      'lats': ['latSpread', 'backWidth'],
      'legs': ['legPosition', 'legAlignment', 'stance'],
      'stance': ['stance', 'legPosition', 'stability'],
      'abs': ['abdominalContraction', 'coreStability'],
      'back': ['backSpread', 'latSpread', 'backDetail'],
      'waist': ['waistTaper', 'vacuumPose'],
      'triceps': ['tricepsContraction', 'armExtension'],
      'quads': ['quadContraction', 'legPosition'],
      'calves': ['calfFlexion', 'legExtension'],
      'thighs': ['quadContraction', 'legPosition'],
      'traps': ['trapDevelopment', 'shoulderElevation']
    };
    
    // Find relevant scores
    const relevantScoreKeys = scoreMap[requirement] || [];
    let totalScore = 0;
    let count = 0;
    
    relevantScoreKeys.forEach(key => {
      if (scores[key] !== undefined) {
        totalScore += scores[key];
        count++;
      }
    });
    
    // If no related scores found, return a default score
    if (count === 0) {
      return 0.7; // Default moderate score
    }
    
    return totalScore / count;
  }
  
  /**
   * Get specific advice based on requirement and score
   */
  private getSpecificAdvice(requirement: string, score: number): string {
    const adviceMap: Record<string, string[]> = {
      'arms': [
        ' Try to contract your biceps more forcefully.',
        ' Focus on raising your elbows slightly to peak the biceps.'
      ],
      'shoulders': [
        ' Pull your shoulders back more to expand chest width.',
        ' Elevate your shoulders more to accentuate your traps.'
      ],
      'chest': [
        ' Expand your ribcage more to push out your chest.',
        ' Rotate your shoulders back to present more chest mass.'
      ],
      'lats': [
        ' Focus on pushing your elbows into your sides to widen your lats.',
        ' Imagine spreading your back as wide as possible.'
      ],
      'legs': [
        ' Flex your quadriceps more intensely.',
        ' Position your feet slightly wider for better stability.'
      ],
      'stance': [
        ' Ensure your feet are shoulder-width apart for better balance.',
        ' Distribute your weight evenly between both feet.'
      ],
      'abs': [
        ' Contract your abdominals more forcefully throughout the pose.',
        ' Try to maintain the contraction while breathing normally.'
      ],
      'back': [
        ' Focus on pulling your elbows back to spread your lats wider.',
        ' Try to create more detail by contracting specific back muscles.'
      ],
      'waist': [
        ' Pull in your waist tighter to enhance your V-taper.',
        ' Practice the vacuum pose to minimize waist appearance.'
      ],
      'triceps': [
        ' Extend your arm more fully to maximize triceps contraction.',
        ' Lock out your elbow to show the full triceps horseshoe.'
      ]
    };
    
    const advice = adviceMap[requirement] || [' Continue practicing this aspect of the pose.'];
    
    // Return random advice from the available options
    return advice[Math.floor(Math.random() * advice.length)];
  }
  
  /**
   * Calculate overall score as weighted average
   */
  private calculateOverallScore(scores: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    // Define weights for different score components
    const weights: Record<string, number> = {
      confidence: 1.0,
      symmetry: 1.5,
      armPosition: 1.2,
      shoulderElevation: 1.0,
      latSpread: 1.2,
      legPosition: 1.0,
      chestExpansion: 1.2,
      bodyAlignment: 1.0,
      stability: 0.8
    };
    
    // Calculate weighted average
    Object.entries(scores).forEach(([key, score]) => {
      const weight = weights[key] || 1.0;
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
  
  /**
   * Generate overall feedback based on score
   */
  private generateOverallFeedback(overallScore: number, detailedFeedback: string[]): string {
    // Different feedback templates based on score ranges
    if (overallScore < 0.4) {
      return `Your ${this.getPoseName()} needs significant improvement. Focus on ${this.getTopIssues(detailedFeedback, 2)}.`;
    } else if (overallScore < 0.7) {
      return `Your ${this.getPoseName()} is developing well. To improve, work on ${this.getTopIssues(detailedFeedback, 1)}.`;
    } else {
      return `Excellent ${this.getPoseName()}! Your form is very good. For perfection, consider ${this.getTopIssues(detailedFeedback, 1)}.`;
    }
  }
  
  /**
   * Get the name of the current pose in readable format
   */
  private getPoseName(): string {
    const poseName = Object.entries(PoseType)
      .find(([key, value]) => value === this.currentPoseType)?.[0] || '';
    
    return poseName.replace(/_/g, ' ').toLowerCase();
  }
  
  /**
   * Get top issues from detailed feedback
   */
  private getTopIssues(detailedFeedback: string[], count: number): string {
    // Filter feedback that indicates issues (not "GOOD")
    const issues = detailedFeedback
      .filter(feedback => !feedback.includes('GOOD'))
      .map(feedback => {
        const colonIndex = feedback.indexOf(':');
        return colonIndex > 0 ? feedback.substring(0, colonIndex).toLowerCase() : '';
      })
      .filter(issue => issue.length > 0);
    
    // Get the requested number of issues
    const topIssues = issues.slice(0, count);
    
    if (topIssues.length === 0) {
      return "fine-tuning your overall presentation";
    } else if (topIssues.length === 1) {
      return topIssues[0];
    } else {
      return `${topIssues.slice(0, -1).join(', ')} and ${topIssues[topIssues.length - 1]}`;
    }
  }
  
  // Placeholder methods for score calculations
  // These would be implemented with actual biomechanical analysis
  private calculateArmPositionScore(keypointMap: Record<string, any>): number {
    // Simplified placeholder implementation
    return Math.random() * 0.4 + 0.6; // Random score between 0.6 and 1.0
  }
  
  private calculateShoulderElevationScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateLatSpreadScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateLegPositionScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateRelaxedArmScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateShoulderPositionScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateStanceScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateChestExpansionScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateSideChestArmScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateSideChestLegScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateBodyAlignmentScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
  
  private calculateStabilityScore(confidence: number): number {
    return confidence;
  }
  
  private calculateSymmetryScore(keypointMap: Record<string, any>): number {
    return Math.random() * 0.4 + 0.6;
  }
} 