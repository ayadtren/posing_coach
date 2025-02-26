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
  private animationFrame: number | null = null;
  private lastRenderTime: number = 0;
  private pulsePhase: number = 0;
  private dynamicActivationLevels: MuscleActivation = {};
  private baseActivationLevels: MuscleActivation = {};
  private pulseIntensity: number = 0.15; // Controls how much pulsing affects visualization
  private muscleExertionLevel: number = 0; // 0-1 representing overall exertion/pump
  
  /**
   * Initialize the visualization with a canvas context
   */
  initialize(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.startAnimationLoop();
  }
  
  /**
   * Set the current pose type
   */
  setPoseType(poseType: PoseType): void {
    this.poseType = poseType;
    // Store base activation levels for the current pose
    this.baseActivationLevels = {...POSE_MUSCLE_ACTIVATION[poseType]};
    // Initialize dynamic levels from base levels
    this.updateDynamicActivationLevels();
  }
  
  /**
   * Set the overall muscle exertion/pump level
   * @param level 0-1 value representing how pumped the muscles appear
   */
  setMuscleExertionLevel(level: number): void {
    this.muscleExertionLevel = Math.max(0, Math.min(1, level));
    this.updateDynamicActivationLevels();
  }
  
  /**
   * Increase activation for specific muscle group (for targeted exercises)
   * @param muscleName The muscle group to activate
   * @param amount Amount to increase activation (0-1)
   */
  activateMuscle(muscleName: string, amount: number): void {
    if (this.baseActivationLevels[muscleName] !== undefined) {
      const currentBase = this.baseActivationLevels[muscleName] || 0;
      this.baseActivationLevels[muscleName] = Math.min(1, currentBase + amount);
      this.updateDynamicActivationLevels();
    }
  }
  
  /**
   * Update dynamic activation levels based on base levels, pulsing, and exertion
   */
  private updateDynamicActivationLevels(): void {
    // Start with base levels
    this.dynamicActivationLevels = {...this.baseActivationLevels};
    
    // Apply exertion multiplier (more exertion = more activation + more visible veins/striations)
    Object.keys(this.dynamicActivationLevels).forEach(muscle => {
      // Exertion increases activation and makes it more responsive to pulsing
      const exertionBoost = this.muscleExertionLevel * 0.3;
      this.dynamicActivationLevels[muscle] = Math.min(1, 
        this.dynamicActivationLevels[muscle] + exertionBoost);
    });
  }
  
  /**
   * Get the current activation level for a muscle, including pulsing effects
   * @param muscleName Muscle group name
   * @returns Activation level from 0-1 with pulsing applied
   */
  getMuscleActivation(muscleName: string): number {
    const baseActivation = this.dynamicActivationLevels[muscleName] || 0;
    
    // Higher activation = more pronounced pulsing
    const pulseAmount = this.pulseIntensity * baseActivation * (0.5 + this.muscleExertionLevel * 0.5);
    
    // Each muscle pulses slightly differently to appear more natural
    const muscleSpecificOffset = (muscleName.charCodeAt(0) + muscleName.charCodeAt(muscleName.length - 1)) % 10 / 10;
    const pulseOffset = muscleSpecificOffset * Math.PI * 2;
    
    // Calculate pulsing effect - more subtle at low exertion, more pronounced at high exertion
    const pulseEffect = Math.sin(this.pulsePhase + pulseOffset) * pulseAmount;
    
    return Math.max(0, Math.min(1, baseActivation + pulseEffect));
  }
  
  /**
   * Start animation loop for dynamic effects
   */
  private startAnimationLoop(): void {
    const animate = (timestamp: number) => {
      // Update pulse phase for dynamic effects (used in muscle pulsing)
      const deltaTime = timestamp - this.lastRenderTime;
      
      // Pulse faster with higher exertion
      const pulseSpeed = 0.001 * (1 + this.muscleExertionLevel * 1.5);
      this.pulsePhase = (this.pulsePhase + deltaTime * pulseSpeed) % (Math.PI * 2);
      this.lastRenderTime = timestamp;
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
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
        this.getMuscleActivation(group.name)
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
    // Increased number of striations based on muscle size for more detailed fiber representation
    const numStriations = Math.max(15, Math.min(40, Math.floor(radius / 5)));
    
    ctx.globalCompositeOperation = 'overlay';
    
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
    
    // Calculate pennation angle - the angle at which muscle fibers attach to tendons
    // This varies by muscle group, but we'll use a simplified approach based on muscle shape
    const aspectRatio = Math.max(Math.abs(sumX), Math.abs(sumY)) / Math.min(Math.abs(sumX), Math.abs(sumY));
    const basePennationAngle = Math.PI * (0.05 + 0.1 * Math.min(1, (aspectRatio - 1) / 5));
    
    // Determine fiber density based on muscle size
    const fiberDensity = Math.min(1.0, radius / 150) * 0.8 + 0.2;
    
    // Draw fascial lines (connective tissue between fiber bundles)
    this.drawFascialLines(coords, centerX, centerY, radius, dirX, dirY, rgbColor);
    
    // Create multiple fiber bundles with different pennation angles
    const numBundles = Math.floor(radius / 30) + 2;
    
    for (let bundleIdx = 0; bundleIdx < numBundles; bundleIdx++) {
      // Each bundle has a slightly different pennation angle
      const bundleAngleVariation = (Math.random() * 0.5 - 0.25) * basePennationAngle;
      const bundlePennationAngle = basePennationAngle + bundleAngleVariation;
      
      // Rotate the perpendicular direction based on pennation angle
      const rotatedPerpX = -dirY * Math.cos(bundlePennationAngle) - dirX * Math.sin(bundlePennationAngle);
      const rotatedPerpY = dirX * Math.cos(bundlePennationAngle) - dirY * Math.sin(bundlePennationAngle);
      
      // Determine bundle position
      const bundleOffsetFactor = (bundleIdx / (numBundles - 1)) * 0.8 - 0.4;
      const bundleCenterX = centerX + bundleOffsetFactor * radius * dirX;
      const bundleCenterY = centerY + bundleOffsetFactor * radius * dirY;
      
      // Calculate fibers per bundle based on density
      const fibersPerBundle = Math.floor(numStriations / numBundles) + 
        Math.floor(Math.random() * 3) - 1;
      
      // Draw individual fibers in this bundle
      for (let i = 0; i < fibersPerBundle; i++) {
        // Calculate position along muscle length with slight variation
        const t = (i / (fibersPerBundle - 1 || 1)) * 0.8 + 0.1; // Keep within central 80% of muscle
        const posX = bundleCenterX + (Math.random() * 0.3 - 0.15) * radius * dirX;
        const posY = bundleCenterY + (Math.random() * 0.3 - 0.15) * radius * dirY;
        
        // Each fiber has a slightly different pennation angle
        const fiberAngleVariation = (Math.random() * 0.2 - 0.1) * basePennationAngle;
        const fiberPerpX = rotatedPerpX * Math.cos(fiberAngleVariation) - rotatedPerpY * Math.sin(fiberAngleVariation);
        const fiberPerpY = rotatedPerpX * Math.sin(fiberAngleVariation) + rotatedPerpY * Math.cos(fiberAngleVariation);
        
        // Calculate fiber length with variation based on position in bundle
        const distFromCenter = Math.sqrt(
          Math.pow(posX - centerX, 2) + 
          Math.pow(posY - centerY, 2)
        ) / radius;
        
        // Fibers are shorter near the edges, longer in the middle
        const lengthFactor = 1 - Math.min(1, distFromCenter * 1.5);
        const striationLength = radius * (0.3 + lengthFactor * 0.6 + Math.random() * 0.2);
        
        // Calculate start and end points
        const startX = posX - fiberPerpX * striationLength / 2;
        const startY = posY - fiberPerpY * striationLength / 2;
        const endX = posX + fiberPerpX * striationLength / 2;
        const endY = posY + fiberPerpY * striationLength / 2;
        
        // Draw curved fiber with multiple segments for more detail
        this.drawDetailedFiber(
          startX, startY, endX, endY, 
          posX, posY, dirX, dirY, 
          striationLength, fiberDensity, alpha
        );
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw a single detailed muscle fiber with multiple segments
   */
  private drawDetailedFiber(
    startX: number, startY: number, 
    endX: number, endY: number,
    centerX: number, centerY: number,
    dirX: number, dirY: number,
    fiberLength: number,
    fiberDensity: number,
    alpha: number
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Number of segments in this fiber - more segments = more detailed/realistic
    const segments = Math.floor(2 + fiberLength / 15);
    
    // Base coordinates for the fiber
    const points: {x: number, y: number}[] = [];
    
    // Generate control points with natural variations
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Start with a simple linear interpolation
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;
      
      // Add controlled randomness - more in the middle, less at endpoints
      const variationFactor = Math.sin(t * Math.PI) * 1.5;
      const variationX = (Math.random() * 2 - 1) * variationFactor;
      const variationY = (Math.random() * 2 - 1) * variationFactor;
      
      // Add slight bulging in middle of fiber (sarcomere)
      const bulgeFactor = Math.sin(t * Math.PI) * 0.8;
      
      // Calculate perpendicular direction to fiber
      const perpX = -(endY - startY) / fiberLength;
      const perpY = (endX - startX) / fiberLength;
      
      // Apply variations
      points.push({
        x: baseX + variationX + perpX * bulgeFactor,
        y: baseY + variationY + perpY * bulgeFactor
      });
    }
    
    // Draw the main fiber
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Use bezier curves for smoother fiber path
    for (let i = 1; i < points.length; i++) {
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i+1].x) / 2;
        const yc = (points[i].y + points[i+1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      } else {
        // Last point
        ctx.quadraticCurveTo(points[i].x, points[i].y, points[i].x, points[i].y);
      }
    }
    
    // Vary fiber thickness based on density and random variation
    const thickness = 0.5 + fiberDensity * 1.0 + Math.random() * 0.5;
    ctx.lineWidth = thickness;
    
    // Vary fiber brightness based on position - simulates 3D effect
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - ((startX + endX) / 2), 2) + 
      Math.pow(centerY - ((startY + endY) / 2), 2)
    );
    
    const brightnessVariation = Math.max(0, 1 - distanceFromCenter / (fiberLength * 0.8));
    const brightness = Math.floor(200 + brightnessVariation * 55);
    
    // Use color with varying opacity for more realistic fibers
    const baseOpacity = 0.1 + Math.random() * 0.15 + fiberDensity * 0.1;
    ctx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${baseOpacity})`;
    ctx.stroke();
    
    // Add a shadow fiber for more depth
    ctx.beginPath();
    ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5);
    
    for (let i = 1; i < points.length; i++) {
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i+1].x) / 2 + 0.5;
        const yc = (points[i].y + points[i+1].y) / 2 + 0.5;
        ctx.quadraticCurveTo(points[i].x + 0.5, points[i].y + 0.5, xc, yc);
      } else {
        ctx.quadraticCurveTo(points[i].x + 0.5, points[i].y + 0.5, points[i].x + 0.5, points[i].y + 0.5);
      }
    }
    
    ctx.strokeStyle = `rgba(40, 40, 40, ${baseOpacity * 0.5})`;
    ctx.stroke();
    
    // For more detailed fibers, add sarcomere bands (striated muscle pattern)
    if (fiberDensity > 0.6 && fiberLength > 20 && Math.random() > 0.5) {
      this.drawSarcomereBands(points, fiberLength, baseOpacity);
    }
  }
  
  /**
   * Draw sarcomere bands across a muscle fiber (the characteristic striated pattern)
   */
  private drawSarcomereBands(
    points: {x: number, y: number}[],
    fiberLength: number,
    baseOpacity: number
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const bandSpacing = 3 + Math.random() * 2;
    const numBands = Math.floor(fiberLength / bandSpacing);
    
    // Calculate perpendicular direction to fiber
    const dirX = points[points.length - 1].x - points[0].x;
    const dirY = points[points.length - 1].y - points[0].y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    
    const perpX = -dirY / length;
    const perpY = dirX / length;
    
    // Calculate band width based on fiber length
    const bandWidth = 0.5 + Math.min(1, fiberLength / 100);
    
    ctx.lineWidth = bandWidth;
    
    // Draw each band
    for (let i = 1; i < numBands; i++) {
      const t = i / numBands;
      
      // Find position along fiber
      const idx = Math.floor(t * (points.length - 1));
      const subT = t * (points.length - 1) - idx;
      
      // Interpolate to get exact position
      const x = points[idx].x + (idx < points.length - 1 ? subT * (points[idx + 1].x - points[idx].x) : 0);
      const y = points[idx].y + (idx < points.length - 1 ? subT * (points[idx + 1].y - points[idx].y) : 0);
      
      // Calculate band length - slightly shorter than fiber width
      const bandLength = 2 + Math.random() * 2;
      
      // Draw band
      ctx.beginPath();
      ctx.moveTo(x - perpX * bandLength, y - perpY * bandLength);
      ctx.lineTo(x + perpX * bandLength, y + perpY * bandLength);
      
      // Alternate dark/light bands (A-bands and I-bands in real muscle)
      const isDarkBand = i % 2 === 0;
      ctx.strokeStyle = isDarkBand 
        ? `rgba(30, 30, 30, ${baseOpacity * 1.2})`
        : `rgba(200, 200, 200, ${baseOpacity * 1.5})`;
      
      ctx.stroke();
    }
  }
  
  /**
   * Draw fascial lines (connective tissue between muscle fiber bundles)
   */
  private drawFascialLines(
    coords: {x: number, y: number}[],
    centerX: number,
    centerY: number,
    radius: number,
    dirX: number,
    dirY: number,
    rgbColor: {r: number, g: number, b: number}
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Number of fascial lines to draw
    const numFascialLines = Math.floor(radius / 25) + 2;
    
    ctx.lineWidth = 0.8;
    
    for (let i = 0; i < numFascialLines; i++) {
      // Calculate starting point on muscle perimeter
      const angle = (i / numFascialLines) * 2 * Math.PI;
      const edgeX = centerX + Math.cos(angle) * radius * 0.9;
      const edgeY = centerY + Math.sin(angle) * radius * 0.9;
      
      // Calculate vector pointing inward
      const towardCenterX = centerX - edgeX;
      const towardCenterY = centerY - edgeY;
      const dist = Math.sqrt(towardCenterX * towardCenterX + towardCenterY * towardCenterY);
      
      // Normalize
      const inwardX = towardCenterX / dist;
      const inwardY = towardCenterY / dist;
      
      // Draw fascial line toward center
      ctx.beginPath();
      ctx.moveTo(edgeX, edgeY);
      
      // Multiple control points for natural curve
      const numPoints = 3 + Math.floor(Math.random() * 3);
      let currentX = edgeX;
      let currentY = edgeY;
      
      for (let j = 1; j <= numPoints; j++) {
        const t = j / numPoints;
        const targetX = edgeX + towardCenterX * t * 0.8; // Go 80% toward center
        const targetY = edgeY + towardCenterY * t * 0.8;
        
        // Add some natural waviness
        const waviness = (1 - t) * 8; // More waviness at the edge
        const offsetX = (Math.random() * 2 - 1) * waviness;
        const offsetY = (Math.random() * 2 - 1) * waviness;
        
        const nextX = targetX + offsetX;
        const nextY = targetY + offsetY;
        
        // Draw segment
        ctx.lineTo(nextX, nextY);
        
        currentX = nextX;
        currentY = nextY;
      }
      
      // Semi-transparent white for fascial line
      const opacity = 0.15 + Math.random() * 0.1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.stroke();
      
      // Add subtle border
      ctx.beginPath();
      ctx.moveTo(edgeX + 0.5, edgeY + 0.5);
      
      currentX = edgeX;
      currentY = edgeY;
      
      for (let j = 1; j <= numPoints; j++) {
        const t = j / numPoints;
        const targetX = edgeX + towardCenterX * t * 0.8;
        const targetY = edgeY + towardCenterY * t * 0.8;
        
        // Use same waviness but slightly offset
        const waviness = (1 - t) * 8;
        const offsetX = (Math.random() * 2 - 1) * waviness;
        const offsetY = (Math.random() * 2 - 1) * waviness;
        
        const nextX = targetX + offsetX + 0.5;
        const nextY = targetY + offsetY + 0.5;
        
        ctx.lineTo(nextX, nextY);
        
        currentX = nextX;
        currentY = nextY;
      }
      
      ctx.strokeStyle = `rgba(40, 40, 40, ${opacity * 0.5})`;
      ctx.stroke();
    }
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
      // Use the animation phase for smooth pulsing
      const pulseSize = 0.6 + Math.sin(this.pulsePhase) * 0.1;
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
      
      // Pulse opacity also varies with time
      const pulseOpacity = 0.2 + Math.sin(this.pulsePhase * 1.5) * 0.1;
      
      // Use a warmer color for the pulse to simulate blood flow
      ctx.fillStyle = `rgba(255, 200, 150, ${pulseOpacity})`;
      ctx.fill();
      
      // Add vein-like details for highly activated muscles
      if (activationLevel > 0.8) {
        this.drawVeinDetails(coords, centerX, centerY, radius, rgbColor);
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw vein-like details for highly activated muscles
   */
  private drawVeinDetails(
    coords: {x: number, y: number}[], 
    centerX: number, 
    centerY: number, 
    radius: number,
    rgbColor: {r: number, g: number, b: number}
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'overlay';
    
    // Vascularity increases with muscle activation/pump
    // Number of veins increases with muscle size and activation
    const vascularityFactor = 0.7 + 0.3 * Math.sin(this.pulsePhase * 0.5);
    const numVeins = Math.floor(Math.random() * 3) + 3 + Math.floor(radius / 50);
    
    // Create a more complex vascular network
    const mainVeins: {
      points: {x: number, y: number}[],
      thickness: number,
      color: string
    }[] = [];
    
    // Generate main veins
    for (let i = 0; i < numVeins; i++) {
      // Start from a random point on the muscle perimeter
      const startIdx = Math.floor(Math.random() * coords.length);
      const startPoint = coords[startIdx];
      
      // Create a path toward the center with some randomness
      const points: {x: number, y: number}[] = [{x: startPoint.x, y: startPoint.y}];
      
      // Generate a random path with more segments for more detail
      let currentX = startPoint.x;
      let currentY = startPoint.y;
      const segments = Math.floor(Math.random() * 4) + 3;
      
      for (let j = 0; j < segments; j++) {
        // Move toward center with controlled randomness
        const towardCenterX = centerX - currentX;
        const towardCenterY = centerY - currentY;
        const dist = Math.sqrt(towardCenterX * towardCenterX + towardCenterY * towardCenterY);
        
        // Veins tend to curve around muscle rather than going straight to center
        const tangentialFactor = 0.4 + Math.random() * 0.6;
        
        // Normalize direction vector
        const dirX = towardCenterX / dist;
        const dirY = towardCenterY / dist;
        
        // Perpendicular direction (tangential to muscle)
        const perpX = -dirY;
        const perpY = dirX;
        
        // Add randomness to direction - more tangential, less radial
        const randomAngle = (Math.random() * 0.8 - 0.4) * Math.PI;
        const randomDirX = dirX * Math.cos(randomAngle) - dirY * Math.sin(randomAngle);
        const randomDirY = dirX * Math.sin(randomAngle) + dirY * Math.cos(randomAngle);
        
        // Blend radial and tangential components
        const blendedDirX = randomDirX * (1 - tangentialFactor) + perpX * tangentialFactor;
        const blendedDirY = randomDirY * (1 - tangentialFactor) + perpY * tangentialFactor;
        
        // Normalize the blended direction
        const blendedLength = Math.sqrt(blendedDirX * blendedDirX + blendedDirY * blendedDirY);
        const normalizedDirX = blendedDirX / blendedLength;
        const normalizedDirY = blendedDirY / blendedLength;
        
        // Calculate segment length - veins get smaller toward center
        const segmentLength = dist * (0.2 + Math.random() * 0.3) * (1 - j / segments * 0.5);
        
        // Calculate next point
        const nextX = currentX + normalizedDirX * segmentLength;
        const nextY = currentY + normalizedDirY * segmentLength;
        
        // Add point to path
        points.push({x: nextX, y: nextY});
        
        currentX = nextX;
        currentY = nextY;
      }
      
      // Determine vein properties - color, thickness
      // Main veins are bluish, some are more purplish
      const isArterial = Math.random() > 0.7;
      const r = isArterial ? 120 + Math.random() * 40 : 70 + Math.random() * 40;
      const g = isArterial ? 80 + Math.random() * 40 : 100 + Math.random() * 40;
      const b = 180 + Math.random() * 75;
      
      // Vein thickness varies - main veins are thicker
      const baseThickness = isArterial ? 1.5 + Math.random() * 1.0 : 0.8 + Math.random() * 1.0;
      const thickness = baseThickness * vascularityFactor;
      
      // Vein opacity varies with pulsing
      const baseOpacity = 0.15 + Math.random() * 0.15;
      const opacity = baseOpacity * (isArterial 
        ? 0.8 + 0.2 * Math.sin(this.pulsePhase * 2 + i) 
        : 0.9 + 0.1 * Math.sin(this.pulsePhase + i));
      
      // Store vein data
      mainVeins.push({
        points,
        thickness,
        color: `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${opacity})`
      });
    }
    
    // Draw main veins first
    mainVeins.forEach(vein => {
      this.drawSingleVein(vein.points, vein.thickness, vein.color);
      
      // Add branch veins with probability
      if (vein.points.length > 2 && Math.random() > 0.3) {
        this.addVeinBranches(vein.points, vein.thickness, vein.color, centerX, centerY);
      }
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Draw a single vein with smooth curves and varying thickness
   */
  private drawSingleVein(
    points: {x: number, y: number}[],
    baseThickness: number,
    color: string
  ): void {
    if (!this.ctx || points.length < 2) return;
    
    const ctx = this.ctx;
    
    // Draw vein with smooth curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Use quadratic curves for smoother vein paths
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i+1].x) / 2;
      const yc = (points[i].y + points[i+1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    // Add the last point
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length-1].x, 
        points[points.length-1].y, 
        points[points.length-1].x, 
        points[points.length-1].y
      );
    } else {
      ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
    }
    
    // Veins taper off toward the end
    ctx.lineWidth = baseThickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Add highlight along vein for more 3D effect
    ctx.beginPath();
    ctx.moveTo(points[0].x - 0.5, points[0].y - 0.5);
    
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i+1].x) / 2 - 0.5;
      const yc = (points[i].y + points[i+1].y) / 2 - 0.5;
      ctx.quadraticCurveTo(points[i].x - 0.5, points[i].y - 0.5, xc, yc);
    }
    
    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length-1].x - 0.5, 
        points[points.length-1].y - 0.5, 
        points[points.length-1].x - 0.5, 
        points[points.length-1].y - 0.5
      );
    } else {
      ctx.lineTo(points[points.length-1].x - 0.5, points[points.length-1].y - 0.5);
    }
    
    // Highlight is a lighter/whiter version of the vein color
    ctx.lineWidth = baseThickness * 0.5;
    
    // Extract color components to create a highlight variant
    const colorMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (colorMatch) {
      const r = parseInt(colorMatch[1]);
      const g = parseInt(colorMatch[2]);
      const b = parseInt(colorMatch[3]);
      const a = parseFloat(colorMatch[4]);
      
      // Create lighter version for highlight
      const highlightR = Math.min(255, r + 50);
      const highlightG = Math.min(255, g + 50);
      const highlightB = Math.min(255, b + 50);
      
      ctx.strokeStyle = `rgba(${highlightR}, ${highlightG}, ${highlightB}, ${a * 0.6})`;
      ctx.stroke();
    }
  }
  
  /**
   * Add branching veins from a main vein
   */
  private addVeinBranches(
    mainPoints: {x: number, y: number}[],
    mainThickness: number,
    mainColor: string,
    centerX: number,
    centerY: number
  ): void {
    if (!this.ctx) return;
    
    // Number of branches depends on main vein length
    const numBranches = 1 + Math.floor(Math.random() * 2);
    
    const colorMatch = mainColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!colorMatch) return;
    
    const r = parseInt(colorMatch[1]);
    const g = parseInt(colorMatch[2]);
    const b = parseInt(colorMatch[3]);
    const a = parseFloat(colorMatch[4]);
    
    for (let i = 0; i < numBranches; i++) {
      // Select a point along the main vein (avoid endpoints)
      const pointIdx = 1 + Math.floor(Math.random() * (mainPoints.length - 2));
      const branchPoint = mainPoints[pointIdx];
      
      // Create branch direction - generally away from center
      const towardCenterX = centerX - branchPoint.x;
      const towardCenterY = centerY - branchPoint.y;
      const dist = Math.sqrt(towardCenterX * towardCenterX + towardCenterY * towardCenterY);
      
      // Normalize
      const dirX = towardCenterX / dist;
      const dirY = towardCenterY / dist;
      
      // Perpendicular to center direction
      const perpX = -dirY;
      const perpY = dirX;
      
      // Angle mostly perpendicular to center direction, but with randomness
      const branchAngle = (Math.random() * 0.8 - 0.4) * Math.PI;
      const branchDirX = perpX * Math.cos(branchAngle) - perpY * Math.sin(branchAngle);
      const branchDirY = perpX * Math.sin(branchAngle) + perpY * Math.cos(branchAngle);
      
      // Branch length - shorter than main vein
      const branchLength = (20 + Math.random() * 30) * (mainThickness / 2);
      
      // Create branch points
      const branchPoints = [{x: branchPoint.x, y: branchPoint.y}];
      
      // Generate a curved branch with 2-3 segments
      let currentX = branchPoint.x;
      let currentY = branchPoint.y;
      const segments = 1 + Math.floor(Math.random() * 2);
      
      for (let j = 0; j < segments; j++) {
        // Add some curvature to the branch
        const segmentAngle = (Math.random() * 0.4 - 0.2) * Math.PI;
        const segmentDirX = branchDirX * Math.cos(segmentAngle) - branchDirY * Math.sin(segmentAngle);
        const segmentDirY = branchDirX * Math.sin(segmentAngle) + branchDirY * Math.cos(segmentAngle);
        
        // Segment length - branches taper off
        const segmentLength = branchLength * (1 - j / segments * 0.5) / segments;
        
        // Calculate next point
        const nextX = currentX + segmentDirX * segmentLength;
        const nextY = currentY + segmentDirY * segmentLength;
        
        // Add point to branch
        branchPoints.push({x: nextX, y: nextY});
        
        currentX = nextX;
        currentY = nextY;
      }
      
      // Branch veins are thinner and slightly different in color
      const branchThickness = mainThickness * (0.4 + Math.random() * 0.3);
      
      // Modify color slightly
      const branchR = Math.max(0, Math.min(255, r + (Math.random() * 40 - 20)));
      const branchG = Math.max(0, Math.min(255, g + (Math.random() * 40 - 20)));
      const branchB = Math.max(0, Math.min(255, b + (Math.random() * 20 - 10)));
      const branchA = a * (0.7 + Math.random() * 0.3);
      
      const branchColor = `rgba(${Math.floor(branchR)}, ${Math.floor(branchG)}, ${Math.floor(branchB)}, ${branchA})`;
      
      // Draw the branch
      this.drawSingleVein(branchPoints, branchThickness, branchColor);
      
      // Recursively add sub-branches (with low probability)
      if (branchPoints.length > 2 && Math.random() > 0.7) {
        this.addVeinBranches(branchPoints, branchThickness, branchColor, centerX, centerY);
      }
    }
  }

  /**
   * Render a muscle group with enhanced 3D visualization
   */
  renderMuscleGroup(
    poseData: PoseData | null, 
    group: MuscleGroup, 
    opacity: number = 0.7
  ): void {
    if (!poseData || !this.ctx) return;
    
    const keypoints = group.keypoints.map(kp => {
      const point = poseData.keypoints.find(p => p.name === kp);
      return point ? { x: point.x, y: point.y } : null;
    }).filter((p): p is {x: number, y: number} => p !== null);
    
    if (keypoints.length < 3) return; // Need at least 3 points to define a muscle
    
    this.renderEnhancedMuscle(
      keypoints, 
      group.color, 
      this.getMuscleActivation(group.name)
    );
  }

  /**
   * Create a 3D depth map for the muscle to enhance realism
   */
  private createMuscleDepthMap(
    coords: {x: number, y: number}[],
    centerX: number,
    centerY: number,
    radius: number
  ): number[][] {
    // Create a grid covering the muscle area
    const gridSize = Math.ceil(radius * 2);
    const depthMap: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    // Calculate grid coordinates relative to muscle center
    const startX = Math.floor(centerX - radius);
    const startY = Math.floor(centerY - radius);
    
    // Function to check if point is inside the polygon defined by coords
    const isInside = (x: number, y: number, vertices: {x: number, y: number}[]) => {
      let inside = false;
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };
    
    // Generate a dome-like depth map with natural variations
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        
        // Skip if outside the muscle polygon
        if (!isInside(worldX, worldY, coords)) continue;
        
        // Calculate distance from center (normalized 0-1)
        const distX = worldX - centerX;
        const distY = worldY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY) / radius;
        
        // Base dome function (higher in center, lower at edges)
        let depth = Math.max(0, Math.cos(distance * Math.PI/2));
        
        // Add natural variations using noise (simplified version)
        const noiseScale = 0.2;
        const noiseX = Math.sin(worldX * 0.1) * Math.cos(worldY * 0.1);
        const noiseY = Math.sin(worldX * 0.13) * Math.cos(worldY * 0.07);
        const noise = (noiseX + noiseY) * noiseScale;
        
        // Apply noise but maintain dome shape
        depth = Math.max(0, Math.min(1, depth + noise * depth));
        
        // Store in depth map
        depthMap[y][x] = depth;
      }
    }
    
    return depthMap;
  }
  
  /**
   * Apply lighting effects based on depth map for enhanced 3D appearance
   */
  private applyLightingEffects(
    rgbColor: {r: number, g: number, b: number},
    depth: number,
    lightDirection: {x: number, y: number, z: number} = {x: -0.5, y: -0.5, z: 1.0}
  ): {r: number, g: number, b: number, a: number} {
    // Normalize light direction
    const lightLen = Math.sqrt(
      lightDirection.x * lightDirection.x + 
      lightDirection.y * lightDirection.y + 
      lightDirection.z * lightDirection.z
    );
    const light = {
      x: lightDirection.x / lightLen,
      y: lightDirection.y / lightLen,
      z: lightDirection.z / lightLen
    };
    
    // Calculate normal vector at this point
    // In a dome, the normal varies based on distance from center
    // Here we approximate using depth value
    const normal = {
      x: depth * -light.x,
      y: depth * -light.y,
      z: Math.sqrt(1 - Math.min(1, depth * depth * (light.x * light.x + light.y * light.y)))
    };
    
    // Calculate diffuse lighting using dot product
    const dotProduct = normal.x * light.x + normal.y * light.y + normal.z * light.z;
    const diffuse = Math.max(0.3, dotProduct); // Ensure some ambient light
    
    // Add specular highlight for wet/shiny muscle look
    const reflectZ = 2 * dotProduct * normal.z - light.z;
    const specular = Math.pow(Math.max(0, reflectZ), 20) * 0.6;
    
    // Apply lighting to base color
    return {
      r: Math.min(255, Math.floor(rgbColor.r * diffuse + 255 * specular)),
      g: Math.min(255, Math.floor(rgbColor.g * diffuse + 255 * specular)),
      b: Math.min(255, Math.floor(rgbColor.b * diffuse + 255 * specular)),
      a: 0.7 + depth * 0.3 // More opaque in center
    };
  }

  /**
   * Render an enhanced muscle with 3D effects
   */
  private renderEnhancedMuscle(
    coords: {x: number, y: number}[], 
    colorHex: string, 
    activationLevel: number
  ): void {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    
    // Calculate center of the muscle
    const centerX = coords.reduce((sum, coord) => sum + coord.x, 0) / coords.length;
    const centerY = coords.reduce((sum, coord) => sum + coord.y, 0) / coords.length;
    
    // Calculate approximate radius of the muscle
    const radius = Math.max(...coords.map(coord => 
      Math.sqrt(Math.pow(coord.x - centerX, 2) + Math.pow(coord.y - centerY, 2))
    ));
    
    // Convert color to RGB for better manipulation
    const rgbColor = hexToRgb(colorHex);
    
    // Create depth map for 3D effects
    const depthMap = this.createMuscleDepthMap(coords, centerX, centerY, radius);
    const gridSize = depthMap.length;
    const startX = Math.floor(centerX - radius);
    const startY = Math.floor(centerY - radius);
    
    // Define light direction (can be animated for dynamic lighting)
    const lightDirection = {
      x: Math.sin(this.pulsePhase * 0.1) * 0.2 - 0.5,
      y: Math.cos(this.pulsePhase * 0.1) * 0.2 - 0.5,
      z: 1.0
    };
    
    // Draw the base muscle with 3D lighting effects
    ctx.save();
    
    // Draw depth-shaded muscle base
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const depth = depthMap[y][x];
        if (depth > 0) {
          const worldX = startX + x;
          const worldY = startY + y;
          
          // Apply lighting effects
          const litColor = this.applyLightingEffects(rgbColor, depth, lightDirection);
          
          // Draw pixel with lighting applied
          ctx.fillStyle = `rgba(${litColor.r}, ${litColor.g}, ${litColor.b}, ${litColor.a})`;
          ctx.fillRect(worldX, worldY, 1, 1);
        }
      }
    }
    
    // Draw muscle outline for definition
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${Math.floor(rgbColor.r * 0.7)}, ${Math.floor(rgbColor.g * 0.7)}, ${Math.floor(rgbColor.b * 0.7)}, 0.8)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Add muscle details based on activation
    if (activationLevel > 0.3) {
      // Draw muscle striations (internal fibers)
      this.drawMuscleStriations(coords, centerX, centerY, radius, rgbColor, activationLevel);
      
      // Draw vein details for highly activated muscles
      if (activationLevel > 0.7) {
        this.drawVeinDetails(coords, centerX, centerY, radius, rgbColor);
      }
    }
    
    ctx.restore();
  }
} 