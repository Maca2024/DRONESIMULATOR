import React from 'react';

interface PostProcessingEffectsProps {
  enabled?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

// Disabled due to WebGL compatibility issues with some browsers
export const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = () => {
  return null;
};
