'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { DensePoseResult, DensePoseInstance, DensePoseClient } from '@/lib/ai-coach/densepose-client';
import { Label } from "@/components/ui/label";

interface DensePoseVisualizerProps {
  imageUrl: string;
  densePoseData: DensePoseResult | null;
  width: number;
  height: number;
  className?: string;
}

// Color mapping for different body parts
const BODY_PART_COLORS: Record<number, string> = {
  1: '#FF6B6B',   // Torso - red
  2: '#4ECDC4',   // Right Hand - teal
  3: '#45B7D1',   // Left Hand - light blue
  4: '#F9C74F',   // Left Foot - yellow
  5: '#F8961E',   // Right Foot - orange
  6: '#9D4EDD',   // Upper Leg Right - purple
  7: '#7209B7',   // Upper Leg Left - dark purple
  8: '#4CC9F0',   // Lower Leg Right - light blue
  9: '#4361EE',   // Lower Leg Left - blue
  10: '#2EC4B6', // Upper Arm Left - teal
  11: '#3D5A80', // Upper Arm Right - navy
  12: '#98C1D9', // Lower Arm Left - light blue
  13: '#E0FBFC', // Lower Arm Right - pale blue
  14: '#EE6C4D'  // Head - orange-red
};

// Muscle visualization settings - muscle name to RGB color
const MUSCLE_COLORS: Record<string, string> = {
  'Pectorals': '#e63946',
  'Abdominals': '#f1c453',
  'Obliques': '#f3722c',
  'Serratus': '#90be6d',
  'Lats': '#577590',
  'Biceps': '#43aa8b',
  'Triceps': '#4d908e',
  'Deltoids': '#277da1',
  'Quadriceps': '#9d4edd',
  'Hamstrings': '#5a189a',
  'Adductors': '#3a0ca3',
  'Calves': '#4cc9f0',
  'Forearm Flexors': '#f72585',
  'Forearm Extensors': '#b5179e'
};

// Muscle group mapping
const MUSCLE_GROUPS: Record<number, string[]> = {
  1: ["Chest", "Abdominals", "Serratus"],
  2: ["Upper Back", "Lower Back"],
  3: ["Forearm Flexors", "Hand Muscles"],
  4: ["Forearm Flexors", "Hand Muscles"],
  5: ["Calves", "Foot Muscles"],
  6: ["Calves", "Foot Muscles"],
  7: ["Quadriceps", "Hamstrings", "Gluteus"],
  8: ["Quadriceps", "Hamstrings", "Gluteus"],
  9: ["Calves", "Tibialis"],
  10: ["Calves", "Tibialis"],
  11: ["Biceps", "Triceps", "Deltoid"],
  12: ["Biceps", "Triceps", "Deltoid"],
  13: ["Forearm Extensors", "Forearm Flexors"],
  14: ["Forearm Extensors", "Forearm Flexors"],
  15: ["Neck Muscles", "Trapezius"],
};

// Function to get body part name from ID
const getBodyPartName = (id: number): string => {
  const names: Record<number, string> = {
    1: "Torso Front",
    2: "Torso Back",
    3: "Right Hand",
    4: "Left Hand",
    5: "Left Foot",
    6: "Right Foot",
    7: "Upper Leg Right",
    8: "Upper Leg Left",
    9: "Lower Leg Right",
    10: "Lower Leg Left",
    11: "Upper Arm Left",
    12: "Upper Arm Right",
    13: "Lower Arm Left",
    14: "Lower Arm Right",
    15: "Head",
  };
  return names[id] || `Unknown (${id})`;
};

// Visualization modes
type VisualizationMode = 'bodyParts' | 'muscles' | 'uvMap' | 'posingGuide';

export function DensePoseVisualizer({ 
  imageUrl, 
  densePoseData, 
  width, 
  height, 
  className = '' 
}: DensePoseVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('bodyParts');
  const [opacity, setOpacity] = useState(0.7);
  const [selectedBodyPart, setSelectedBodyPart] = useState<number | null>(null);
  const [showGuideLines, setShowGuideLines] = useState(true);
  const [showMuscleLabels, setShowMuscleLabels] = useState(true);
  const [highlightActivation, setHighlightActivation] = useState(true);
  
  const densePoseClient = new DensePoseClient();
  
  // Load the background image when the component mounts or imageUrl changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw the background image
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        // Draw image maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth = width;
        let drawHeight = height;
        
        if (width / height > aspectRatio) {
          drawWidth = height * aspectRatio;
        } else {
          drawHeight = width / aspectRatio;
        }
        
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Once image is loaded, draw the DensePose visualization
        drawDensePoseVisualization();
      };
      img.src = imageUrl;
    }
  }, [imageUrl, width, height]);
  
  // Update visualization whenever densePoseData or visualization settings change
  useEffect(() => {
    drawDensePoseVisualization();
  }, [
    densePoseData, 
    visualizationMode, 
    opacity, 
    selectedBodyPart, 
    showGuideLines, 
    showMuscleLabels, 
    highlightActivation
  ]);
  
  // Main function to draw DensePose visualization
  const drawDensePoseVisualization = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear overlay canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If no DensePose data is available, don't draw anything
    if (!densePoseData || densePoseData.num_instances === 0) return;
    
    // Process the first detected person
    const instance = densePoseData.instances[0];
    
    switch(visualizationMode) {
      case 'bodyParts':
        drawBodyPartSegmentation(ctx, instance);
        break;
      case 'muscles':
        drawMuscleVisualization(ctx, instance);
        break;
      case 'uvMap':
        drawUVMapVisualization(ctx, instance);
        break;
      case 'posingGuide':
        drawPosingGuide(ctx, instance);
        break;
    }
    
    // Draw additional guide elements if enabled
    if (showGuideLines) {
      drawGuideLines(ctx, instance);
    }
  };
  
  // Draw body part segmentation visualization
  const drawBodyPartSegmentation = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    const { body_parts, bbox } = instance;
    
    // Get dimensions of the segmentation data
    const segWidth = body_parts[0].length;
    const segHeight = body_parts.length;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // Draw each pixel of the segmentation
    for (let y = 0; y < segHeight; y++) {
      for (let x = 0; x < segWidth; x++) {
        const bodyPartId = body_parts[y][x];
        
        // Skip background (id 0)
        if (bodyPartId === 0) continue;
        
        // If a body part is selected, only show that part
        if (selectedBodyPart !== null && bodyPartId !== selectedBodyPart) continue;
        
        // Get color for this body part
        const color = BODY_PART_COLORS[bodyPartId] || '#CCCCCC';
        
        // Calculate pixel position
        const pixelX = Math.floor((x / segWidth) * boxWidth * scaleX);
        const pixelY = Math.floor((y / segHeight) * boxHeight * scaleY);
        
        // Set pixel color with opacity
        ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(pixelX, pixelY, 1, 1);
      }
    }
    
    // Add labels for body parts if we're not filtering by a specific part
    if (selectedBodyPart === null && showMuscleLabels) {
      drawBodyPartLabels(ctx, instance);
    }
  };
  
  // Draw muscle visualization
  const drawMuscleVisualization = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    const { body_parts, bbox } = instance;
    
    // Get dimensions of the segmentation data
    const segWidth = body_parts[0].length;
    const segHeight = body_parts.length;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // For each body part, draw associated muscles
    for (let y = 0; y < segHeight; y++) {
      for (let x = 0; x < segWidth; x++) {
        const bodyPartId = body_parts[y][x];
        
        // Skip background (id 0)
        if (bodyPartId === 0) continue;
        
        // Get muscles for this body part
        const muscles = densePoseClient.getMuscleGroupsForBodyPart(bodyPartId);
        
        // If no muscles associated, skip
        if (muscles.length === 0) continue;
        
        // Choose a muscle to visualize (for simplicity, using the first one)
        // In a more complex implementation, you might use UV coordinates to determine which muscle
        const muscle = muscles[0];
        const color = MUSCLE_COLORS[muscle] || '#CCCCCC';
        
        // Calculate pixel position
        const pixelX = Math.floor((x / segWidth) * boxWidth * scaleX);
        const pixelY = Math.floor((y / segHeight) * boxHeight * scaleY);
        
        // Set pixel color with opacity
        ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(pixelX, pixelY, 1, 1);
      }
    }
    
    // Add labels for muscles if enabled
    if (showMuscleLabels) {
      drawMuscleLabels(ctx, instance);
    }
  };
  
  // Draw UV map visualization (shows the parameterization of the body surface)
  const drawUVMapVisualization = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    const { body_parts, u_coordinates, v_coordinates, bbox } = instance;
    
    // Get dimensions of the data
    const segWidth = body_parts[0].length;
    const segHeight = body_parts.length;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // Draw each pixel of the UV map
    for (let y = 0; y < segHeight; y++) {
      for (let x = 0; x < segWidth; x++) {
        const bodyPartId = body_parts[y][x];
        
        // Skip background (id 0)
        if (bodyPartId === 0) continue;
        
        // Get UV coordinates
        const u = u_coordinates[y][x];
        const v = v_coordinates[y][x];
        
        // Calculate pixel position
        const pixelX = Math.floor((x / segWidth) * boxWidth * scaleX);
        const pixelY = Math.floor((y / segHeight) * boxHeight * scaleY);
        
        // Use UV coordinates to determine color
        // U maps to red channel, V maps to green channel
        const r = Math.floor(u * 255);
        const g = Math.floor(v * 255);
        const b = 100; // Add some blue for visibility
        
        // Set pixel color with opacity
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fillRect(pixelX, pixelY, 1, 1);
      }
    }
  };
  
  // Draw posing guide with cues and annotations
  const drawPosingGuide = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    // First draw the body part segmentation as a base
    drawBodyPartSegmentation(ctx, instance);
    
    const { bbox } = instance;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // Draw posing cues and annotations
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add posing cues based on body parts
    const bodyCues = [
      { part: 1, text: 'Engage Core', x: 0.5, y: 0.4 },  // Torso
      { part: 10, text: 'Flex Bicep', x: 0.3, y: 0.35 },  // Upper Arm Left
      { part: 11, text: 'Flex Bicep', x: 0.7, y: 0.35 },  // Upper Arm Right
      { part: 6, text: 'Tense Quads', x: 0.7, y: 0.6 },  // Upper Leg Right
      { part: 7, text: 'Tense Quads', x: 0.3, y: 0.6 },  // Upper Leg Left
      { part: 8, text: 'Point Toes', x: 0.7, y: 0.8 },  // Lower Leg Right
      { part: 9, text: 'Point Toes', x: 0.3, y: 0.8 },  // Lower Leg Left
    ];
    
    for (const cue of bodyCues) {
      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(cue.x * width, cue.y * height);
      ctx.lineTo(cue.x * width + 50, cue.y * height - 30);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(cue.text).width;
      ctx.fillRect(
        cue.x * width + 50 - textWidth/2 - 5, 
        cue.y * height - 30 - 10, 
        textWidth + 10, 
        20
      );
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.fillText(cue.text, cue.x * width + 50, cue.y * height - 30);
    }
    
    // Draw overall posing instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, width - 20, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Keep chest high and shoulders back', width/2, 30);
  };
  
  // Draw guide lines showing proper alignment for posing
  const drawGuideLines = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    // Draw vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    
    // Draw horizontal guide lines
    // Shoulder line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.lineTo(width, height * 0.25);
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.stroke();
    
    // Hip line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.stroke();
    
    // Knee line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.lineTo(width, height * 0.75);
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.stroke();
    
    // Reset line dash
    ctx.setLineDash([]);
  };
  
  // Draw labels for body parts
  const drawBodyPartLabels = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    const { body_parts, bbox } = instance;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // Keep track of where we've placed labels to avoid overlap
    const labelPositions: Record<number, { x: number, y: number, count: number }> = {};
    
    // First pass to gather positions
    const segWidth = body_parts[0].length;
    const segHeight = body_parts.length;
    
    for (let y = 0; y < segHeight; y++) {
      for (let x = 0; x < segWidth; x++) {
        const bodyPartId = body_parts[y][x];
        if (bodyPartId === 0) continue;
        
        const pixelX = Math.floor((x / segWidth) * boxWidth * scaleX);
        const pixelY = Math.floor((y / segHeight) * boxHeight * scaleY);
        
        if (!labelPositions[bodyPartId]) {
          labelPositions[bodyPartId] = { x: pixelX, y: pixelY, count: 1 };
        } else {
          labelPositions[bodyPartId].x += pixelX;
          labelPositions[bodyPartId].y += pixelY;
          labelPositions[bodyPartId].count++;
        }
      }
    }
    
    // Second pass to compute average positions and draw labels
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (const [bodyPartIdStr, position] of Object.entries(labelPositions)) {
      const bodyPartId = parseInt(bodyPartIdStr);
      const avgX = position.x / position.count;
      const avgY = position.y / position.count;
      
      const name = densePoseClient.getBodyPartName(bodyPartId);
      
      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(name).width;
      ctx.fillRect(avgX - textWidth/2 - 5, avgY - 7, textWidth + 10, 14);
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(name, avgX, avgY);
    }
  };
  
  // Draw labels for muscles
  const drawMuscleLabels = (ctx: CanvasRenderingContext2D, instance: DensePoseInstance) => {
    const { body_parts, bbox } = instance;
    
    // Calculate scaling factors
    const [x1, y1, x2, y2] = bbox;
    const boxWidth = x2 - x1;
    const boxHeight = y2 - y1;
    
    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    
    // Keep track of where we've seen each body part to place muscle labels
    const bodyPartPositions: Record<number, { x: number, y: number, count: number }> = {};
    
    // First pass to gather positions
    const segWidth = body_parts[0].length;
    const segHeight = body_parts.length;
    
    for (let y = 0; y < segHeight; y++) {
      for (let x = 0; x < segWidth; x++) {
        const bodyPartId = body_parts[y][x];
        if (bodyPartId === 0) continue;
        
        const pixelX = Math.floor((x / segWidth) * boxWidth * scaleX);
        const pixelY = Math.floor((y / segHeight) * boxHeight * scaleY);
        
        if (!bodyPartPositions[bodyPartId]) {
          bodyPartPositions[bodyPartId] = { x: pixelX, y: pixelY, count: 1 };
        } else {
          bodyPartPositions[bodyPartId].x += pixelX;
          bodyPartPositions[bodyPartId].y += pixelY;
          bodyPartPositions[bodyPartId].count++;
        }
      }
    }
    
    // Second pass to compute average positions and draw muscle labels
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (const [bodyPartIdStr, position] of Object.entries(bodyPartPositions)) {
      const bodyPartId = parseInt(bodyPartIdStr);
      const avgX = position.x / position.count;
      const avgY = position.y / position.count;
      
      // Get muscles for this body part
      const muscles = densePoseClient.getMuscleGroupsForBodyPart(bodyPartId);
      
      // Skip if no muscles associated
      if (muscles.length === 0) continue;
      
      // Draw each muscle name with slight offset
      muscles.forEach((muscle, idx) => {
        const offsetY = idx * 20 - (muscles.length - 1) * 10;
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(muscle).width;
        ctx.fillRect(avgX - textWidth/2 - 5, avgY + offsetY - 7, textWidth + 10, 14);
        
        // Draw label text - use muscle color
        const color = MUSCLE_COLORS[muscle] || 'white';
        ctx.fillStyle = color;
        ctx.fillText(muscle, avgX, avgY + offsetY);
      });
    }
  };
  
  return (
    <div className={`densepose-visualizer ${className}`}>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>DensePose Posing Analysis</CardTitle>
          <CardDescription>
            Detailed body surface analysis for precise posing guidance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="relative mb-4" style={{ width, height }}>
            {/* Base canvas for original image */}
            <canvas 
              ref={canvasRef} 
              width={width} 
              height={height} 
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {/* Overlay canvas for DensePose visualization */}
            <canvas 
              ref={overlayCanvasRef} 
              width={width} 
              height={height} 
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Visualization Mode</h3>
              <Tabs 
                defaultValue={visualizationMode} 
                onValueChange={(value) => setVisualizationMode(value as VisualizationMode)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-2">
                  <TabsTrigger value="bodyParts">Body Parts</TabsTrigger>
                  <TabsTrigger value="muscles">Muscles</TabsTrigger>
                  <TabsTrigger value="uvMap">UV Map</TabsTrigger>
                  <TabsTrigger value="posingGuide">Posing Guide</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium">Overlay Opacity</h3>
                <span className="text-xs">{Math.round(opacity * 100)}%</span>
              </div>
              <Slider 
                id="opacity-slider"
                min={0}
                max={100}
                step={1}
                value={[opacity * 100]}
                onValueChange={(values: number[]) => setOpacity(values[0] / 100)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Toggle 
                pressed={showGuideLines} 
                onPressedChange={setShowGuideLines}
                className="flex-grow"
              >
                Guide Lines
              </Toggle>
              
              <Toggle 
                pressed={showMuscleLabels} 
                onPressedChange={setShowMuscleLabels}
                className="flex-grow"
              >
                Labels
              </Toggle>
              
              <Toggle 
                pressed={highlightActivation} 
                onPressedChange={setHighlightActivation}
                className="flex-grow"
              >
                Activation
              </Toggle>
            </div>
            
            {visualizationMode === 'bodyParts' && (
              <div>
                <h3 className="text-sm font-medium mb-2">Filter Body Part</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={selectedBodyPart === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedBodyPart(null)}
                  >
                    All
                  </Badge>
                  
                  {Object.entries(BODY_PART_COLORS).map(([id, color]) => (
                    <Badge 
                      key={id}
                      variant={selectedBodyPart === parseInt(id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{ backgroundColor: selectedBodyPart === parseInt(id) ? color : undefined }}
                      onClick={() => setSelectedBodyPart(parseInt(id))}
                    >
                      {getBodyPartName(parseInt(id))}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            DensePose provides dense correspondences between image pixels and body surface
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default DensePoseVisualizer;
