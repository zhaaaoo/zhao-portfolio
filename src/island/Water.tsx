import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, type ShaderMaterial } from 'three';

type Props = { shallow: string; deep: string; foam: string; glow: number; shore: number };

// a stylised sea: gentle sine waves, deep-to-shallow colour by distance, and a foam band at the shoreline
export default function Water({ shallow, deep, foam, glow, shore }: Props) {
  const material = useRef<ShaderMaterial>(null);
  const params = useMemo(
    () => ({
      transparent: true,
      side: DoubleSide,
      uniforms: {
        time: { value: 0 },
        shallow: { value: new Color(shallow) },
        deep: { value: new Color(deep) },
        foam: { value: new Color(foam) },
        glow: { value: glow },
        shore: { value: shore },
      },
      vertexShader: /* glsl */ `
          uniform float time;
          varying vec3 vWorld;
          varying float vWave;
          void main() {
            vec3 p = position;
            float w = sin(p.x * 0.8 + time * 1.2) * 0.05 + sin(p.y * 1.1 + time * 0.9) * 0.04 + sin((p.x + p.y) * 2.3 + time * 2.0) * 0.015;
            p.z += w;
            vWave = w;
            vec4 world = modelMatrix * vec4(p, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
      fragmentShader: /* glsl */ `
          uniform float time;
          uniform vec3 shallow;
          uniform vec3 deep;
          uniform vec3 foam;
          uniform float glow;
          uniform float shore;
          varying vec3 vWorld;
          varying float vWave;
          void main() {
            float d = length(vWorld.xz);
            vec3 colour = mix(shallow, deep, smoothstep(shore, shore + 9.0, d));
            // foam rings that pulse toward the beach
            float band = smoothstep(shore - 0.4, shore, d) * (1.0 - smoothstep(shore, shore + 1.1, d)) * (0.55 + 0.45 * sin(d * 9.0 - time * 2.5));
            colour = mix(colour, foam * (1.0 + glow), clamp(band, 0.0, 1.0));
            // little highlights on wave crests
            colour += vec3(0.12) * smoothstep(0.06, 0.09, vWave);
            float fade = 1.0 - smoothstep(26.0, 34.0, d);
            // seen from below: a bright, rippling ceiling
            if (!gl_FrontFacing) colour = mix(shallow * 1.25, vec3(1.0), 0.25 + 3.0 * max(vWave, 0.0));
            gl_FragColor = vec4(colour, 0.92 * fade);
            #include <colorspace_fragment>
          }
        `,
    }),
    [shallow, deep, foam, glow, shore],
  );

  useFrame((state) => {
    material.current!.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[70, 70, 140, 140]} />
      <shaderMaterial key={JSON.stringify([shallow, deep, foam, glow])} ref={material} args={[params]} />
    </mesh>
  );
}
