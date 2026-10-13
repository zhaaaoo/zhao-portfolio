import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, Color, Vector3, type Group, type ShaderMaterial } from 'three';
import { sfx } from './sound';

export const FLOOR = -2.4;

const fishColours = ['#fc9ac9', '#fbe48d', '#a5f0db', '#ff9a5c', '#cbbcfc'];

// the sea floor, with caustics: bright webs where two warped sine fields cross zero
function Floor({ sand, haze }: { sand: string; haze: string }) {
  const material = useRef<ShaderMaterial>(null);
  const params = useMemo(
    () => ({
      uniforms: { time: { value: 0 }, sand: { value: new Color(sand) }, haze: { value: new Color(haze) } },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float time;
        uniform vec3 sand;
        uniform vec3 haze;
        varying vec3 vWorld;
        void main() {
          vec2 p = vWorld.xz * 1.4;
          float a = sin(p.x + sin(p.y * 1.3 + time * 0.9) * 1.3);
          float b = sin(p.y + sin(p.x * 1.1 - time * 0.7) * 1.3);
          float c = pow(1.0 - abs(a * b), 7.0);
          vec3 colour = sand * 0.75 + vec3(0.55, 0.9, 1.0) * c * 0.55;
          float fade = smoothstep(3.0, 15.0, distance(vWorld, cameraPosition));
          gl_FragColor = vec4(mix(colour, haze, fade), 1.0);
          #include <colorspace_fragment>
        }
      `,
    }),
    [sand, haze],
  );
  useFrame((state) => {
    material.current!.uniforms.time.value = state.clock.elapsedTime;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR, 0]}>
      <circleGeometry args={[18, 48]} />
      <shaderMaterial key={sand + haze} ref={material} args={[params]} />
    </mesh>
  );
}

function Coral() {
  const kelp = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    kelp.current!.children.forEach((strand, i) => {
      strand.rotation.z = Math.sin(t * 0.9 + i) * 0.18;
      strand.rotation.x = Math.cos(t * 0.7 + i * 2) * 0.12;
    });
  });
  return (
    <group position={[0, FLOOR, 0]}>
      {/* brain corals */}
      {(
        [
          [-1.2, 0.6, 0.45, '#cbbcfc'],
          [1.3, -0.4, 0.35, '#fc9ac9'],
          [0.2, -1.5, 0.3, '#fbe48d'],
        ] as const
      ).map(([x, z, r, colour]) => (
        <mesh key={x} position={[x, r * 0.4, z]} scale={[1, 0.7, 1]}>
          <icosahedronGeometry args={[r, 2]} />
          <meshStandardMaterial color={colour} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* branching coral */}
      {(
        [
          [0.6, 0.9, '#ff7eb6'],
          [-0.5, -0.8, '#ff9a5c'],
          [1.9, 0.8, '#ff7eb6'],
        ] as const
      ).map(([x, z, colour]) => (
        <group key={x} position={[x, 0, z]}>
          {[-0.5, -0.15, 0.2, 0.55, 0].map((a, i) => (
            <mesh key={i} position={[Math.sin(a) * 0.2, 0.28, Math.cos(a * 3) * 0.1]} rotation={[a * 0.6, 0, a]}>
              <capsuleGeometry args={[0.05, 0.5 - i * 0.04, 4, 8]} />
              <meshStandardMaterial color={colour} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {/* tube sponges */}
      {(
        [
          [-1.8, -0.6],
          [-0.2, 1.6],
        ] as const
      ).map(([x, z]) =>
        [0, 1, 2].map((i) => (
          <mesh key={`${x}:${i}`} position={[x + i * 0.14, 0.2 + i * 0.07, z + (i % 2) * 0.1]}>
            <cylinderGeometry args={[0.07, 0.06, 0.4 + i * 0.15, 12, 1, true]} />
            <meshStandardMaterial color="#a5f0db" emissive="#a5f0db" emissiveIntensity={0.25} side={2} />
          </mesh>
        )),
      )}
      {/* sea fans */}
      {[-0.9, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.45, -0.9]} rotation={[0, 0.4, 0]}>
          <circleGeometry args={[0.45, 20, 0, Math.PI]} />
          <meshStandardMaterial color="#b46cff" side={2} roughness={0.8} />
        </mesh>
      ))}
      {/* starfish */}
      {[
        [0.9, 1.6],
        [-1.5, 1.3],
      ].map(([x, z]) => (
        <group key={x} position={[x, 0.02, z]} rotation={[0, x, 0]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, (i / 5) * Math.PI * 2]} position={[0, 0.02, 0]}>
              <coneGeometry args={[0.05, 0.3, 6]} />
              <meshStandardMaterial color="#fbe48d" />
            </mesh>
          ))}
        </group>
      ))}
      <group ref={kelp}>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} position={[-2.6 + (i % 3) * 0.3 + (i > 5 ? 5 : 0), 0, -1.6 + Math.floor(i / 3) * 0.25]}>
            <mesh position={[0, 0.9 + (i % 2) * 0.2, 0]}>
              <capsuleGeometry args={[0.035, 1.8 + (i % 2) * 0.4, 4, 8]} />
              <meshStandardMaterial color="#5fbf8f" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Fish() {
  const school = useRef<Group>(null);
  const fish = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        r: 2.2 + (i % 5) * 0.18,
        y: -1.0 - (i % 4) * 0.22,
        phase: (i / 26) * 1.6 + (i % 3) * 0.12,
        dir: i < 16 ? 1 : -1,
        colour: fishColours[i % fishColours.length],
      })),
    [],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    school.current!.children.forEach((f, i) => {
      const s = fish[i];
      const a = t * 0.35 * s.dir + s.phase + (s.dir < 0 ? Math.PI : 0);
      f.position.set(Math.sin(a) * s.r, s.y + Math.sin(t * 1.3 + i) * 0.08, Math.cos(a) * s.r * 0.75);
      f.rotation.y = a + (s.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      f.children[1].rotation.y = Math.sin(t * 12 + i) * 0.5;
    });
  });
  return (
    <group ref={school}>
      {fish.map((f, i) => (
        <group key={i}>
          <mesh scale={[0.45, 0.7, 1]}>
            <sphereGeometry args={[0.09, 12, 8]} />
            <meshPhysicalMaterial color={f.colour} roughness={0.3} clearcoat={1} />
          </mesh>
          <group position={[0, 0, -0.09]}>
            <mesh position={[0, 0, -0.04]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.3, 1, 1]}>
              <coneGeometry args={[0.07, 0.09, 4]} />
              <meshStandardMaterial color={f.colour} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Turtle() {
  const turtle = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.18;
    const g = turtle.current!;
    g.position.set(Math.sin(t) * 3.6, -0.9 + Math.sin(t * 3) * 0.2, Math.cos(t) * 2.4);
    g.rotation.y = t + Math.PI / 2;
    g.children.slice(2).forEach((flipper, i) => (flipper.rotation.z = Math.sin(state.clock.elapsedTime * 2.4 + (i % 2) * 0.6) * 0.5 * (i % 2 ? 1 : -1)));
  });
  return (
    <group ref={turtle}>
      <mesh scale={[1, 0.45, 1.25]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#5fae7c" flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0.4]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color="#b8e0a0" />
      </mesh>
      {[
        [0.28, 0.2],
        [-0.28, 0.2],
        [0.22, -0.25],
        [-0.22, -0.25],
      ].map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[x > 0 ? 0.1 : -0.1, 0, 0]} scale={[1, 0.2, 0.5]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#b8e0a0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Shafts() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    group.current!.children.forEach((s, i) => {
      const m = (s as unknown as { material: { opacity: number } }).material;
      m.opacity = 0.06 + 0.05 * Math.sin(state.clock.elapsedTime * 0.6 + i * 1.7);
    });
  });
  return (
    <group ref={group}>
      {[-1.6, -0.3, 0.9, 2.1, 3.0].map((x, i) => (
        <mesh key={x} position={[x, -1.4, (i % 2) * 1.2 - 0.6]} rotation={[0.15, 0, 0.25]}>
          <cylinderGeometry args={[0.18, 0.75, 2.8, 16, 1, true]} />
          <meshBasicMaterial color="#e6fbff" transparent opacity={0.08} blending={AdditiveBlending} depthWrite={false} side={2} />
        </mesh>
      ))}
    </group>
  );
}

// bubbles leave from wherever her snorkel is and wobble up to the surface
function Bubbles({ source }: { source: RefObject<Group | null> }) {
  const group = useRef<Group>(null);
  const born = useRef(Array.from({ length: 14 }, () => ({ at: new Vector3(), t: -1 })));
  const centre = useRef(new Vector3());
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current!;
    g.parent!.worldToLocal(source.current!.getWorldPosition(centre.current));
    born.current.forEach((b, i) => {
      if (b.t < 0 || t - b.t > 2.4) {
        b.t = t + (i * 0.17) % 1.2;
        b.at.copy(centre.current).add(new Vector3(0, 0.6, 0));
      }
      const age = Math.max(0, t - b.t);
      const m = g.children[i];
      m.position.set(b.at.x + Math.sin(age * 6 + i) * 0.05, Math.min(-0.05, b.at.y + age * 0.7), b.at.z);
      m.scale.setScalar(age > 0 ? 0.03 + age * 0.012 : 0.0001);
    });
    if (Math.random() < dt * 0.7) sfx.bubble();
  });
  return (
    <group ref={group}>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.5} roughness={0} clearcoat={1} />
        </mesh>
      ))}
    </group>
  );
}

type Props = { at: Vector3; sand: string; haze: string; night: boolean; diver: RefObject<Group | null> };

export default function Reef({ at, sand, haze, night, diver }: Props) {
  return (
    <>
      <fog attach="fog" args={[haze, 1.5, 14]} />
      <group position={[at.x, 0, at.z]}>
        <Floor sand={sand} haze={haze} />
        <Coral />
        <Fish />
        <Turtle />
        <Shafts />
        <Bubbles source={diver} />
        <Sparkles position={[0, -1.2, 0]} count={50} scale={[7, 2.2, 6]} size={1.6} speed={0.15} color={night ? '#9ffcff' : '#ffffff'} opacity={0.6} />
      </group>
    </>
  );
}
