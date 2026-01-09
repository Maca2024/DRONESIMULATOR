import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

interface PostProcessingEffectsProps {
  enabled?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({
  enabled = true,
  quality = 'medium'
}) => {
  if (!enabled) return null;

  const bloomIntensity = quality === 'high' ? 0.8 : quality === 'medium' ? 0.5 : 0.3;
  const chromaticOffset = quality === 'high' ? 0.002 : quality === 'medium' ? 0.001 : 0.0005;

  return (
    <EffectComposer>
      {/* Anti-aliasing */}
      <SMAA />

      {/* Bloom for glowing effects */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      {/* Chromatic aberration for speed effect */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(chromaticOffset, chromaticOffset)}
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* Vignette for cinematic feel */}
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
