import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D, type Group, type InstancedMesh } from 'three';

// a repeatable random number per index, so the island looks the same on every visit
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

type Spot = [x: number, z: number, r: number];

function scatter(count: number, seed: number, inner: number, outer: number, avoid: Spot[]) {
  const out: [number, number][] = [];
  for (let i = 0; out.length < count && i < count * 8; i++) {
    const a = rand(seed + i) * Math.PI * 2;
    const d = inner + Math.sqrt(rand(seed + i + 0.5)) * (outer - inner);
    const x = Math.sin(a) * d;
    const z = Math.cos(a) * d;
    if (avoid.every(([ax, az, r]) => Math.hypot(ax - x, az - z) > r)) out.push([x, z]);
  }
  return out;
}

function Field({ ground, avoid, night }: { ground: number; avoid: Spot[]; night: boolean }) {
  const flowers = useRef<InstancedMesh>(null);
  const grass = useRef<InstancedMesh>(null);
  const flowerSpots = useMemo(() => scatter(150, 1, 0.6, 5.0, avoid), [avoid]);
  const grassSpots = useMemo(() => scatter(320, 900, 0.4, 5.1, avoid), [avoid]);

  useLayoutEffect(() => {
    const o = new Object3D();
    const colours = ['#ffffff', '#fc9ac9', '#fbe48d', '#cbbcfc', '#ff7eb6'].map((c) => new Color(c));
    flowerSpots.forEach(([x, z], i) => {
      o.position.set(x, ground + 0.05, z);
      o.scale.setScalar(0.7 + rand(i + 3) * 0.6);
      o.updateMatrix();
      flowers.current!.setMatrixAt(i, o.matrix);
      flowers.current!.setColorAt(i, colours[i % colours.length]);
    });
    grassSpots.forEach(([x, z], i) => {
      o.position.set(x, ground + 0.06, z);
      o.rotation.set((rand(i + 40) - 0.5) * 0.5, 0, (rand(i + 41) - 0.5) * 0.5);
      o.scale.set(1, 0.7 + rand(i + 42) * 0.8, 1);
      o.updateMatrix();
      grass.current!.setMatrixAt(i, o.matrix);
    });
    flowers.current!.instanceMatrix.needsUpdate = true;
    grass.current!.instanceMatrix.needsUpdate = true;
    if (flowers.current!.instanceColor) flowers.current!.instanceColor.needsUpdate = true;
  }, [flowerSpots, grassSpots, ground]);

  return (
    <>
      <instancedMesh ref={flowers} args={[undefined, undefined, flowerSpots.length]}>
        <icosahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial roughness={0.6} emissive={night ? '#6b4fa8' : '#000000'} emissiveIntensity={0.4} />
      </instancedMesh>
      <instancedMesh ref={grass} args={[undefined, undefined, grassSpots.length]}>
        <coneGeometry args={[0.03, 0.14, 4]} />
        <meshStandardMaterial color={night ? '#2f6650' : '#5fbf7f'} flatShading />
      </instancedMesh>
    </>
  );
}

function Rocks({ colour }: { colour: string }) {
  const rocks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = rand(i + 300) * Math.PI * 2;
        return { a, d: 5.5 + rand(i + 301) * 0.9, s: 0.08 + rand(i + 302) * 0.18 };
      }),
    [],
  );
  return (
    <>
      {rocks.map(({ a, d, s }, i) => (
        <mesh key={i} position={[Math.sin(a) * d, 0.2 - (d - 5.5) * 0.12, Math.cos(a) * d]} rotation={[a, a * 2, 0]} scale={[s, s * 0.7, s]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={colour} flatShading roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

function Gulls() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    group.current!.children.forEach((bird, i) => {
      const a = t * 0.25 + i * 2.1;
      const r = 7 + i * 1.5;
      bird.position.set(Math.sin(a) * r, 5.2 + i * 0.5 + Math.sin(t + i) * 0.2, Math.cos(a) * r - 2);
      bird.rotation.y = a + Math.PI / 2;
      const flap = Math.sin(t * 7 + i) * 0.5;
      bird.children[0].rotation.z = flap;
      bird.children[1].rotation.z = -flap;
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.18, 0, 0]} rotation={[0, 0, side * 0.25]}>
                <boxGeometry args={[0.36, 0.02, 0.1]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Balloon({ night }: { night: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    ref.current!.position.y = 6.5 + Math.sin(t * 0.3) * 0.5;
    ref.current!.rotation.y = t * 0.1;
  });
  const stripes = ['#fc9ac9', '#ffffff', '#fbe48d', '#ffffff', '#a5f0db', '#ffffff', '#cbbcfc', '#ffffff'];
  return (
    <group ref={ref} position={[-7.5, 6.5, -6.5]}>
      {stripes.map((colour, i) => (
        <mesh key={i} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[1.1, 6, 20, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={colour} flatShading roughness={0.6} emissive={night ? '#ff9a5c' : '#000000'} emissiveIntensity={0.25} />
        </mesh>
      ))}
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.45, 0.2, 0.4, 8, 1, true]} />
        <meshStandardMaterial color="#fc9ac9" side={2} />
      </mesh>
      <mesh position={[0, -1.75, 0]}>
        <boxGeometry args={[0.36, 0.28, 0.36]} />
        <meshStandardMaterial color="#c49a6c" />
      </mesh>
      {night && <pointLight position={[0, -1.2, 0]} color="#ffb86b" intensity={3} distance={4} />}
    </group>
  );
}

// a donut pool float bobbing off the beach
function Donut() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    ref.current!.position.y = 0.04 + Math.sin(t * 1.4) * 0.05;
    ref.current!.rotation.set(Math.sin(t * 1.1) * 0.08, t * 0.15, Math.cos(t * 1.3) * 0.08);
  });
  const sprinkles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * Math.PI * 2 + rand(i) * 0.3, r: 0.32 + (rand(i + 9) - 0.5) * 0.12 })), []);
  return (
    <group ref={ref} position={[4.6, 0.04, 6.4]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.15, 16, 32]} />
        <meshPhysicalMaterial color="#fc9ac9" roughness={0.2} clearcoat={1} />
      </mesh>
      {sprinkles.map(({ a, r }, i) => (
        <mesh key={i} position={[Math.sin(a) * r, 0.14, Math.cos(a) * r]} rotation={[Math.PI / 2, 0, a * 3]}>
          <capsuleGeometry args={[0.012, 0.05, 2, 6]} />
          <meshStandardMaterial color={['#ffffff', '#fbe48d', '#a5f0db', '#cbbcfc'][i % 4]} />
        </mesh>
      ))}
    </group>
  );
}

export function Butterflies({ around, ground }: { around: [number, number]; ground: number }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    group.current!.children.forEach((b, i) => {
      const a = t * (0.5 + i * 0.1) + i * 2;
      b.position.set(around[0] + Math.sin(a) * (0.9 + i * 0.3), ground + 0.9 + i * 0.25 + Math.sin(t * 2 + i) * 0.2, around[1] + Math.cos(a * 1.3) * (1 + i * 0.2));
      b.rotation.y = a;
      const flap = Math.sin(t * 18 + i) * 0.9;
      b.children[0].rotation.y = flap;
      b.children[1].rotation.y = -flap;
    });
  });
  return (
    <group ref={group}>
      {['#fc9ac9', '#fbe48d', '#cbbcfc'].map((colour) => (
        <group key={colour}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.06, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.06, 12]} />
                <meshStandardMaterial color={colour} side={2} emissive={colour} emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function Dressing({ ground, avoid, night, rock }: { ground: number; avoid: Spot[]; night: boolean; rock: string }) {
  return (
    <>
      <Field ground={ground} avoid={avoid} night={night} />
      <Rocks colour={rock} />
      <Gulls />
      <Balloon night={night} />
      <Donut />
    </>
  );
}
