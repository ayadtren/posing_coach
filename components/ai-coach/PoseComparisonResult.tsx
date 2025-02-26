"use client";

import React from 'react';
import Image from 'next/image';
import { PoseComparisonResult as PoseComparisonResultType, PoseFeedbackItem, FeedbackImportance } from '@/lib/ai-coach/densepose-comparison';
import { BodybuilderReferencePose } from '@/lib/ai-coach/densepose-comparison';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PoseComparisonResultProps {
  comparisonResult: PoseComparisonResultType;
  userImageUrl: string;
  referencePose: BodybuilderReferencePose;
  className?: string;
}

/**
 * Helper function to get color based on score
 */
const getScoreColor = (score: number): string => {
  if (score >= 8) return 'bg-green-500';
  if (score >= 6) return 'bg-green-400';
  if (score >= 4) return 'bg-yellow-500';
  if (score >= 2) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Helper function to get color based on importance
 */
const getImportanceColor = (importance: FeedbackImportance): string => {
  switch (importance) {
    case FeedbackImportance.HIGH:
      return 'bg-red-500';
    case FeedbackImportance.MEDIUM:
      return 'bg-orange-400';
    case FeedbackImportance.LOW:
      return 'bg-blue-400';
    default:
      return 'bg-gray-400';
  }
};

/**
 * Component to display an individual feedback item
 */
const FeedbackItem = ({ item }: { item: PoseFeedbackItem }) => (
  <div className="flex items-start space-x-2 p-2 border rounded-md bg-gray-50">
    <Badge className={`${getImportanceColor(item.importance)} mt-1`}>
      {item.importance}
    </Badge>
    <div className="flex-1">
      <p>{item.message}</p>
      {item.score !== undefined && (
        <div className="flex items-center mt-1">
          <span className="text-sm mr-2">Score: {item.score.toFixed(1)}</span>
          <Progress 
            value={item.score * 10} 
            className="h-2 flex-1" 
          />
        </div>
      )}
    </div>
  </div>
);

/**
 * Component to display pose comparison results
 */
export const PoseComparisonResult: React.FC<PoseComparisonResultProps> = ({
  comparisonResult,
  userImageUrl,
  referencePose,
  className = '',
}) => {
  const { totalScore, symmetryScore, alignmentScore, muscleActivationScore, feedback } = comparisonResult;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Comparison Results</h3>
        <Badge className={`text-lg px-3 py-1 ${getScoreColor(totalScore)}`}>
          {totalScore.toFixed(1)}/10
        </Badge>
      </div>
      
      {/* Images comparison (optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Your Pose</h4>
          <div className="relative w-full h-[200px] bg-gray-100 rounded-md overflow-hidden">
            <Image
              src={userImageUrl}
              alt="Your pose"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Reference Pose</h4>
          <div className="relative w-full h-[200px] bg-gray-100 rounded-md overflow-hidden">
            <Image
              src={referencePose.imageUrl}
              alt={`${referencePose.bodybuilder} ${referencePose.name}`}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
      
      {/* Score breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span>Symmetry</span>
                <span>{symmetryScore.toFixed(1)}/10</span>
              </div>
              <Progress value={symmetryScore * 10} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Alignment</span>
                <span>{alignmentScore.toFixed(1)}/10</span>
              </div>
              <Progress value={alignmentScore * 10} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Muscle Activation</span>
                <span>{muscleActivationScore.toFixed(1)}/10</span>
              </div>
              <Progress value={muscleActivationScore * 10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed feedback */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {feedback.length > 0 ? (
              feedback.map((item, index) => (
                <FeedbackItem key={index} item={item} />
              ))
            ) : (
              <p className="text-gray-500">No detailed feedback available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  ); 