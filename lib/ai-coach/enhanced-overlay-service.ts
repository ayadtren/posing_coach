import * as PIXI from 'pixi.js';
import { GlowFilter } from '@pixi/filter-glow';
import { PoseType } from './pose-analyzer';
import { PoseData } from './vision-provider';

export interface EnhancedPhysiqueData {
  height: number;
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  armLength: number;
  legLength: number;
  bodyFat: number; // Estimated body fat percentage
  muscleDefinition: number; // 0-10 scale of muscle definition
  poseKeypoints: {
    [key in PoseType]?: any[];
  };
}

// Muscle definitions for different poses
interface MuscleDefinition {
  name: string;
  points: string[]; // Keypoint names that define this muscle
  controlPoints?: number[][]; // Additional control points for bezier curves [x_offset, y_offset]
  color: string;
  highlightColor: string;
  importance: number; // 0-10 scale of how important this muscle is for the pose
}

export class EnhancedOverlayService {
  private physiqueData: EnhancedPhysiqueData | null = null;
  private currentPoseType: PoseType = PoseType.FRONT_RELAXED;
  private app: PIXI.Application | null = null;
  private container: PIXI.Container | null = null;
  private muscleGraphics: PIXI.Graphics | null = null;
  private silhouetteGraphics: PIXI.Graphics | null = null;
  private highlightGraphics: PIXI.Graphics | null = null;
  private textureCache: Map<string, PIXI.Texture> = new Map();
  
  // Muscle definitions for different poses
  private muscleMaps: Record<PoseType, MuscleDefinition[]> = {
    [PoseType.FRONT_DOUBLE_BICEPS]: [
      {
        name: 'left_bicep',
        points: ['left_shoulder', 'left_bicep_peak', 'left_elbow'],
        controlPoints: [[5, -10]],
        color: '#ff5500',
        highlightColor: '#ff8800',
        importance: 10
      },
      {
        name: 'right_bicep',
        points: ['right_shoulder', 'right_bicep_peak', 'right_elbow'],
        controlPoints: [[-5, -10]],
        color: '#ff5500',
        highlightColor: '#ff8800',
        importance: 10
      },
      {
        name: 'left_chest',
        points: ['left_shoulder', 'sternum', 'solar_plexus', 'left_serratus'],
        color: '#ff0066',
        highlightColor: '#ff3399',
        importance: 8
      },
      {
        name: 'right_chest',
        points: ['right_shoulder', 'sternum', 'solar_plexus', 'right_serratus'],
        color: '#ff0066',
        highlightColor: '#ff3399',
        importance: 8
      },
      {
        name: 'abs',
        points: ['solar_plexus', 'upper_abs', 'mid_abs', 'lower_abs'],
        color: '#00aaff',
        highlightColor: '#66ccff',
        importance: 7
      },
      {
        name: 'left_quad',
        points: ['left_hip', 'left_quad', 'left_knee'],
        color: '#33cc33',
        highlightColor: '#66ff66',
        importance: 6
      },
      {
        name: 'right_quad',
        points: ['right_hip', 'right_quad', 'right_knee'],
        color: '#33cc33',
        highlightColor: '#66ff66',
        importance: 6
      }
    ],
    [PoseType.FRONT_RELAXED]: [
      {
        name: 'left_shoulder',
        points: ['left_shoulder', 'left_delt_front', 'left_delt_mid'],
        color: '#3498db',
        highlightColor: '#5dade2',
        importance: 7
      },
      {
        name: 'right_shoulder',
        points: ['right_shoulder', 'right_delt_front', 'right_delt_mid'],
        color: '#3498db',
        highlightColor: '#5dade2',
        importance: 7
      },
      {
        name: 'left_chest',
        points: ['left_shoulder', 'sternum', 'solar_plexus', 'left_serratus'],
        color: '#2ecc71',
        highlightColor: '#58d68d',
        importance: 8
      },
      {
        name: 'right_chest',
        points: ['right_shoulder', 'sternum', 'solar_plexus', 'right_serratus'],
        color: '#2ecc71',
        highlightColor: '#58d68d',
        importance: 8
      },
      {
        name: 'abs',
        points: ['solar_plexus', 'upper_abs', 'mid_abs', 'lower_abs'],
        color: '#f1c40f',
        highlightColor: '#f4d03f',
        importance: 9
      },
      {
        name: 'left_quad',
        points: ['left_hip', 'left_quad', 'left_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 6
      },
      {
        name: 'right_quad',
        points: ['right_hip', 'right_quad', 'right_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 6
      }
    ],
    [PoseType.BACK_DOUBLE_BICEPS]: [
      {
        name: 'left_lat',
        points: ['left_shoulder', 'left_lat_upper', 'left_lat_mid', 'left_lat_lower', 'left_hip'],
        color: '#9b59b6',
        highlightColor: '#af7ac5',
        importance: 10
      },
      {
        name: 'right_lat',
        points: ['right_shoulder', 'right_lat_upper', 'right_lat_mid', 'right_lat_lower', 'right_hip'],
        color: '#9b59b6',
        highlightColor: '#af7ac5',
        importance: 10
      },
      {
        name: 'traps',
        points: ['left_shoulder', 'left_trap_upper', 'neck', 'right_trap_upper', 'right_shoulder'],
        color: '#3498db',
        highlightColor: '#5dade2',
        importance: 8
      },
      {
        name: 'left_bicep',
        points: ['left_shoulder', 'left_bicep_peak', 'left_elbow'],
        controlPoints: [[5, -10]],
        color: '#ff5500',
        highlightColor: '#ff8800',
        importance: 9
      },
      {
        name: 'right_bicep',
        points: ['right_shoulder', 'right_bicep_peak', 'right_elbow'],
        controlPoints: [[-5, -10]],
        color: '#ff5500',
        highlightColor: '#ff8800',
        importance: 9
      }
    ],
    [PoseType.SIDE_CHEST]: [
      {
        name: 'chest',
        points: ['right_shoulder', 'sternum', 'solar_plexus', 'right_serratus'],
        color: '#2ecc71',
        highlightColor: '#58d68d',
        importance: 10
      },
      {
        name: 'bicep',
        points: ['right_shoulder', 'right_bicep_peak', 'right_elbow'],
        controlPoints: [[0, -10]],
        color: '#ff5500',
        highlightColor: '#ff8800',
        importance: 9
      },
      {
        name: 'tricep',
        points: ['right_shoulder', 'right_tricep_peak', 'right_elbow'],
        color: '#9b59b6',
        highlightColor: '#af7ac5',
        importance: 8
      },
      {
        name: 'quad',
        points: ['right_hip', 'right_quad', 'right_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 7
      }
    ],
    [PoseType.SIDE_TRICEPS]: [
      {
        name: 'tricep',
        points: ['right_shoulder', 'right_tricep_peak', 'right_elbow'],
        color: '#9b59b6',
        highlightColor: '#af7ac5',
        importance: 10
      },
      {
        name: 'shoulder',
        points: ['neck', 'right_shoulder', 'right_delt_mid'],
        color: '#3498db',
        highlightColor: '#5dade2',
        importance: 8
      },
      {
        name: 'quad',
        points: ['right_hip', 'right_quad', 'right_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 7
      },
      {
        name: 'hamstring',
        points: ['right_hip', 'right_hamstring', 'right_knee'],
        color: '#f1c40f',
        highlightColor: '#f4d03f',
        importance: 7
      }
    ],
    [PoseType.ABDOMINAL_AND_THIGH]: [
      {
        name: 'abs',
        points: ['solar_plexus', 'upper_abs', 'mid_abs', 'lower_abs'],
        color: '#f1c40f',
        highlightColor: '#f4d03f',
        importance: 10
      },
      {
        name: 'left_oblique',
        points: ['left_serratus', 'left_oblique', 'left_hip'],
        color: '#e67e22',
        highlightColor: '#eb984e',
        importance: 9
      },
      {
        name: 'right_oblique',
        points: ['right_serratus', 'right_oblique', 'right_hip'],
        color: '#e67e22',
        highlightColor: '#eb984e',
        importance: 9
      },
      {
        name: 'left_quad',
        points: ['left_hip', 'left_quad', 'left_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 8
      },
      {
        name: 'right_quad',
        points: ['right_hip', 'right_quad', 'right_knee'],
        color: '#e74c3c',
        highlightColor: '#ec7063',
        importance: 8
      }
    ]
  };
  
  constructor() {}
  
  /**
   * Initialize the PIXI application
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.app = new PIXI.Application({
      view: canvas as HTMLCanvasElement,
      width: canvas.width,
      height: canvas.height,
      backgroundAlpha: 0,
      antialias: true
    });
    
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    // Create graphics layers
    this.silhouetteGraphics = new PIXI.Graphics();
    this.muscleGraphics = new PIXI.Graphics();
    this.highlightGraphics = new PIXI.Graphics();
    
    // Add glow filter to highlights
    const glowFilter = new GlowFilter({
      distance: 15,
      outerStrength: 2,
      innerStrength: 1,
      color: 0xffffff,
      quality: 0.5
    }) as unknown as PIXI.Filter;
    
    this.highlightGraphics.filters = [glowFilter];
    
    // Add layers to container
    this.container.addChild(this.silhouetteGraphics);
    this.container.addChild(this.muscleGraphics);
    this.container.addChild(this.highlightGraphics);
  }
  
  /**
   * Set the user's physique data
   */
  setPhysiqueData(data: EnhancedPhysiqueData): void {
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
  generateOverlay(currentPoseData: PoseData, canvasWidth: number, canvasHeight: number): void {
    if (!this.app || !this.container || !this.muscleGraphics || !this.silhouetteGraphics || !this.highlightGraphics) {
      console.error('PIXI application not initialized');
      return;
    }
    
    if (!this.hasPhysiqueDataForCurrentPose()) {
      console.error('Physique data not available for the current pose type');
      return;
    }
    
    // Resize canvas if needed
    if (this.app.renderer.width !== canvasWidth || this.app.renderer.height !== canvasHeight) {
      this.app.renderer.resize(canvasWidth, canvasHeight);
    }
    
    // Clear previous drawings
    this.silhouetteGraphics.clear();
    this.muscleGraphics.clear();
    this.highlightGraphics.clear();
    
    // Get the ideal keypoints for the current pose type
    const idealKeypoints = this.physiqueData!.poseKeypoints[this.currentPoseType]!;
    
    // Scale and position the ideal keypoints based on the current pose
    const scaledKeypoints = this.scaleKeypoints(idealKeypoints, currentPoseData, canvasWidth, canvasHeight);
    
    // Draw the body silhouette
    this.drawBodySilhouette(scaledKeypoints);
    
    // Draw muscle groups
    this.drawMuscleGroups(scaledKeypoints);
    
    // Draw highlights and definition
    this.drawMuscleHighlights(scaledKeypoints);
    
    // Draw alignment indicators
    this.drawAlignmentIndicators(scaledKeypoints, currentPoseData);
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
   * Draw the body silhouette as a base layer
   */
  private drawBodySilhouette(keypoints: any[]): void {
    if (!this.silhouetteGraphics) return;
    
    // Clear previous drawing
    this.silhouetteGraphics.clear();
    
    // Create a gradient fill for the silhouette - use darker colors for more depth
    const gradientColors = ['#0a0a1a', '#141428', '#1a1a2e'];
    
    // Connect outer points to create body silhouette
    const silhouettePoints = [
      'left_shoulder', 'left_elbow', 'left_wrist', 
      'left_hip', 'left_knee', 'left_ankle',
      'right_ankle', 'right_knee', 'right_hip',
      'right_wrist', 'right_elbow', 'right_shoulder'
    ];
    
    // Collect valid points
    const validPoints: {x: number, y: number, name: string}[] = [];
    silhouettePoints.forEach(pointName => {
      const point = keypoints.find(kp => kp.name === pointName);
      if (point) {
        validPoints.push({x: point.x, y: point.y, name: pointName});
      }
    });
    
    // Only proceed if we have enough points
    if (validPoints.length < 6) return;
    
    // Calculate center point for radial gradient
    const centerX = validPoints.reduce((sum, p) => sum + p.x, 0) / validPoints.length;
    const centerY = validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length;
    
    // Calculate the average radius for the silhouette
    let totalDistance = 0;
    validPoints.forEach(point => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    });
    const avgRadius = totalDistance / validPoints.length;
    
    // Create a radial gradient for 3D effect
    const gradientTexture = this.createRadialGradientTexture(
      gradientColors,
      centerX, centerY,
      avgRadius * 1.5,
      400, 400
    );
    
    // Begin fill with semi-transparent color
    this.silhouetteGraphics.beginFill(0x0a0a1a, 0.75);
    
    // Start the path with the first point
    this.silhouetteGraphics.moveTo(validPoints[0].x, validPoints[0].y);
    
    // Use bezier curves for smoother body outline
    for (let i = 1; i < validPoints.length; i++) {
      const current = validPoints[i];
      const prev = validPoints[i-1];
      
      // For certain body parts, use bezier curves for more natural contours
      if (
        (prev.name.includes('shoulder') && current.name.includes('elbow')) ||
        (prev.name.includes('elbow') && current.name.includes('wrist')) ||
        (prev.name.includes('hip') && current.name.includes('knee')) ||
        (prev.name.includes('knee') && current.name.includes('ankle'))
      ) {
        // Calculate control point for bezier curve
        // Add slight outward curve for more natural body shape
        const dx = current.x - prev.x;
        const dy = current.y - prev.y;
        const midX = (prev.x + current.x) / 2;
        const midY = (prev.y + current.y) / 2;
        
        // Calculate perpendicular direction for control point
        const perpX = -dy;
        const perpY = dx;
        const perpLength = Math.sqrt(perpX*perpX + perpY*perpY);
        
        // Normalize and scale
        const curveFactor = 0.2; // Adjust for more/less curve
        const cpX = midX + (perpX / perpLength) * Math.abs(dx) * curveFactor;
        const cpY = midY + (perpY / perpLength) * Math.abs(dy) * curveFactor;
        
        // Draw bezier curve
        this.silhouetteGraphics.quadraticCurveTo(cpX, cpY, current.x, current.y);
      } else {
        // For other connections, use simple lines
        this.silhouetteGraphics.lineTo(current.x, current.y);
      }
    }
    
    // Close the path back to the first point
    this.silhouetteGraphics.closePath();
    this.silhouetteGraphics.fill();
    
    // Add a subtle outline with slight glow effect
    this.silhouetteGraphics.lineStyle(1.5, 0x333366, 0.6);
    this.silhouetteGraphics.stroke();
    
    // Add a second, thinner outline for depth
    this.silhouetteGraphics.lineStyle(0.5, 0x6666aa, 0.3);
    this.silhouetteGraphics.stroke();
    
    // Add subtle body contour lines for more definition
    this.addBodyContourLines(validPoints, centerX, centerY);
  }
  
  /**
   * Add subtle contour lines to the body silhouette for more definition
   */
  private addBodyContourLines(
    points: {x: number, y: number, name: string}[],
    centerX: number,
    centerY: number
  ): void {
    if (!this.silhouetteGraphics) return;
    
    // Set style for contour lines
    this.silhouetteGraphics.lineStyle(0.5, 0x4444aa, 0.2);
    
    // Add a few contour lines based on the pose type
    switch (this.currentPoseType) {
      case PoseType.FRONT_DOUBLE_BICEPS:
      case PoseType.FRONT_RELAXED:
        // Add abdominal definition lines
        this.drawAbdominalLines(points, centerX, centerY);
        break;
        
      case PoseType.BACK_DOUBLE_BICEPS:
        // Add back definition lines
        this.drawBackLines(points, centerX, centerY);
        break;
        
      case PoseType.SIDE_CHEST:
      case PoseType.SIDE_TRICEPS:
        // Add side definition lines
        this.drawSideLines(points, centerX, centerY);
        break;
        
      case PoseType.ABDOMINAL_AND_THIGH:
        // Add detailed abdominal and thigh lines
        this.drawAbdominalLines(points, centerX, centerY);
        this.drawThighLines(points, centerX, centerY);
        break;
    }
  }
  
  /**
   * Draw abdominal definition lines
   */
  private drawAbdominalLines(
    points: {x: number, y: number, name: string}[],
    centerX: number,
    centerY: number
  ): void {
    if (!this.silhouetteGraphics) return;
    
    // Find key points
    const leftHip = points.find(p => p.name === 'left_hip');
    const rightHip = points.find(p => p.name === 'right_hip');
    const leftShoulder = points.find(p => p.name === 'left_shoulder');
    const rightShoulder = points.find(p => p.name === 'right_shoulder');
    
    if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return;
    
    // Calculate midpoints
    const midHipX = (leftHip.x + rightHip.x) / 2;
    const midHipY = (leftHip.y + rightHip.y) / 2;
    const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // Draw central abdominal line
    this.silhouetteGraphics.moveTo(midShoulderX, midShoulderY + (midHipY - midShoulderY) * 0.3);
    this.silhouetteGraphics.lineTo(midHipX, midHipY);
    
    // Draw horizontal abdominal lines (like a six-pack)
    const abHeight = midHipY - midShoulderY;
    const abWidth = (rightHip.x - leftHip.x) * 0.6;
    
    for (let i = 1; i <= 3; i++) {
      const y = midShoulderY + (abHeight * i * 0.25);
      const curveY = y + (Math.random() * 5 - 2.5); // Slight randomness
      
      // Draw curved line
      this.silhouetteGraphics.moveTo(midShoulderX - abWidth/2, curveY);
      this.silhouetteGraphics.quadraticCurveTo(
        midShoulderX, curveY + 5,
        midShoulderX + abWidth/2, curveY
      );
    }
  }
  
  /**
   * Draw back definition lines
   */
  private drawBackLines(
    points: {x: number, y: number, name: string}[],
    centerX: number,
    centerY: number
  ): void {
    if (!this.silhouetteGraphics) return;
    
    // Find key points
    const leftShoulder = points.find(p => p.name === 'left_shoulder');
    const rightShoulder = points.find(p => p.name === 'right_shoulder');
    const leftHip = points.find(p => p.name === 'left_hip');
    const rightHip = points.find(p => p.name === 'right_hip');
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
    
    // Calculate midpoints
    const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const midHipX = (leftHip.x + rightHip.x) / 2;
    const midHipY = (leftHip.y + rightHip.y) / 2;
    
    // Draw central back line (spine)
    this.silhouetteGraphics.moveTo(midShoulderX, midShoulderY);
    this.silhouetteGraphics.lineTo(midHipX, midHipY);
    
    // Draw lat lines
    this.silhouetteGraphics.moveTo(midShoulderX, midShoulderY + (midHipY - midShoulderY) * 0.3);
    this.silhouetteGraphics.quadraticCurveTo(
      leftShoulder.x + (midShoulderX - leftShoulder.x) * 0.5,
      midShoulderY + (midHipY - midShoulderY) * 0.4,
      leftHip.x + (midHipX - leftHip.x) * 0.7,
      midHipY - (midHipY - midShoulderY) * 0.1
    );
    
    this.silhouetteGraphics.moveTo(midShoulderX, midShoulderY + (midHipY - midShoulderY) * 0.3);
    this.silhouetteGraphics.quadraticCurveTo(
      rightShoulder.x + (midShoulderX - rightShoulder.x) * 0.5,
      midShoulderY + (midHipY - midShoulderY) * 0.4,
      rightHip.x + (midHipX - rightHip.x) * 0.7,
      midHipY - (midHipY - midShoulderY) * 0.1
    );
  }
  
  /**
   * Draw side definition lines
   */
  private drawSideLines(
    points: {x: number, y: number, name: string}[],
    centerX: number,
    centerY: number
  ): void {
    if (!this.silhouetteGraphics) return;
    
    // Find key points (assuming right side pose)
    const rightShoulder = points.find(p => p.name === 'right_shoulder');
    const rightHip = points.find(p => p.name === 'right_hip');
    
    if (!rightShoulder || !rightHip) return;
    
    // Draw serratus lines
    const serratusStartX = rightShoulder.x - (rightShoulder.x - rightHip.x) * 0.2;
    const serratusStartY = rightShoulder.y + (rightHip.y - rightShoulder.y) * 0.3;
    
    for (let i = 0; i < 3; i++) {
      const offsetY = i * 15;
      this.silhouetteGraphics.moveTo(serratusStartX, serratusStartY + offsetY);
      this.silhouetteGraphics.quadraticCurveTo(
        serratusStartX - 15,
        serratusStartY + offsetY + 5,
        serratusStartX - 5,
        serratusStartY + offsetY + 15
      );
    }
    
    // Draw oblique line
    this.silhouetteGraphics.moveTo(rightShoulder.x, rightShoulder.y + (rightHip.y - rightShoulder.y) * 0.5);
    this.silhouetteGraphics.quadraticCurveTo(
      rightShoulder.x - (rightShoulder.x - rightHip.x) * 0.3,
      rightShoulder.y + (rightHip.y - rightShoulder.y) * 0.7,
      rightHip.x,
      rightHip.y
    );
  }
  
  /**
   * Draw thigh definition lines
   */
  private drawThighLines(
    points: {x: number, y: number, name: string}[],
    centerX: number,
    centerY: number
  ): void {
    if (!this.silhouetteGraphics) return;
    
    // Find key points
    const leftHip = points.find(p => p.name === 'left_hip');
    const rightHip = points.find(p => p.name === 'right_hip');
    const leftKnee = points.find(p => p.name === 'left_knee');
    const rightKnee = points.find(p => p.name === 'right_knee');
    
    if (!leftHip || !rightHip || !leftKnee || !rightKnee) return;
    
    // Draw quad separation lines
    // Left quad
    this.silhouetteGraphics.moveTo(leftHip.x + (centerX - leftHip.x) * 0.3, leftHip.y + (leftKnee.y - leftHip.y) * 0.2);
    this.silhouetteGraphics.quadraticCurveTo(
      leftHip.x + (centerX - leftHip.x) * 0.4,
      leftHip.y + (leftKnee.y - leftHip.y) * 0.5,
      leftKnee.x + (centerX - leftKnee.x) * 0.3,
      leftKnee.y - (leftKnee.y - leftHip.y) * 0.1
    );
    
    // Right quad
    this.silhouetteGraphics.moveTo(rightHip.x + (centerX - rightHip.x) * 0.3, rightHip.y + (rightKnee.y - rightHip.y) * 0.2);
    this.silhouetteGraphics.quadraticCurveTo(
      rightHip.x + (centerX - rightHip.x) * 0.4,
      rightHip.y + (rightKnee.y - rightHip.y) * 0.5,
      rightKnee.x + (centerX - rightKnee.x) * 0.3,
      rightKnee.y - (rightKnee.y - rightHip.y) * 0.1
    );
  }
  
  /**
   * Draw muscle groups with realistic contours and shading
   */
  private drawMuscleGroups(keypoints: any[]): void {
    if (!this.muscleGraphics) return;
    
    // Get muscle definitions for the current pose
    const muscleDefinitions = this.muscleMaps[this.currentPoseType] || [];
    
    // Draw each muscle group
    muscleDefinitions.forEach(muscle => {
      const points: {x: number, y: number}[] = [];
      
      // Collect all valid points
      muscle.points.forEach(pointName => {
        const point = keypoints.find(kp => kp.name === pointName);
        if (point) {
          points.push({x: point.x, y: point.y});
        }
      });
      
      // Only draw if we have enough points
      if (points.length >= 3) {
        // Calculate center point for radial gradient
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        // Create a radial gradient texture for 3D effect
        const baseColor = muscle.color;
        const highlightColor = muscle.highlightColor;
        const shadowColor = this.darkenColor(baseColor, 0.7); // Darker version for shadow
        
        // Create a radial gradient texture
        const gradientTexture = this.createRadialGradientTexture(
          [highlightColor, baseColor, shadowColor],
          centerX, centerY, 
          Math.max(50, this.calculateMuscleRadius(points, centerX, centerY) * 1.2),
          200, 200
        );
        
        // Begin fill with the base color as fallback
        const color = parseInt(muscle.color.replace('#', '0x'));
        this.muscleGraphics!.beginFill(color, 0.85);
        
        // Start the path
        this.muscleGraphics!.moveTo(points[0].x, points[0].y);
        
        // Use bezier curves for smoother, more natural muscle shapes
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i+1].x) / 2;
          const yc = (points[i].y + points[i+1].y) / 2;
          
          // If we have control points, use them to create more natural curves
          if (muscle.controlPoints && muscle.controlPoints[i-1]) {
            const cp = muscle.controlPoints[i-1];
            const cpx = points[i].x + cp[0];
            const cpy = points[i].y + cp[1];
            
            // Enhanced bezier curve for more natural muscle shape
            this.muscleGraphics!.bezierCurveTo(
              cpx, cpy,
              cpx, cpy,
              xc, yc
            );
          } else {
            // Add slight randomness to the curve for more organic look
            const randomFactor = 0.05;
            const randomX = xc + (Math.random() * 2 - 1) * randomFactor * (points[i+1].x - points[i].x);
            const randomY = yc + (Math.random() * 2 - 1) * randomFactor * (points[i+1].y - points[i].y);
            
            this.muscleGraphics!.quadraticCurveTo(points[i].x, points[i].y, randomX, randomY);
          }
        }
        
        // Complete the curve
        this.muscleGraphics!.quadraticCurveTo(
          points[points.length-1].x, 
          points[points.length-1].y, 
          points[0].x, 
          points[0].y
        );
        
        this.muscleGraphics!.closePath();
        this.muscleGraphics!.fill();
        
        // Add a subtle outline with variable thickness based on muscle importance
        const lineThickness = Math.max(0.5, Math.min(2, muscle.importance / 5));
        this.muscleGraphics!.lineStyle(lineThickness, parseInt(this.darkenColor(muscle.color, 0.6).replace('#', '0x')), 0.7);
        this.muscleGraphics!.stroke();
        
        // Add muscle striations for more definition
        if (muscle.importance > 5) {
          this.drawMuscleStriations(points, centerX, centerY, muscle);
        }
      }
    });
  }
  
  /**
   * Draw muscle striations (definition lines) within a muscle
   */
  private drawMuscleStriations(
    points: {x: number, y: number}[], 
    centerX: number, 
    centerY: number, 
    muscle: MuscleDefinition
  ): void {
    if (!this.muscleGraphics) return;
    
    // Number of striation lines based on muscle importance
    const numStriations = Math.max(2, Math.floor(muscle.importance / 2));
    
    // Calculate the average distance from center to points
    const avgRadius = this.calculateMuscleRadius(points, centerX, centerY);
    
    // Draw striation lines
    const striationColor = parseInt(this.darkenColor(muscle.color, 0.8).replace('#', '0x'));
    this.muscleGraphics.lineStyle(0.5, striationColor, 0.5);
    
    for (let i = 0; i < numStriations; i++) {
      // Calculate angle for this striation
      const angle = (Math.PI * 2 * i) / numStriations;
      
      // Calculate start and end points
      const startDistance = avgRadius * 0.3; // Start closer to center
      const endDistance = avgRadius * 0.9; // End near the edge
      
      const startX = centerX + Math.cos(angle) * startDistance;
      const startY = centerY + Math.sin(angle) * startDistance;
      
      const endX = centerX + Math.cos(angle) * endDistance;
      const endY = centerY + Math.sin(angle) * endDistance;
      
      // Draw curved striation line
      this.muscleGraphics.moveTo(startX, startY);
      
      // Add slight curve to the striation
      const controlAngle = angle + (Math.random() * 0.4 - 0.2); // Slight random variation
      const controlDistance = avgRadius * 0.6;
      const controlX = centerX + Math.cos(controlAngle) * controlDistance;
      const controlY = centerY + Math.sin(controlAngle) * controlDistance;
      
      this.muscleGraphics.quadraticCurveTo(controlX, controlY, endX, endY);
    }
  }
  
  /**
   * Calculate the average radius of a muscle (distance from center to points)
   */
  private calculateMuscleRadius(
    points: {x: number, y: number}[], 
    centerX: number, 
    centerY: number
  ): number {
    let totalDistance = 0;
    
    points.forEach(point => {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    });
    
    return totalDistance / points.length;
  }
  
  /**
   * Create a radial gradient texture for 3D muscle effect
   */
  private createRadialGradientTexture(
    colors: string[], 
    centerX: number, 
    centerY: number, 
    radius: number,
    width: number, 
    height: number
  ): PIXI.Texture {
    // Check if we already have this gradient in cache
    const cacheKey = `radial-${colors.join('-')}-${centerX.toFixed(0)}-${centerY.toFixed(0)}-${radius.toFixed(0)}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }
    
    // Create a canvas for the gradient
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.1, // Inner circle
      centerX, centerY, radius        // Outer circle
    );
    
    // Add color stops
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create texture from canvas
    const texture = PIXI.Texture.from(canvas);
    
    // Cache the texture
    this.textureCache.set(cacheKey, texture);
    
    return texture;
  }
  
  /**
   * Darken a color by a specified factor
   */
  private darkenColor(color: string, factor: number): string {
    // Remove the # if present
    const hex = color.replace('#', '');
    
    // Parse the hex color
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken each component
    const darkenedR = Math.floor(r * factor);
    const darkenedG = Math.floor(g * factor);
    const darkenedB = Math.floor(b * factor);
    
    // Convert back to hex
    return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * Draw muscle highlights and definition lines
   */
  private drawMuscleHighlights(keypoints: any[]): void {
    if (!this.highlightGraphics) return;
    
    // Get muscle definitions for the current pose
    const muscleDefinitions = this.muscleMaps[this.currentPoseType] || [];
    
    // Draw highlights for each muscle group
    muscleDefinitions.forEach(muscle => {
      const points: {x: number, y: number}[] = [];
      
      // Collect all valid points
      muscle.points.forEach(pointName => {
        const point = keypoints.find(kp => kp.name === pointName);
        if (point) {
          points.push({x: point.x, y: point.y});
        }
      });
      
      // Only draw if we have enough points
      if (points.length >= 3) {
        // Calculate center point of the muscle
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        // Calculate the average radius of the muscle
        const avgRadius = this.calculateMuscleRadius(points, centerX, centerY);
        
        // Parse highlight color
        const highlightColorHex = parseInt(muscle.highlightColor.replace('#', '0x'));
        
        // Draw peak contraction highlight
        if (muscle.importance >= 6) {
          // Create a glow effect for the peak contraction point
          const glowRadius = avgRadius * 0.4;
          const glowAlpha = 0.3;
          
          // Draw multiple concentric circles with decreasing alpha for glow effect
          for (let i = 0; i < 3; i++) {
            const radius = glowRadius * (1 - i * 0.2);
            const alpha = glowAlpha * (1 - i * 0.2);
            
            this.highlightGraphics!.beginFill(highlightColorHex, alpha);
            this.highlightGraphics!.drawCircle(centerX, centerY, radius);
            this.highlightGraphics!.endFill();
          }
          
          // Add a smaller, brighter highlight at the center
          this.highlightGraphics!.beginFill(highlightColorHex, 0.7);
          this.highlightGraphics!.drawCircle(centerX, centerY, glowRadius * 0.3);
          this.highlightGraphics!.endFill();
        }
        
        // Draw definition lines with varying thickness and intensity
        const numDefinitionLines = Math.max(2, Math.floor(muscle.importance / 1.5));
        
        for (let i = 0; i < numDefinitionLines; i++) {
          // Vary line thickness based on importance
          const lineThickness = 0.5 + (muscle.importance / 20);
          const lineAlpha = 0.4 + (muscle.importance / 30);
          
          this.highlightGraphics!.lineStyle(lineThickness, highlightColorHex, lineAlpha);
          
          // Create curved definition lines at different positions in the muscle
          const startIdx = i % points.length;
          const endIdx = (startIdx + Math.floor(points.length / 2)) % points.length;
          
          const startPoint = points[startIdx];
          const endPoint = points[endIdx];
          
          // Create a curved line for muscle definition
          this.highlightGraphics!.moveTo(startPoint.x, startPoint.y);
          
          // Calculate control points for a more natural curve
          // Use the muscle center but offset it to create a more natural curve
          const angleToCenter = Math.atan2(centerY - startPoint.y, centerX - startPoint.x);
          const distanceToCenter = Math.sqrt(
            Math.pow(centerX - startPoint.x, 2) + 
            Math.pow(centerY - startPoint.y, 2)
          );
          
          // Create an offset from the center for the control point
          const offsetFactor = 0.3 + (Math.random() * 0.2); // Random variation
          const cpX = centerX - Math.cos(angleToCenter) * distanceToCenter * offsetFactor;
          const cpY = centerY - Math.sin(angleToCenter) * distanceToCenter * offsetFactor;
          
          this.highlightGraphics!.quadraticCurveTo(cpX, cpY, endPoint.x, endPoint.y);
        }
        
        // Add muscle separation lines for more definition
        if (muscle.importance >= 7) {
          this.drawMuscleSeparationLines(points, centerX, centerY, muscle);
        }
      }
    });
  }
  
  /**
   * Draw muscle separation lines for enhanced definition
   */
  private drawMuscleSeparationLines(
    points: {x: number, y: number}[], 
    centerX: number, 
    centerY: number, 
    muscle: MuscleDefinition
  ): void {
    if (!this.highlightGraphics) return;
    
    // Calculate the average radius of the muscle
    const avgRadius = this.calculateMuscleRadius(points, centerX, centerY);
    
    // Parse highlight color and create a darker version for separation lines
    const highlightColor = muscle.highlightColor;
    const separationColor = parseInt(this.darkenColor(highlightColor, 0.6).replace('#', '0x'));
    
    // Draw separation lines
    this.highlightGraphics.lineStyle(0.7, separationColor, 0.6);
    
    // Number of separation lines based on muscle importance
    const numLines = Math.max(1, Math.floor(muscle.importance / 3));
    
    for (let i = 0; i < numLines; i++) {
      // Calculate angle for this separation line
      const angle = (Math.PI * i) / numLines;
      
      // Calculate start and end points
      // Start from edge and go through center to other edge
      const startX = centerX + Math.cos(angle) * avgRadius * 0.9;
      const startY = centerY + Math.sin(angle) * avgRadius * 0.9;
      
      const endX = centerX - Math.cos(angle) * avgRadius * 0.9;
      const endY = centerY - Math.sin(angle) * avgRadius * 0.9;
      
      // Draw slightly curved separation line
      this.highlightGraphics.moveTo(startX, startY);
      
      // Add slight curve to the separation line
      const perpAngle = angle + Math.PI/2;
      const curveOffset = avgRadius * 0.1;
      const controlX = centerX + Math.cos(perpAngle) * curveOffset;
      const controlY = centerY + Math.sin(perpAngle) * curveOffset;
      
      this.highlightGraphics.quadraticCurveTo(controlX, controlY, endX, endY);
    }
  }
  
  /**
   * Draw alignment indicators to show how to adjust pose
   */
  private drawAlignmentIndicators(idealKeypoints: any[], currentPoseData: PoseData): void {
    if (!this.highlightGraphics) return;
    
    // Key points to check alignment for
    const alignmentPoints = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
    
    alignmentPoints.forEach(pointName => {
      const idealPoint = idealKeypoints.find(kp => kp.name === pointName);
      const currentPoint = currentPoseData.keypoints.find(kp => kp.name === pointName);
      
      if (idealPoint && currentPoint && currentPoint.score > 0.5) {
        // Calculate deviation
        const dx = idealPoint.x - currentPoint.x;
        const dy = idealPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Only show indicator if deviation is significant
        if (distance > 15) {
          // Determine color based on distance (red for large deviations, green for small)
          let color;
          let alpha;
          
          if (distance > 50) {
            // Major deviation - red
            color = 0xff3333;
            alpha = 0.9;
          } else if (distance > 30) {
            // Medium deviation - orange
            color = 0xff9933;
            alpha = 0.8;
          } else {
            // Minor deviation - green
            color = 0x33cc66;
            alpha = 0.7;
          }
          
          // Draw a pulsing circle around the current point
          const pulsePhase = (Date.now() % 2000) / 2000; // 0 to 1 over 2 seconds
          const pulseSize = 1 + 0.3 * Math.sin(pulsePhase * Math.PI * 2);
          const circleRadius = Math.min(10, 5 + distance / 10) * pulseSize;
          
          // Draw circle
          this.highlightGraphics!.lineStyle(2, color, alpha);
          this.highlightGraphics!.drawCircle(currentPoint.x, currentPoint.y, circleRadius);
          
          // Draw arrow indicating direction to move
          const arrowLength = Math.min(40, distance * 0.7);
          const angle = Math.atan2(dy, dx);
          
          // Draw arrow shaft
          this.highlightGraphics!.lineStyle(3, color, alpha);
          this.highlightGraphics!.moveTo(currentPoint.x, currentPoint.y);
          this.highlightGraphics!.lineTo(
            currentPoint.x + Math.cos(angle) * arrowLength,
            currentPoint.y + Math.sin(angle) * arrowLength
          );
          
          // Draw arrowhead
          const headLength = 12;
          const headWidth = 8;
          
          // Calculate arrowhead points
          const tipX = currentPoint.x + Math.cos(angle) * arrowLength;
          const tipY = currentPoint.y + Math.sin(angle) * arrowLength;
          
          // Draw arrowhead as a filled triangle
          this.highlightGraphics!.beginFill(color, alpha);
          this.highlightGraphics!.lineStyle(0);
          
          // Start at the tip
          this.highlightGraphics!.moveTo(tipX, tipY);
          
          // Draw to the left side of the arrowhead
          this.highlightGraphics!.lineTo(
            tipX - Math.cos(angle) * headLength - Math.cos(angle + Math.PI/2) * headWidth,
            tipY - Math.sin(angle) * headLength - Math.sin(angle + Math.PI/2) * headWidth
          );
          
          // Draw to the right side of the arrowhead
          this.highlightGraphics!.lineTo(
            tipX - Math.cos(angle) * headLength - Math.cos(angle - Math.PI/2) * headWidth,
            tipY - Math.sin(angle) * headLength - Math.sin(angle - Math.PI/2) * headWidth
          );
          
          // Close the triangle
          this.highlightGraphics!.closePath();
          this.highlightGraphics!.fill();
          
          // Add a text label with the distance
          if (distance > 25) {
            // Create a text label showing the adjustment needed
            const labelText = this.createAlignmentLabel(pointName, distance);
            
            // Position the label near the arrow
            const labelX = currentPoint.x + Math.cos(angle) * (arrowLength + 15);
            const labelY = currentPoint.y + Math.sin(angle) * (arrowLength + 15);
            
            // Add a background for the text
            this.highlightGraphics!.beginFill(0x000000, 0.5);
            this.highlightGraphics!.drawRoundedRect(
              labelX - 40, labelY - 10, 
              80, 20, 
              5
            );
            this.highlightGraphics!.endFill();
            
            // We can't directly add text with PIXI.Graphics, but we can indicate where it should go
            // In a real implementation, you would add a PIXI.Text object at this position
            // For now, we'll just draw a placeholder
            this.highlightGraphics!.beginFill(color, 0.9);
            this.highlightGraphics!.drawCircle(labelX, labelY, 3);
            this.highlightGraphics!.endFill();
          }
        }
      }
    });
    
    // Check overall pose alignment (e.g., symmetry)
    this.checkOverallAlignment(idealKeypoints, currentPoseData);
  }
  
  /**
   * Create a descriptive label for alignment adjustment
   */
  private createAlignmentLabel(pointName: string, distance: number): string {
    // Format the point name to be more user-friendly
    const formattedName = pointName.replace('_', ' ');
    
    // Determine the severity of the misalignment
    let severity = '';
    if (distance > 50) {
      severity = 'major';
    } else if (distance > 30) {
      severity = 'moderate';
    } else {
      severity = 'slight';
    }
    
    return `Adjust ${formattedName} (${severity})`;
  }
  
  /**
   * Check overall pose alignment issues like symmetry
   */
  private checkOverallAlignment(idealKeypoints: any[], currentPoseData: PoseData): void {
    if (!this.highlightGraphics) return;
    
    // Check shoulder symmetry
    const leftShoulder = currentPoseData.keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = currentPoseData.keypoints.find(kp => kp.name === 'right_shoulder');
    
    if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
      // Check if shoulders are level
      const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
      
      if (shoulderHeightDiff > 20) {
        // Shoulders are not level - draw a horizontal guide line
        const avgY = (leftShoulder.y + rightShoulder.y) / 2;
        const startX = Math.min(leftShoulder.x, rightShoulder.x) - 20;
        const endX = Math.max(leftShoulder.x, rightShoulder.x) + 20;
        
        // Draw dashed horizontal guide line
        this.highlightGraphics.lineStyle(2, 0xffcc00, 0.7);
        this.drawDashedLine(startX, avgY, endX, avgY, 5, 5);
        
        // Draw vertical lines to show the difference
        this.highlightGraphics.lineStyle(1, 0xffcc00, 0.5);
        this.drawDashedLine(leftShoulder.x, leftShoulder.y, leftShoulder.x, avgY, 3, 3);
        this.drawDashedLine(rightShoulder.x, rightShoulder.y, rightShoulder.x, avgY, 3, 3);
      }
    }
    
    // Check hip symmetry
    const leftHip = currentPoseData.keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = currentPoseData.keypoints.find(kp => kp.name === 'right_hip');
    
    if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
      // Check if hips are level
      const hipHeightDiff = Math.abs(leftHip.y - rightHip.y);
      
      if (hipHeightDiff > 20) {
        // Hips are not level - draw a horizontal guide line
        const avgY = (leftHip.y + rightHip.y) / 2;
        const startX = Math.min(leftHip.x, rightHip.x) - 20;
        const endX = Math.max(leftHip.x, rightHip.x) + 20;
        
        // Draw dashed horizontal guide line
        this.highlightGraphics.lineStyle(2, 0xffcc00, 0.7);
        this.drawDashedLine(startX, avgY, endX, avgY, 5, 5);
        
        // Draw vertical lines to show the difference
        this.highlightGraphics.lineStyle(1, 0xffcc00, 0.5);
        this.drawDashedLine(leftHip.x, leftHip.y, leftHip.x, avgY, 3, 3);
        this.drawDashedLine(rightHip.x, rightHip.y, rightHip.x, avgY, 3, 3);
      }
    }
  }
  
  /**
   * Draw a dashed line
   */
  private drawDashedLine(
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    dashSize: number, 
    gapSize: number
  ): void {
    if (!this.highlightGraphics) return;
    
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / (dashSize + gapSize));
    const dashX = dx / dashCount;
    const dashY = dy / dashCount;
    
    let x1 = startX;
    let y1 = startY;
    
    for (let i = 0; i < dashCount; i++) {
      const x2 = x1 + dashX * dashSize / (dashSize + gapSize);
      const y2 = y1 + dashY * dashSize / (dashSize + gapSize);
      
      this.highlightGraphics.moveTo(x1, y1);
      this.highlightGraphics.lineTo(x2, y2);
      
      x1 = x1 + dashX;
      y1 = y1 + dashY;
    }
  }
  
  /**
   * Create a gradient texture for fills
   */
  private createGradientTexture(colors: string[], width: number, height: number): PIXI.Texture {
    // Check if we already have this gradient in cache
    const cacheKey = colors.join('-') + `-${width}-${height}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }
    
    // Create a canvas for the gradient
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    // Add color stops
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create texture from canvas
    const texture = PIXI.Texture.from(canvas);
    
    // Cache the texture
    this.textureCache.set(cacheKey, texture);
    
    return texture;
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true
      });
      this.app = null;
    }
    
    // Clear texture cache
    this.textureCache.forEach(texture => texture.destroy(true));
    this.textureCache.clear();
    
    this.container = null;
    this.muscleGraphics = null;
    this.silhouetteGraphics = null;
    this.highlightGraphics = null;
  }
} 