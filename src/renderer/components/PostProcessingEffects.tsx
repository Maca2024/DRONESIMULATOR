import React, { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, N8AO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useSettingsStore } from '../store/settingsStore';

interface PostProcessingEffectsProps {
  enabled?: boolean;
  quality?: 'low' | 'medium' | 'high';
  droneSpeed?: number; // 0-1 normalized speed
}

export const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({
  enabled = true,
  quality = 'medium',
  droneSpeed = 0,
}) => {
  const postProcessing = useSettingsStore((state) => state.settings.graphics.postProcessing);
  const reduceMotion = useSettingsStore((state) => state.settings.accessibility.reduceMotion);

  // Chromatic aberration offset based on speed
  const chromaticOffset = useMemo(() => {
    if (reduceMotion) return new THREE.Vector2(0, 0);
    const offset = droneSpeed * 0.003;
    return new THREE.Vector2(offset, offset);
  }, [droneSpeed, reduceMotion]);

  if (!enabled || !postProcessing) return null;

  // Dynamic vignette darkness based on speed
  const vignetteDarkness = reduceMotion ? 0.3 : 0.5 + droneSpeed * 0.3;

  const showChromatic = droneSpeed > 0.3 && !reduceMotion;
  const showAO = quality !== 'low';

  return (
    <EffectComposer multisampling={quality === 'low' ? 0 : 4}>
      <Bloom
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        intensity={0.8}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      {showChromatic ? (
        <ChromaticAberration
          offset={chromaticOffset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0.0}
        />
      ) : (
        <></>
      )}
      {showAO ? (
        <N8AO
          aoRadius={0.5}
          intensity={1.0}
          distanceFalloff={0.5}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
};
