import { forwardRef } from 'react'
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  Vignette,
  ToneMapping 
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'

interface AtmosphericPostProcessingProps {
  timeOfDay?: number
  enabled?: boolean
}

const AtmosphericPostProcessing = forwardRef<any, AtmosphericPostProcessingProps>(
  ({ timeOfDay = 0.3, enabled = true }, ref) => {
    if (!enabled) return null

    // Calculate intensity based on time of day
    const nightIntensity = timeOfDay < 0.3 || timeOfDay > 0.7 ? 1.0 : 0.0
    
    // Dynamic bloom intensity for atmospheric glow
    const bloomIntensity = 0.3 + nightIntensity * 0.7
    
    // Chromatic aberration for atmospheric distortion
    const chromaticAberrationIntensity = 0.0005 + nightIntensity * 0.0015
    
    // Vignette for atmospheric depth
    const vignetteIntensity = 0.2 + nightIntensity * 0.3

    return (
      <EffectComposer ref={ref}>
        {/* Tone Mapping for realistic color response */}
        <ToneMapping 
          mode={ToneMappingMode.ACES_FILMIC}
          resolution={256}
          whitePoint={2.0}
          middleGrey={0.6}
          minLuminance={0.01}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />

        {/* Bloom for atmospheric glow */}
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          radius={0.85}
          blendFunction={BlendFunction.ADD}
        />

        {/* Chromatic Aberration for atmospheric refraction */}
        <ChromaticAberration
          offset={new Vector2(chromaticAberrationIntensity, chromaticAberrationIntensity)}
          radialModulation={false}
          modulationOffset={0.15}
        />

        {/* Vignette for atmospheric depth */}
        <Vignette
          offset={0.15}
          darkness={vignetteIntensity}
          eskil={false}
          blendFunction={BlendFunction.MULTIPLY}
        />
      </EffectComposer>
    )
  }
)

AtmosphericPostProcessing.displayName = 'AtmosphericPostProcessing'

export default AtmosphericPostProcessing