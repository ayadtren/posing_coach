/**
 * Enhanced Muscle Visualization Service
 * Provides advanced muscle visualization with heatmap-like overlays and 3D effects
 */
import { PoseType } from './pose-analyzer';
import { PoseData } from './vision-provider';

// Define muscle activation levels for different poses
interface MuscleActivation {
  [key: string]: number; // muscle name -> activation level (0-1)
}

// Activation levels for different poses
const POSE_MUSCLE_ACTIVATION: Record<PoseType, MuscleActivation> = {
  [PoseType.FRONT_RELAXED]: {
    chest: 0.3,
    shoulders: 0.3,
    biceps: 0.2,
    triceps: 0.2,
    abs: 0.3,
    quads: 0.3,
    calves: 0.2
  },
  [PoseType.FRONT_DOUBLE_BICEPS]: {
    chest: 0.6,
    shoulders: 0.8,
    biceps: 0.9,
    triceps: 0.5,
    abs: 0.7,
    quads: 0.6,
    calves: 0.4
  },
  [PoseType.SIDE_CHEST]: {
    chest: 0.9,
    shoulders: 0.7,
    biceps: 0.6,
    triceps: 0.5,
    abs: 0.5,
    quads: 0.7,
    calves: 0.5
  },
  [PoseType.BACK_DOUBLE_BICEPS]: {
    back: 0.8,
    lats: 0.9,
    shoulders: 0.7,
    biceps: 0.8,
    triceps: 0.4,
    glutes: 0.6,
    hamstrings: 0.7,
    calves: 0.5
  },
  [PoseType.SIDE_TRICEPS]: {
    chest: 0.5,
    shoulders: 0.7,
    biceps: 0.4,
    triceps: 0.9,
    abs: 0.5,
    quads: 0.7,
    hamstrings: 0.6,
    calves: 0.5
  },
  [PoseType.ABDOMINAL_AND_THIGH]: {
    abs: 0.9,
    obliques: 0.8,
    serratus: 0.8,
    quads: 0.9,
    adductors: 0.7,
    calves: 0.5
  }
};

// Define muscle groups and their colors
export interface MuscleGroup {
  name: string;
  color: string;
  keypoints: string[];
}

// Helper function to convert hex to RGB
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export class EnhancedMuscleVisualization {
  private ctx: CanvasRenderingContext2D | null = null;
  private poseType: PoseType = PoseType.FRONT_RELAXED;
  
  /**
   * Initialize the visualization with a canvas context
   */
  initialize(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }
  
  /**
   * Set the current pose type
   */
  setPoseType(poseType: PoseType): void {
    this.poseType = poseType;
  }
  
  /**
   * Draw enhanced muscle visualization on the canvas
   */
  drawMuscleVisualization(poseData: PoseData, muscleGroups: MuscleGroup[]): void {
    if (!this.ctx) return;
    
    // Draw each muscle group
    muscleGroups.forEach(group => {
      this.drawEnhancedMuscleGroup(
        poseData, 
        group.keypoints, 
        group.color, 
        POSE_MUSCLE_ACTIVATION[this.poseType][group.name] || 0.3
      );
    });
  }
  
  /**
   * Draw an enhanced muscle group with 3D effect and heatmap-like activation visualization
   */
  private drawEnhancedMuscleGroup(
    poseData: PoseData, 
    keypointNames: string[], 
    color: string, 
    activationLevel: number = 0.5,
    alpha: number = 0.4
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const coords: {x: number, y: number}[] = [];
    
    // Collect all valid points
    for (const name of keypointNames) {
      const keypoint = poseData.keypoints.find(kp => kp.name === name);
      if (keypoint) {
        coords.push({x: keypoint.x, y: keypoint.y});
      }
    }
    
    // Only draw if we have at least 3 points
    if (coords.length < 3) return;
    
    // Create a path for the muscle group
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    
    // Use bezier curves for smoother, more natural muscle shapes
    for (let i = 1; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i+1].x) / 2;
      const yc = (coords[i].y + coords[i+1].y) / 2;
      
      // Add slight randomness for more organic look
      const randomFactor = 0.05;
      const randomX = xc + (Math.random() * 2 - 1) * randomFactor * (coords[i+1].x - coords[i].x);
      const randomY = yc + (Math.random() * 2 - 1) * randomFactor * (coords[i+1].y - coords[i].y);
      
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, randomX, randomY);
    }
    
    // Complete the curve
    ctx.quadraticCurveTo(
      coords[coords.length-1].x, 
      coords[coords.length-1].y, 
      coords[0].x, 
      coords[0].y
    );
    
    ctx.closePath();
    
    // Calculate center and radius for gradients
    const centerX = coords.reduce((sum, coord) => sum + coord.x, 0) / coords.length;
    const centerY = coords.reduce((sum, coord) => sum + coord.y, 0) / coords.length;
    
    // Find the farthest point from center for gradient radius
    const radius = Math.max(...coords.map(coord => 
      Math.sqrt(Math.pow(coord.x - centerX, 2) + Math.pow(coord.y - centerY, 2))
    ));
    
    // Convert color to RGB for better manipulation
    const baseColor = color.startsWith('#') ? color : `#${color}`;
    const rgbColor = hexToRgb(baseColor);
    
    // Create base muscle fill with enhanced 3D effect and subsurface scattering
    const baseGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.1,
      centerX, centerY, radius
    );
    
    // Enhanced color stops for more realistic muscle appearance with subsurface scattering
    baseGradient.addColorStop(0, `rgba(${rgbColor.r + 40}, ${rgbColor.g + 20}, ${rgbColor.b + 20}, ${alpha + 0.4})`);
    baseGradient.addColorStop(0.4, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${alpha + 0.2})`);
    baseGradient.addColorStop(0.7, `rgba(${rgbColor.r * 0.8}, ${rgbColor.g * 0.8}, ${rgbColor.b * 0.8}, ${alpha})`);
    baseGradient.addColorStop(1, `rgba(${rgbColor.r * 0.6}, ${rgbColor.g * 0.6}, ${rgbColor.b * 0.6}, ${alpha - 0.1})`);
    
    ctx.fillStyle = baseGradient;
    ctx.fill();
    
    // Add a more pronounced highlight for better 3D effect
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    
    for (let i = 1; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i+1].x) / 2;
      const yc = (coords[i].y + coords[i+1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    
    ctx.quadraticCurveTo(
      coords[coords.length-1].x, 
      coords[coords.length-1].y, 
      coords[0].x, 
      coords[0].y
    );
    
    ctx.closePath();
    
    // Create a directional gradient for better 3D effect (light from top-left)
    const lightAngle = Math.PI * 0.25; // 45 degrees
    const lightDirX = Math.cos(lightAngle);
    const lightDirY = Math.sin(lightAngle);
    
    // Calculate gradient start and end points based on light direction
    const gradientStartX = centerX - lightDirX * radius;
    const gradientStartY = centerY - lightDirY * radius;
    const gradientEndX = centerX + lightDirX * radius;
    const gradientEndY = centerY + lightDirY * radius;
    
    const highlightGradient = ctx.createLinearGradient(
      gradientStartX, gradientStartY,
      gradientEndX, gradientEndY
    );
    
    // Create more pronounced highlight and shadow for stronger 3D effect
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
    highlightGradient.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.3})`);
    highlightGradient.addColorStop(0.7, `rgba(${rgbColor.r * 0.5}, ${rgbColor.g * 0.5}, ${rgbColor.b * 0.5}, ${alpha * 0.1})`);
    highlightGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.5})`);
    
    ctx.fillStyle = highlightGradient;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Add more defined contour lines
    ctx.strokeStyle = `rgba(${Math.floor(rgbColor.r*0.6)}, ${Math.floor(rgbColor.g*0.6)}, ${Math.floor(rgbColor.b*0.6)}, ${alpha + 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw muscle striations
    this.drawMuscleStriations(coords, centerX, centerY, radius, rgbColor, alpha);
    
    // Draw heatmap effect based on activation level
    this.drawHeatmapEffect(coords, centerX, centerY, radius, rgbColor, activationLevel, alpha);
  }
  
  /**
   * Draw realistic muscle striations that follow muscle fiber direction
   */
  private drawMuscleStriations(
    coords: {x: number, y: number}[], 
    centerX: number, 
    centerY: number, 
    radius: number,
    rgbColor: {r: number, g: number, b: number},
    alpha: number
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const numStriations = Math.max(4, Math.min(9, Math.floor(radius / 12)));
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.lineWidth = 1;
    
    // Determine the primary direction of the muscle
    let sumX = 0, sumY = 0;
    for (let i = 0; i < coords.length; i++) {
      const nextCoord = coords[(i + 1) % coords.length];
      sumX += nextCoord.x - coords[i].x;
      sumY += nextCoord.y - coords[i].y;
    }
    
    // Normalize the direction
    const dirLength = Math.sqrt(sumX * sumX + sumY * sumY);
    const dirX = sumX / dirLength;
    const dirY = sumY / dirLength;
    
    // Perpendicular direction for striation lines
    const perpX = -dirY;
    const perpY = dirX;
    
    for (let i = 0; i < numStriations; i++) {
      // Calculate position along muscle length
      const t = (i / (numStriations - 1)) * 0.8 + 0.1; // Keep within central 80% of muscle
      const posX = centerX + (Math.random() * 0.2 - 0.1) * radius * dirX;
      const posY = centerY + (Math.random() * 0.2 - 0.1) * radius * dirY;
      
      // Calculate striation length
      const striationLength = radius * (0.5 + Math.random() * 0.3);
      
      // Calculate start and end points
      const startX = posX - perpX * striationLength / 2;
      const startY = posY - perpY * striationLength / 2;
      const endX = posX + perpX * striationLength / 2;
      const endY = posY + perpY * striationLength / 2;
      
      // Draw curved striation line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Add curve to the striation
      const controlOffset = (Math.random() * 0.3 + 0.1) * striationLength;
      const controlX = posX + dirX * controlOffset;
      const controlY = posY + dirY * controlOffset;
      
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      
      // Use white with varying opacity for more realistic striations
      const opacity = 0.1 + Math.random() * 0.15;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.stroke();
      
      // Add a shadow striation for more depth
      ctx.beginPath();
      ctx.moveTo(startX + 1, startY + 1);
      ctx.quadraticCurveTo(controlX + 1, controlY + 1, endX + 1, endY + 1);
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
      ctx.stroke();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw a heatmap-like effect to visualize muscle activation
   */
  private drawHeatmapEffect(
    coords: {x: number, y: number}[], 
    centerX: number, 
    centerY: number, 
    radius: number,
    rgbColor: {r: number, g: number, b: number},
    activationLevel: number,
    alpha: number
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Create a smaller path inside the muscle for the heatmap effect
    const scaleFactor = 0.65;
    const scaledCoords = coords.map(coord => ({
      x: centerX + (coord.x - centerX) * scaleFactor,
      y: centerY + (coord.y - centerY) * scaleFactor
    }));
    
    ctx.beginPath();
    ctx.moveTo(scaledCoords[0].x, scaledCoords[0].y);
    
    for (let i = 1; i < scaledCoords.length - 1; i++) {
      const xc = (scaledCoords[i].x + scaledCoords[i+1].x) / 2;
      const yc = (scaledCoords[i].y + scaledCoords[i+1].y) / 2;
      ctx.quadraticCurveTo(scaledCoords[i].x, scaledCoords[i].y, xc, yc);
    }
    
    ctx.quadraticCurveTo(
      scaledCoords[scaledCoords.length-1].x, 
      scaledCoords[scaledCoords.length-1].y, 
      scaledCoords[0].x, 
      scaledCoords[0].y
    );
    
    ctx.closePath();
    
    // Create a heatmap gradient based on activation level
    const heatGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.65
    );
    
    // Use a color that transitions from yellow to red based on activation
    const heatR = Math.min(255, Math.floor(255 * activationLevel));
    const heatG = Math.min(255, Math.floor(255 * (1 - activationLevel * 0.7)));
    const heatB = Math.min(255, Math.floor(100 * (1 - activationLevel)));
    
    heatGradient.addColorStop(0, `rgba(${heatR}, ${heatG}, ${heatB}, ${alpha + 0.4 * activationLevel})`);
    heatGradient.addColorStop(0.6, `rgba(${heatR * 0.8}, ${heatG * 0.5}, ${heatB}, ${alpha * 0.6 * activationLevel})`);
    heatGradient.addColorStop(1, `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0)`);
    
    ctx.fillStyle = heatGradient;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fill();
    
    // Add a pulsing effect for active muscles
    if (activationLevel > 0.6) {
      const pulseSize = 0.6 + Math.sin(Date.now() / 500) * 0.1;
      const pulseCoords = coords.map(coord => ({
        x: centerX + (coord.x - centerX) * pulseSize,
        y: centerY + (coord.y - centerY) * pulseSize
      }));
      
      ctx.beginPath();
      ctx.moveTo(pulseCoords[0].x, pulseCoords[0].y);
      
      for (let i = 1; i < pulseCoords.length - 1; i++) {
        const xc = (pulseCoords[i].x + pulseCoords[i+1].x) / 2;
        const yc = (pulseCoords[i].y + pulseCoords[i+1].y) / 2;
        ctx.quadraticCurveTo(pulseCoords[i].x, pulseCoords[i].y, xc, yc);
      }
      
      ctx.quadraticCurveTo(
        pulseCoords[pulseCoords.length-1].x, 
        pulseCoords[pulseCoords.length-1].y, 
        pulseCoords[0].x, 
        pulseCoords[0].y
      );
      
      ctx.closePath();
      
      const pulseOpacity = 0.2 + Math.sin(Date.now() / 300) * 0.1;
      ctx.fillStyle = `rgba(255, 200, 150, ${pulseOpacity})`;
      ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
} 