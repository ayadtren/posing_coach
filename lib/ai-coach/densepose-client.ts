/**
 * DensePose client for detailed body surface analysis
 * Interfaces with the DensePose Python service
 */

// Define the DensePose result interface
export interface DensePoseResult {
  num_instances: number;
  instances: DensePoseInstance[];
}

export interface DensePoseInstance {
  body_parts: number[][];  // I: body part segmentation
  u_coordinates: number[][]; // U coordinates for surface mapping
  v_coordinates: number[][]; // V coordinates for surface mapping
  bbox: number[];  // Bounding box [x1, y1, x2, y2]
  score: number;  // Detection confidence score
}

export interface DensePoseError {
  error: string;
}

export class DensePoseClient {
  private apiUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.apiUrl = baseUrl;
  }

  /**
   * Check if the DensePose service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        console.error('DensePose service health check failed');
        return false;
      }
      
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Error connecting to DensePose service:', error);
      return false;
    }
  }

  /**
   * Analyze an image with DensePose
   * @param imageDataUrl Base64 encoded image data URL
   */
  async analyzeImage(imageDataUrl: string): Promise<DensePoseResult | DensePoseError> {
    try {
      const response = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to analyze image with DensePose' };
      }
      
      return await response.json() as DensePoseResult;
    } catch (error) {
      console.error('Error analyzing image with DensePose:', error);
      return { error: 'Error connecting to DensePose service' };
    }
  }

  /**
   * Map DensePose body part IDs to human-readable names
   * @param partId The DensePose body part ID
   */
  getBodyPartName(partId: number): string {
    const bodyPartNames: Record<number, string> = {
      1: 'Torso',
      2: 'Right Hand',
      3: 'Left Hand',
      4: 'Left Foot',
      5: 'Right Foot',
      6: 'Upper Leg Right',
      7: 'Upper Leg Left',
      8: 'Lower Leg Right',
      9: 'Lower Leg Left',
      10: 'Upper Arm Left',
      11: 'Upper Arm Right',
      12: 'Lower Arm Left',
      13: 'Lower Arm Right',
      14: 'Head'
    };
    
    return bodyPartNames[partId] || 'Unknown';
  }

  /**
   * Get muscle groups associated with a specific body part
   * @param partId The DensePose body part ID
   */
  getMuscleGroupsForBodyPart(partId: number): string[] {
    const muscleGroups: Record<number, string[]> = {
      1: ['Pectorals', 'Abdominals', 'Obliques', 'Serratus', 'Lats'],  // Torso
      2: ['Forearm Flexors', 'Forearm Extensors'],  // Right Hand
      3: ['Forearm Flexors', 'Forearm Extensors'],  // Left Hand
      4: ['Foot Muscles', 'Ankle Flexors'],  // Left Foot
      5: ['Foot Muscles', 'Ankle Flexors'],  // Right Foot
      6: ['Quadriceps', 'Hamstrings', 'Adductors'],  // Upper Leg Right
      7: ['Quadriceps', 'Hamstrings', 'Adductors'],  // Upper Leg Left
      8: ['Calves', 'Tibialis Anterior'],  // Lower Leg Right
      9: ['Calves', 'Tibialis Anterior'],  // Lower Leg Left
      10: ['Biceps', 'Triceps', 'Deltoids'],  // Upper Arm Left
      11: ['Biceps', 'Triceps', 'Deltoids'],  // Upper Arm Right
      12: ['Forearm Flexors', 'Forearm Extensors'],  // Lower Arm Left
      13: ['Forearm Flexors', 'Forearm Extensors'],  // Lower Arm Right
      14: ['Neck Muscles', 'Facial Muscles']  // Head
    };
    
    return muscleGroups[partId] || [];
  }
} 