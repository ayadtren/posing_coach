/**
 * Reference Poses Service
 * Provides access to professional bodybuilder reference poses
 */

import { PoseType } from '@/lib/ai-coach/pose-analyzer';
import { BodybuilderReferencePose } from '@/lib/ai-coach/densepose-comparison';

// Mock reference poses for initial development
// In production, these would be loaded from a database
const MOCK_REFERENCE_POSES: BodybuilderReferencePose[] = [
  {
    id: 'arnold-front-double-biceps',
    bodybuilder: 'Arnold Schwarzenegger',
    name: 'Front Double Biceps',
    era: 'Golden Era',
    poseType: PoseType.FRONT_DOUBLE_BICEPS,
    imageUrl: '/images/pros/arnold-front-double-biceps.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'arnold-side-chest',
    bodybuilder: 'Arnold Schwarzenegger',
    name: 'Side Chest',
    era: 'Golden Era',
    poseType: PoseType.SIDE_CHEST,
    imageUrl: '/images/pros/arnold-side-chest.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'arnold-back-double-biceps',
    bodybuilder: 'Arnold Schwarzenegger',
    name: 'Back Double Biceps',
    era: 'Golden Era',
    poseType: PoseType.BACK_DOUBLE_BICEPS,
    imageUrl: '/images/pros/arnold-back-double-biceps.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'cbum-front-double-biceps',
    bodybuilder: 'Chris Bumstead',
    name: 'Front Double Biceps',
    era: 'Modern Classic',
    poseType: PoseType.FRONT_DOUBLE_BICEPS,
    imageUrl: '/images/pros/cbum-front-double-biceps.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'cbum-side-chest',
    bodybuilder: 'Chris Bumstead',
    name: 'Side Chest',
    era: 'Modern Classic',
    poseType: PoseType.SIDE_CHEST,
    imageUrl: '/images/pros/cbum-side-chest.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'ronnie-front-lat-spread',
    bodybuilder: 'Ronnie Coleman',
    name: 'Front Lat Spread',
    era: 'Mass Monster',
    poseType: PoseType.FRONT_RELAXED,
    imageUrl: '/images/pros/ronnie-front-lat-spread.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  },
  {
    id: 'zane-vacuum',
    bodybuilder: 'Frank Zane',
    name: 'Vacuum Pose',
    era: 'Golden Era',
    poseType: PoseType.ABDOMINAL_AND_THIGH,
    imageUrl: '/images/pros/zane-abs-thigh.jpg',
    densePoseData: {
      num_instances: 1,
      instances: [{
        body_parts: [], // This would contain actual data in production
        u_coordinates: [],
        v_coordinates: [],
        bbox: [0, 0, 100, 200],
        score: 0.99
      }]
    }
  }
];

/**
 * Reference Poses Service
 * Manages access to bodybuilder reference poses
 */
export class ReferencePosesService {
  private referencePoses: BodybuilderReferencePose[] = [];
  private initialized: boolean = false;
  
  constructor() {
    // Initialize with mock data for development
    this.referencePoses = MOCK_REFERENCE_POSES;
    this.initialized = true;
  }
  
  /**
   * Get all reference poses
   */
  public getAllReferencePoses(): BodybuilderReferencePose[] {
    return this.referencePoses;
  }
  
  /**
   * Get reference poses for a specific pose type
   */
  public getReferencePosesByType(poseType: PoseType): BodybuilderReferencePose[] {
    return this.referencePoses.filter(pose => pose.poseType === poseType);
  }
  
  /**
   * Get reference poses for a specific bodybuilder
   */
  public getReferencesByBodybuilder(bodybuilder: string): BodybuilderReferencePose[] {
    return this.referencePoses.filter(
      pose => pose.bodybuilder.toLowerCase().includes(bodybuilder.toLowerCase())
    );
  }
  
  /**
   * Get a single reference pose by ID
   */
  public getReferenceById(id: string): BodybuilderReferencePose | undefined {
    return this.referencePoses.find(pose => pose.id === id);
  }
  
  /**
   * Add a new reference pose
   */
  public addReferencePose(pose: BodybuilderReferencePose): void {
    this.referencePoses.push(pose);
  }
  
  /**
   * In a real implementation, this would fetch references from a database
   */
  public async loadReferencesFromDatabase(): Promise<void> {
    // In a real implementation, this would connect to Supabase or another database
    // For now, we'll just use the mock data
    console.log('Loaded reference poses from mock data');
    return Promise.resolve();
  }
}

// Create and export an instance for global use
export const referencePosesService = new ReferencePosesService(); 