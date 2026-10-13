import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  CameraControls,
  Environment,
  Html,
  Lightformer,
  Outlines,
  PerformanceMonitor,
  RoundedBox,
  Sparkles,
  Stars,
} from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  LatheGeometry,
  Plane,
  Raycaster,
  SRGBColorSpace,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Group,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
} from 'three';
import Zhao, { type Outfit, type Pose } from './Zhao';
import Water from './Water';
import Run from './Run';
import Reef from './Reef';
import Dressing, { Butterflies, rand } from './Dressing';
import { beats, isMuted, music, setMuted, sfx } from './sound';

export type ZoneId = 'work' | 'projects' | 'snowboard' | 'dive' | 'boulder' | 'hike' | 'dance';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GROUND = 0.35;

const palettes = {
  light: {
    sky: ['#ffd6ec', '#e9e2ff', '#c9f1ff'],
    deep: ['#8fe6f2', '#2a9fbf', '#0b4f7a'],
    haze: '#2f9fc0',
    seabed: '#f1d9b0',
    grass: '#8fdc9c',
    sand: '#ffe9c9',
    rock: '#c7bfe8',
    ink: '#1b1743',
    pink: '#fc9ac9',
    mint: '#a5f0db',
    butter: '#fbe48d',
    lilac: '#cbbcfc',
    sea: ['#9fe6f0', '#5aa9e6', '#ffffff'],
    glow: 0,
    night: false,
  },
  dark: {
    sky: ['#2c1847', '#141033', '#0b1d33'],
    deep: ['#1d4e7a', '#0c2a4d', '#050f26'],
    haze: '#0b2a4a',
    seabed: '#6b6390',
    grass: '#3f7a63',
    sand: '#8a7a92',
    rock: '#4b4478',
    ink: '#0b0920',
    pink: '#fc9ac9',
    mint: '#a5f0db',
    butter: '#fbe48d',
    lilac: '#cbbcfc',
    sea: ['#1d4e7a', '#0c1f3d', '#7ff7e8'],
    glow: 1.6,
    night: true,
  },
};
type Palette = (typeof palettes)['light'];

// a wobbly coastline: the island's radius varies with the angle
const coast = (a: number) => 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.sin(7 * a + 1) + 0.025 * Math.sin(13 * a + 2);
const onIsland = (x: number, z: number) => Math.hypot(x, z) < 5.6 * coast(Math.atan2(x, z));
const heading = (a: Vector3, b: Vector3) => Math.atan2(b.x - a.x, b.z - a.z);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => clamp01(x) ** 2 * (3 - 2 * clamp01(x));

// paths for the activities that move, as functions of progress u in [0, 1]
const mountain = new Vector3(-2.8, GROUND, -2.6);
const hill = new Vector3(2.9, GROUND, -2.3);
const pierDir = new Vector2(-0.55, 0.83).normalize();
const pierEnd = new Vector3(pierDir.x * 8.4, 0.3, pierDir.y * 8.4);
const reef = new Vector3(pierDir.x * 11, 0, pierDir.y * 11);
const splash = new Vector3(pierDir.x * 10, -0.3, pierDir.y * 10);
const boulder = new Vector3(3.9, GROUND, 0.7);
const pad = new Vector3(3.9, GROUND + 0.16, 1.95);
// how far the boulder's face sticks out at a given height, so she climbs on its surface
const face = (h: number) => boulder.z + 0.855 * Math.sqrt(Math.max(0, 1 - ((h - 0.7) / 1.395) ** 2));

const paths = {
  snowboard: (u: number) => {
    const d = 0.35 + 1.95 * u;
    const a = 0.25 + 0.55 * Math.sin(u * Math.PI * 3);
    return new Vector3(mountain.x + Math.sin(a) * d, GROUND + 3.3 * (1 - d / 2.3) + 0.04, mountain.z + Math.cos(a) * d);
  },
  hike: (u: number) => {
    const d = 1.9 - 1.75 * u;
    const a = 0.2 + u * Math.PI * 1.6;
    return new Vector3(hill.x + Math.sin(a) * d, GROUND + 1.5 * Math.sqrt(Math.max(0, 1 - (d / 1.9) ** 2)), hill.z + Math.cos(a) * d);
  },
  swim: (a: number) => new Vector3(reef.x + Math.sin(a) * 1.6, -1.35 + Math.sin(a * 2) * 0.15, reef.z + Math.sin(a * 2) * 0.8),
};

type Zone = { id: ZoneId; label: string; at: Vector3; pose: Pose; outfit: Outfit };

const zones: Zone[] = [
  { id: 'work', label: 'work · laptop', at: new Vector3(-0.6, GROUND, 1.95), pose: 'type', outfit: 'work' },
  { id: 'projects', label: 'side projects', at: new Vector3(0.85, GROUND, 1.75), pose: 'wave', outfit: 'none' },
  { id: 'snowboard', label: 'snowboarding', at: paths.snowboard(0), pose: 'board', outfit: 'snow' },
  { id: 'hike', label: 'hiking', at: paths.hike(0), pose: 'walk', outfit: 'hike' },
  { id: 'boulder', label: 'bouldering', at: pad, pose: 'chalk', outfit: 'none' },
  { id: 'dance', label: 'dance', at: new Vector3(2.1, GROUND + 0.12, 2.8), pose: 'dance', outfit: 'dance' },
  { id: 'dive', label: 'diving', at: pierEnd, pose: 'idle', outfit: 'dive' },
];

// keep flowers and grass off the spots
const avoid: [number, number, number][] = [
  [-0.6, 1.4, 1.4],
  [0.85, 1.35, 0.6],
  [mountain.x, mountain.z, 2.4],
  [hill.x, hill.z, 2.0],
  [boulder.x, boulder.z + 0.6, 1.4],
  [2.1, 2.8, 1.1],
  [0.6, 0.3, 0.4],
];

const home = new Vector3(0.6, GROUND, 0.3);

// camera position and target per spot, framing the whole route for the activities that move
const shots: Record<ZoneId, [number, number, number, number, number, number]> = {
  work: [0.6, 2.4, 6.2, -0.6, 0.85, 2.0],
  projects: [1.6, 2.6, 5.6, 0.85, 1.1, 1.4],
  snowboard: [1.2, 4.8, 7.0, -2.4, 1.7, -1.5],
  hike: [1.4, 4.4, 4.6, 2.9, 1.1, -2.1],
  boulder: [6.4, 3.4, 7.6, 3.9, 1.8, 1.1],
  dance: [3.0, 3.0, 7.6, 2.1, 0.9, 2.8],
  dive: [-3.2, 3.2, 12.0, pierEnd.x + pierDir.x, 0, pierEnd.z + pierDir.y],
};

const captions = ['POV: the build passed first try', 'when the PR gets approved', 'me after fixing the flaky test', 'CI is green, so we dance'];
const reactions = ['💖', '🔥', '✨', '💅', '🫶', '😭', '💀', '🎉'];
const chips = ['</>', 'useState()', '✓ tests pass', 'npm run build', 'LGTM ✨', '{ ...props }'];

function Toy({ color, rough = 0.35 }: { color: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.8} clearcoatRoughness={0.25} />;
}

function Sky({ colours }: { colours: string[] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    colours.forEach((colour, i) => g.addColorStop(i / (colours.length - 1), colour));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [colours]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <primitive attach="background" object={texture} />;
}

function Terrain({ c }: { c: Palette }) {
  const geometry = useMemo(() => {
    const profile = [
      [0, GROUND],
      [5.2, GROUND],
      [5.6, GROUND - 0.04],
      [6.0, 0.16],
      [6.9, 0.04],
      [7.6, -0.45],
      [7.2, -1.8],
      [0, -2.2],
    ]
      // lathe faces point outward when the profile runs from the bottom up
      .reverse()
      .map(([r, y]) => new Vector2(r, y));
    const g = new LatheGeometry(profile, 72);
    const pos = g.attributes.position;
    const colours = new Float32Array(pos.count * 3);
    const grass = new Color(c.grass);
    const sand = new Color(c.sand);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const k = coast(Math.atan2(x, z));
      pos.setXYZ(i, x * k, y, z * k);
      (y > GROUND - 0.02 ? grass : sand).toArray(colours, i * 3);
    }
    g.setAttribute('color', new BufferAttribute(colours, 3));
    g.computeVertexNormals();
    return g;
  }, [c]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={0.9} />
    </mesh>
  );
}

function Mountain({ c }: { c: Palette }) {
  const pines = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = -1.2 + (i / 10) * 3.6 + rand(i + 70) * 0.2;
        const d = 2.15 + rand(i + 71) * 0.5;
        return [Math.sin(a) * d, Math.cos(a) * d, 0.7 + rand(i + 72) * 0.5] as const;
      }),
    [],
  );
  return (
    <group position={mountain}>
      <mesh position={[0, 1.65, 0]}>
        <coneGeometry args={[2.3, 3.3, 9]} />
        <meshStandardMaterial color={c.rock} flatShading roughness={0.8} />
        <Outlines thickness={0.02} color={c.ink} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <coneGeometry args={[0.87, 1.25, 9]} />
        <meshStandardMaterial color="#ffffff" flatShading roughness={0.6} />
      </mesh>
      {pines.map(([x, z, s]) => (
        <group key={x} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.22, 0.5, 7]} />
            <meshStandardMaterial color={c.night ? '#22504f' : '#3c8f7f'} flatShading />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <coneGeometry args={[0.15, 0.35, 7]} />
            <meshStandardMaterial color="#ffffff" flatShading />
          </mesh>
        </group>
      ))}
      <Sparkles position={[0, 2.6, 0.6]} count={30} scale={[2.4, 1.5, 2]} size={2.5} speed={0.6} color="#ffffff" />
    </group>
  );
}

function Hill({ c }: { c: Palette }) {
  const stones = useMemo(() => Array.from({ length: 22 }, (_, i) => paths.hike(i / 21)), []);
  return (
    <group>
      <mesh position={hill} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[1.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={c.grass} flatShading roughness={0.9} />
      </mesh>
      {stones.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.01, p.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.09, 6]} />
          <meshStandardMaterial color={c.sand} />
        </mesh>
      ))}
      <group position={[hill.x, GROUND + 1.5, hill.z]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
        <mesh position={[0.17, 0.68, 0]}>
          <boxGeometry args={[0.32, 0.2, 0.01]} />
          <Toy color={c.pink} />
        </mesh>
      </group>
      <Butterflies around={[1.7, -0.9]} ground={GROUND} />
    </group>
  );
}

function Boulder({ c, padRef }: { c: Palette; padRef: RefObject<Group | null> }) {
  const holds: [number, number, string][] = [
    [-0.25, 0.25, c.pink],
    [0.2, 0.55, c.mint],
    [-0.15, 0.85, c.butter],
    [0.25, 1.1, c.lilac],
    [-0.05, 1.35, c.pink],
    [0.18, 1.62, c.mint],
  ];
  return (
    <>
      <group position={boulder}>
        <mesh position={[0, 0.7, 0]} scale={[1, 1.55, 0.95]}>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color={c.rock} flatShading roughness={0.8} />
          <Outlines thickness={0.015} color={c.ink} />
        </mesh>
        {holds.map(([x, y, colour]) => (
          <mesh key={y} position={[x, y, face(y) - boulder.z - 0.03]} scale={[1.3, 0.8, 0.6]}>
            <icosahedronGeometry args={[0.07, 0]} />
            <Toy color={colour} />
          </mesh>
        ))}
      </group>
      {/* crash pad */}
      <group ref={padRef} position={[pad.x, GROUND, pad.z]}>
        <RoundedBox args={[1.1, 0.16, 0.8]} radius={0.05} position={[0, 0.08, 0]}>
          <Toy color={c.lilac} rough={0.7} />
          <Outlines thickness={0.01} color={c.ink} />
        </RoundedBox>
        <mesh position={[0, 0.162, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.12]} />
          <meshStandardMaterial color={c.pink} />
        </mesh>
      </group>
    </>
  );
}

function screenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#1b1743';
  g.fillRect(0, 0, 256, 160);
  const colours = ['#fc9ac9', '#a5f0db', '#fbe48d', '#cbbcfc'];
  for (let i = 0; i < 12; i++) {
    g.fillStyle = colours[i % 4];
    g.fillRect(14 + (i % 3) * 14, 14 + i * 11, 40 + rand(i + 200) * 150, 5);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Steam() {
  const g = useRef<Group>(null);
  useFrame((state) => {
    g.current!.children.forEach((m, i) => {
      const u = (state.clock.elapsedTime * 0.45 + i / 3) % 1;
      m.position.set(Math.sin(u * 6 + i) * 0.03, u * 0.35, 0);
      m.scale.setScalar(0.02 + u * 0.04);
      ((m as Mesh).material as MeshBasicMaterial).opacity = (1 - u) * 0.55;
    });
  });
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Hut({ c }: { c: Palette }) {
  const screen = useMemo(() => screenTexture(), []);
  useEffect(() => () => screen.dispose(), [screen]);
  return (
    <group position={[-0.6, GROUND, 0.75]}>
      <RoundedBox args={[1.5, 0.95, 1.0]} radius={0.06} position={[0, 0.475, 0]}>
        <Toy color={c.butter} />
        <Outlines thickness={0.012} color={c.ink} />
      </RoundedBox>
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.25, 0.65, 4]} />
        <Toy color={c.pink} />
        <Outlines thickness={0.012} color={c.ink} />
      </mesh>
      {/* striped awning over the counter */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.2, 0.92, 0.62]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.35]} />
          <Toy color={i % 2 ? '#ffffff' : c.pink} />
        </mesh>
      ))}
      {/* stool, table, laptop and coffee out front, clear of the awning */}
      <mesh position={[0, 0.16, 1.2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.32, 16]} />
        <Toy color={c.lilac} />
      </mesh>
      <RoundedBox args={[0.9, 0.05, 0.5]} radius={0.02} position={[0, 0.58, 1.65]}>
        <Toy color="#ffffff" />
        <Outlines thickness={0.008} color={c.ink} />
      </RoundedBox>
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.28, 1.65]}>
          <cylinderGeometry args={[0.025, 0.025, 0.56, 8]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
      ))}
      <RoundedBox args={[0.42, 0.02, 0.28]} radius={0.008} position={[0, 0.615, 1.56]}>
        <Toy color={c.lilac} />
      </RoundedBox>
      <group position={[0, 0.625, 1.69]} rotation={[0.3, 0, 0]}>
        <RoundedBox args={[0.42, 0.28, 0.02]} radius={0.008} position={[0, 0.14, 0]}>
          <Toy color={c.lilac} />
        </RoundedBox>
        <mesh position={[0, 0.15, 0.012]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={c.pink} />
        </mesh>
        <mesh position={[0, 0.14, -0.012]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.38, 0.24]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0.8, 1.5]} color={c.lilac} intensity={0.3} distance={1.2} />
      <group position={[0.3, 0.605, 1.55]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.12, 16]} />
          <Toy color={c.mint} />
        </mesh>
        <mesh position={[0.055, 0.06, 0]}>
          <torusGeometry args={[0.03, 0.01, 6, 12]} />
          <Toy color={c.mint} />
        </mesh>
        <group position={[0, 0.14, 0]}>
          <Steam />
        </group>
      </group>
    </group>
  );
}

function Corkboard({ c }: { c: Palette }) {
  const notes = [c.pink, c.mint, c.butter, c.lilac, '#ffffff'];
  return (
    <group position={[0.85, GROUND, 1.35]} rotation={[0, -0.25, 0]}>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
      ))}
      <RoundedBox args={[0.95, 0.6, 0.05]} radius={0.02} position={[0, 0.9, 0]}>
        <Toy color="#e0b98a" rough={0.8} />
        <Outlines thickness={0.01} color={c.ink} />
      </RoundedBox>
      {notes.map((colour, i) => (
        <mesh key={i} position={[-0.3 + (i % 3) * 0.3, 0.98 - Math.floor(i / 3) * 0.24, 0.03]} rotation={[0, 0, (i - 2) * 0.12]}>
          <planeGeometry args={[0.2, 0.18]} />
          <meshStandardMaterial color={colour} />
        </mesh>
      ))}
    </group>
  );
}

function Caption() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % captions.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tiktok">
      <span className="tiktok-rec">● REC</span>
      {captions[i]}
    </span>
  );
}

function DanceFloor({ c, active }: { c: Palette; active: boolean }) {
  const tiles = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (x * x + z * z <= 5) out.push([x * 0.32, z * 0.32]);
    return out;
  }, []);
  const group = useRef<Group>(null);
  const ball = useRef<Mesh>(null);
  const lights = useRef<Group>(null);
  const colours = useMemo(() => [c.pink, c.mint, c.butter, c.lilac].map((x) => new Color(x)), [c]);
  useFrame((state, dt) => {
    // tiles chase through the palette on the beat while she's dancing
    const b = beats();
    const step = active ? Math.floor(b * 2) : Math.floor(state.clock.elapsedTime * 1.5);
    const hit = Math.exp(-(b % 1) * 4);
    group.current!.children.forEach((tile, i) => {
      const lit = (((i + step) % 4) + 4) % 4;
      const material = (tile as Mesh).material as Material & { color: Color; emissiveIntensity: number };
      material.color.copy(colours[lit]);
      material.emissiveIntensity = active && lit === 0 ? 0.6 + hit * 0.8 : 0.15;
    });
    ball.current!.rotation.y += dt * (active ? 1.5 : 0.3);
    lights.current!.children.forEach((l, i) => {
      (l as PointLight).intensity = active ? 1.5 + hit * 4 * ((Math.floor(b) + i) % 2) : 0;
    });
  });
  return (
    <group position={[2.1, GROUND, 2.8]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.95, 1.0, 0.1, 32]} />
        <Toy color="#ffffff" />
        <Outlines thickness={0.01} color={c.ink} />
      </mesh>
      <group ref={group}>
        {tiles.map(([x, z]) => (
          <mesh key={`${x}:${z}`} position={[x, 0.105, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.29, 0.29]} />
            <meshStandardMaterial color={c.pink} emissive="#ffffff" emissiveIntensity={0.15} />
          </mesh>
        ))}
      </group>
      <mesh position={[0.95, 0.9, -0.6]}>
        <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
        <meshStandardMaterial color={c.ink} />
      </mesh>
      <mesh ref={ball} position={[0.95, 1.85, -0.6]}>
        <icosahedronGeometry args={[0.18, 2]} />
        <meshStandardMaterial color="#efeaff" emissive="#b9a8ff" emissiveIntensity={0.45} metalness={0.8} roughness={0.18} flatShading />
      </mesh>
      <group ref={lights}>
        <pointLight position={[-0.6, 0.9, 0.2]} color={c.pink} distance={3} intensity={0} />
        <pointLight position={[0.6, 0.9, 0.4]} color={c.mint} distance={3} intensity={0} />
      </group>
      {/* a phone on a ring light, filming */}
      <group position={[-1.2, 0, 0.75]} rotation={[0, Math.atan2(1.2, -0.75), 0]} scale={0.85}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.sin((i / 3) * Math.PI * 2) * 0.12, 0.45, Math.cos((i / 3) * Math.PI * 2) * 0.12]} rotation={[Math.cos((i / 3) * Math.PI * 2) * 0.25, 0, -Math.sin((i / 3) * Math.PI * 2) * 0.25]}>
            <cylinderGeometry args={[0.012, 0.012, 0.92, 6]} />
            <meshStandardMaterial color={c.ink} />
          </mesh>
        ))}
        <mesh position={[0, 1.15, 0]}>
          <torusGeometry args={[0.24, 0.03, 12, 40]} />
          <meshBasicMaterial color={active ? [2.6, 2.4, 2.6] : '#ffffff'} toneMapped={!active} />
        </mesh>
        <RoundedBox args={[0.11, 0.2, 0.02]} radius={0.01} position={[0, 1.15, 0]}>
          <Toy color={c.pink} />
        </RoundedBox>
      </group>
      {active && <Sparkles position={[0, 1, 0]} count={40} scale={[2.2, 1.6, 2.2]} size={4} speed={1} color={c.pink} />}
    </group>
  );
}

function Pier({ c }: { c: Palette }) {
  const planks = useMemo(() => Array.from({ length: 12 }, (_, i) => 5.8 + i * 0.24), []);
  const angle = Math.atan2(pierDir.x, pierDir.y);
  return (
    <group rotation={[0, angle, 0]}>
      {planks.map((r) => (
        <mesh key={r} position={[0, 0.3, r]}>
          <boxGeometry args={[0.7, 0.05, 0.2]} />
          <Toy color="#e7c9a0" rough={0.8} />
        </mesh>
      ))}
      {[6.2, 7.4, 8.5].flatMap((r) =>
        [-0.32, 0.32].map((x) => (
          <mesh key={`${r}:${x}`} position={[x, 0, r]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color={c.ink} />
          </mesh>
        )),
      )}
      {/* a life ring on the last post */}
      <mesh position={[0.4, 0.42, 8.5]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.13, 0.045, 10, 24]} />
        <Toy color={c.pink} />
      </mesh>
    </group>
  );
}

function Sakura({ at, c }: { at: [number, number]; c: Palette }) {
  return (
    <group position={[at[0], GROUND, at[1]]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.9, 8]} />
        <meshStandardMaterial color="#9a6b5a" flatShading />
      </mesh>
      {[
        [0, 1.05, 0, 0.42],
        [0.28, 0.92, 0.1, 0.3],
        [-0.25, 0.95, -0.08, 0.32],
      ].map(([x, y, z, r]) => (
        <mesh key={x} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={c.night ? '#d98ab0' : '#ffc1dc'} flatShading roughness={0.8} />
        </mesh>
      ))}
      <Sparkles position={[0, 0.7, 0]} count={6} scale={[1, 1.2, 1]} size={3} speed={0.3} color="#ffc1dc" />
    </group>
  );
}

function Palm({ at, c }: { at: [number, number]; c: Palette }) {
  return (
    <group position={[at[0], 0.12, at[1]]} rotation={[0, at[0], 0.12]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[i * 0.03, 0.12 + i * 0.22, 0]}>
          <cylinderGeometry args={[0.07, 0.085, 0.22, 7]} />
          <meshStandardMaterial color="#c49a6c" flatShading />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.18, 1.38, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0.6]} scale={[0.55, 0.06, 0.16]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={c.night ? '#3f8f6a' : '#7fd6a0'} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Clouds() {
  const group = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!reduced) group.current!.rotation.y += dt * 0.02;
  });
  const puffs: [number, number, number, number][] = [
    [-6, 6, -5, 1],
    [7, 5.5, -3, 0.8],
    [-8, 5, 4, 0.9],
    [5, 6.5, 6, 0.7],
  ];
  return (
    <group ref={group}>
      {puffs.map(([x, y, z, s]) => (
        <group key={x} position={[x, y, z]} scale={s}>
          {[
            [0, 0, 0, 0.9],
            [0.9, -0.15, 0.1, 0.7],
            [-0.85, -0.2, 0, 0.65],
            [0.3, 0.45, 0, 0.6],
          ].map(([px, py, pz, r]) => (
            <mesh key={px} position={[px, py, pz]}>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Lanterns() {
  const spots: [number, number, number][] = [
    [-1.55, GROUND + 1.0, 1.4],
    [0.35, GROUND + 1.0, 1.4],
    [pierEnd.x, 0.75, pierEnd.z],
    [1.2, GROUND + 0.6, 3.4],
  ];
  return (
    <>
      {spots.map((p) => (
        <mesh key={p.join()} position={p}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={[2.4, 1.6, 0.8]} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function DropRing({ zone, hot, show, onPick }: { zone: Zone; hot: boolean; show: boolean; onPick: () => void }) {
  const ring = useRef<Group>(null);
  useFrame((state) => {
    const s = hot ? 1.35 : 1 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 3 + zone.at.x) * 0.06);
    ring.current!.scale.setScalar(s);
  });
  return (
    <group position={[zone.at.x, zone.at.y + 0.02, zone.at.z]}>
      <group ref={ring} visible={show}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshBasicMaterial color={hot ? [2.4, 0.6, 1.6] : '#fc9ac9'} toneMapped={false} transparent opacity={hot ? 1 : 0.8} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), onPick())} visible={false}>
        <circleGeometry args={[0.5, 16]} />
      </mesh>
      <Html center position={[0, 0.9, 0]} className="desk-label" zIndexRange={[5, 0]} style={{ opacity: show ? 1 : 0 }}>
        {zone.label}
      </Html>
    </group>
  );
}

type Burst = { id: number; at: [number, number, number]; colours: string[]; spread: number; up: number };
const dirs = Array.from({ length: 16 }, (_, i) => new Vector3(rand(i) - 0.5, rand(i + 20), rand(i + 40) - 0.5).normalize());

// a one-shot puff of particles: outfit changes, splashes, chalk, confetti
function Poof({ b }: { b: Burst }) {
  const g = useRef<Group>(null);
  const start = useRef(-1);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (start.current < 0) start.current = t;
    const u = Math.min(1, (t - start.current) / 0.9);
    const e = 1 - (1 - u) ** 3;
    g.current!.children.forEach((m, i) => {
      const d = dirs[i];
      m.position.set(d.x * e * b.spread, d.y * e * b.spread * 0.6 + b.up * (e - u * u * 0.6), d.z * e * b.spread);
      m.scale.setScalar(Math.max(0.0001, (1 - u) * 0.06));
      m.rotation.set(u * 6 + i, u * 4, 0);
    });
  });
  return (
    <group ref={g} position={b.at}>
      {dirs.map((_, i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={b.colours[i % b.colours.length]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

type Mode =
  | { kind: 'idle' }
  | { kind: 'drag' }
  | { kind: 'hop'; to: ZoneId; from: Vector3; start: number }
  | { kind: 'zone'; zone: ZoneId; start: number; step: number; once: Set<string> };

type Hud = {
  root: RefObject<HTMLDivElement | null>;
  speed: RefObject<HTMLElement | null>;
  say: RefObject<HTMLParagraphElement | null>;
};

type SceneProps = {
  c: Palette;
  go: { zone: ZoneId; n: number } | null;
  onArrive: (zone: ZoneId) => void;
  zone: ZoneId | null;
  setZone: (zone: ZoneId | null) => void;
  run: boolean;
  setRun: (run: boolean) => void;
  hud: Hud;
};

function Scene({ c, go, onArrive, zone, setZone, run, setRun, hud }: SceneProps) {
  const controls = useRef<CameraControls>(null);
  const zhao = useRef<Group>(null);
  const root = useRef<Group>(null);
  const padRef = useRef<Group>(null);
  const pose = useRef<Pose>('wave');
  const mode = useRef<Mode>({ kind: 'idle' });
  const target = useRef(new Vector3());
  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState<ZoneId | null>(null);
  const [outfit, setOutfit] = useState<Outfit>('none');
  const [under, setUnder] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [sent, setSent] = useState(false);
  const { camera, pointer } = useThree();
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -GROUND), []);
  const raycaster = useMemo(() => new Raycaster(), []);

  const puff = (at: Vector3, colours: string[], spread = 0.5, up = 0.3) =>
    setBursts((b) => [...b.slice(-5), { id: (b.at(-1)?.id ?? 0) + 1, at: [at.x, at.y, at.z], colours, spread, up }]);
  const confetti = [c.pink, c.mint, c.butter, c.lilac];

  const frame = (z: ZoneId | null, deep: boolean) => {
    const cc = controls.current;
    if (!cc) return;
    const back = Math.max(1, 1.05 / (innerWidth / innerHeight));
    if (!z) return cc.setLookAt(0, 8.5 * back, 13.5 * back, 0, 0.6, 0, !reduced);
    // windows open on the right on wide screens, so aim a little right to keep her on the left
    const shift = innerWidth > 900 ? 0.9 : 0;
    if (deep) return cc.setLookAt(reef.x + 1.3 + shift, -0.7, reef.z + 3.6 * back, reef.x + shift, -1.45, reef.z, !reduced);
    const [cx, cy, cz, tx, ty, tz] = shots[z];
    cc.setLookAt(cx + shift, cy * back, cz * back, tx + shift, ty, tz, !reduced);
  };

  const sendTo = (z: ZoneId) => {
    mode.current = { kind: 'hop', to: z, from: zhao.current!.position.clone(), start: performance.now() };
    pose.current = 'dangle';
    zhao.current!.rotation.x = 0;
    setOutfit('none');
    setUnder(false);
    setSent(false);
  };

  useEffect(() => {
    zhao.current!.position.copy(home);
    // pitch after yaw, so flips and carving leans happen around her own axes
    zhao.current!.rotation.order = 'YXZ';
    const t = setTimeout(() => (pose.current = 'idle'), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (run) return;
    // after a run the controls come back with the island camera a moment later, so wait for them
    const id = setTimeout(() => frame(zone, under), 80);
    return () => clearTimeout(id);
  }, [zone, under, run]);

  useEffect(() => {
    if (zone !== 'dance' || reduced) return;
    return music();
  }, [zone]);

  // soft shadows from everything solid; re-run when the cast changes
  useEffect(() => {
    root.current!.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const material = m.material as Material;
      const solid = !material.transparent && !(material instanceof ShaderMaterial) && material.type !== 'MeshBasicMaterial';
      m.castShadow = solid;
      m.receiveShadow = solid;
    });
  }, [outfit, zone, under, c]);

  // requests from the welcome window's buttons; checked per frame so the hop starts from wherever she is
  const handled = useRef(0);

  const groundPoint = () => {
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(plane, new Vector3());
  };

  const nearest = (p: Vector3) => {
    let best: Zone | null = null;
    let bestD = 1.3;
    for (const z of zones) {
      const d = Math.hypot(z.at.x - p.x, z.at.z - p.z);
      if (d < bestD) {
        best = z;
        bestD = d;
      }
    }
    return best;
  };

  const startDrag = (e: ThreeEvent<PointerEvent>) => {
    if (run) return;
    e.stopPropagation();
    if (controls.current) controls.current.enabled = false;
    mode.current = { kind: 'drag' };
    pose.current = 'dangle';
    zhao.current!.rotation.x = 0;
    setDragging(true);
    setZone(null);
    setOutfit('none');
    setUnder(false);
    setSent(false);
    document.body.style.cursor = 'grabbing';
    const onUp = () => {
      removeEventListener('pointerup', onUp);
      if (controls.current) controls.current.enabled = true;
      document.body.style.cursor = '';
      setDragging(false);
      setHot(null);
      const p = groundPoint();
      const z = p && nearest(p);
      if (z) sendTo(z.id);
      else {
        // dropped somewhere that isn't a spot: land there if it's on the island, otherwise back home
        const land = p && onIsland(p.x, p.z) ? p : home;
        mode.current = { kind: 'idle' };
        zhao.current!.position.set(land.x, GROUND, land.z);
        pose.current = 'idle';
      }
    };
    addEventListener('pointerup', onUp);
  };

  useFrame((_, dt) => {
    if (go && go.n !== handled.current && !run) {
      handled.current = go.n;
      sendTo(go.zone);
    }
    const z = zhao.current!;
    const m = mode.current;
    const now = performance.now();

    if (m.kind === 'drag') {
      const p = groundPoint();
      if (p) {
        target.current.set(p.x, GROUND + 1.1, p.z);
        z.position.lerp(target.current, Math.min(1, dt * 12));
        const near = nearest(p);
        if ((near?.id ?? null) !== hot) setHot(near?.id ?? null);
      }
      z.rotation.y += (0 - z.rotation.y) * Math.min(1, dt * 6);
      return;
    }

    if (m.kind === 'hop') {
      const zoneDef = zones.find((x) => x.id === m.to)!;
      const u = reduced ? 1 : Math.min(1, (now - m.start) / 750);
      z.position.lerpVectors(m.from, zoneDef.at, u);
      z.position.y += Math.sin(u * Math.PI) * 1.2;
      if (u >= 1) {
        mode.current = { kind: 'zone', zone: m.to, start: now, step: 0, once: new Set() };
        pose.current = zoneDef.pose;
        setOutfit(zoneDef.outfit);
        if (zoneDef.outfit !== 'none') {
          puff(zoneDef.at.clone().setY(zoneDef.at.y + 0.7), ['#ffffff', c.pink, c.lilac], 0.8, 0.2);
          sfx.pop();
        }
        setZone(m.to);
        onArrive(m.to);
      }
      return;
    }

    if (m.kind === 'zone') {
      const t = (now - m.start) / 1000;
      // fire something once per loop of an activity
      const once = (key: string, fn: () => void) => {
        if (!m.once.has(key)) {
          m.once.add(key);
          fn();
        }
      };

      if (m.zone === 'work') {
        z.position.set(-0.6, GROUND + 0.32, 1.95);
        z.rotation.set(0, 0, 0);
      } else if (m.zone === 'projects') {
        z.rotation.set(0, -0.25, 0);
      } else if (m.zone === 'dance') {
        z.rotation.set(0, 0, 0);
      } else if (m.zone === 'snowboard') {
        if (m.step === 0) {
          // strap in at the top, then the camera drops into her eyes
          const p = paths.snowboard(0);
          z.position.copy(p);
          if (t > 0.7 && t < 1.0) z.position.y += Math.sin(((t - 0.7) / 0.3) * Math.PI) * 0.15;
          z.rotation.set(0, heading(p, paths.snowboard(0.01)) - Math.PI / 2, 0);
          if (t > 1.5) {
            m.step = reduced ? 2 : 1;
            m.start = now;
            if (!reduced) setRun(true);
          }
        } else if (m.step === 1) {
          if (!run) {
            m.step = 2;
            m.start = now;
          }
        } else {
          // carve down, a spin off a bump halfway, a cheer at the bottom, then back up
          const cy = t % 14;
          if (cy < 11) {
            const u = reduced ? 0.3 : cy / 11;
            const p = paths.snowboard(u);
            const a = paths.snowboard(Math.min(1, u + 0.01));
            const b = paths.snowboard(Math.min(1, u + 0.02));
            const h1 = heading(p, a);
            const turn = Math.atan2(Math.sin(heading(a, b) - h1), Math.cos(heading(a, b) - h1));
            const air = u > 0.5 && u < 0.58 ? (u - 0.5) / 0.08 : -1;
            z.position.copy(p);
            if (air >= 0) z.position.y += Math.sin(air * Math.PI) * 0.5;
            z.rotation.set(Math.max(-0.45, Math.min(0.45, turn * 6)), h1 - Math.PI / 2 + (air >= 0 ? air * Math.PI * 2 : 0), 0);
            pose.current = 'board';
          } else if (cy < 12.6) {
            z.position.copy(paths.snowboard(1));
            z.rotation.set(0, 0.4, 0);
            pose.current = 'cheer';
            once(`cheer${Math.floor(t / 14)}`, () => puff(z.position.clone().setY(z.position.y + 1.2), confetti, 0.9, 0.4));
          } else {
            const u = smooth((cy - 12.6) / 1.4);
            z.position.lerpVectors(paths.snowboard(1), paths.snowboard(0), u);
            z.position.y += Math.sin(u * Math.PI) * 1.4;
            pose.current = 'dangle';
          }
        }
      } else if (m.zone === 'hike') {
        // up the trail, a selfie at the top, then back down
        const loop = Math.floor(t / 22);
        const cycle = (t % 22) / 22;
        const u = cycle < 0.45 ? cycle / 0.45 : cycle < 0.55 ? 1 : 1 - (cycle - 0.55) / 0.45;
        const top = cycle >= 0.45 && cycle < 0.55;
        pose.current = top ? 'selfie' : 'walk';
        const p = paths.hike(u);
        const dir = cycle < 0.5 ? 1 : -1;
        const ahead = paths.hike(Math.min(1, Math.max(0, u + 0.01 * dir)));
        z.position.copy(p);
        if (!top) z.rotation.y = heading(p, ahead);
        else {
          z.rotation.y += (0.5 - z.rotation.y) * 0.1;
          if (cycle > 0.5)
            once(`snap${loop}`, () => {
              puff(z.position.clone().add(new Vector3(0.35, 1.25, 0.35)), ['#ffffff'], 0.25, 0);
              sfx.shutter();
            });
        }
      } else if (m.zone === 'boulder') {
        const loop = Math.floor(t / 11);
        const cy = t % 11;
        let squash = 1;
        if (cy < 0.9) {
          // chalk up on the pad
          z.position.copy(pad);
          z.rotation.set(0, 0, 0);
          pose.current = 'chalk';
          if (cy > 0.35) once(`chalk${loop}`, () => puff(pad.clone().setY(pad.y + 0.75).setZ(pad.z + 0.25), ['#ffffff'], 0.35, 0.3));
        } else if (cy < 1.3) {
          const u = smooth((cy - 0.9) / 0.4);
          z.position.set(boulder.x, pad.y * (1 - u) + GROUND * u, pad.z + (face(0.3) + 0.25 - pad.z) * u);
          z.rotation.set(0, Math.PI * u, 0);
          pose.current = 'walk';
        } else if (cy < 6.3) {
          // five moves up the wall, with a beat on each hold
          const q = ((cy - 1.3) / 5) * 5;
          const n = Math.floor(q);
          const h = ((n + smooth((q - n) / 0.6)) / 5) * 1.3;
          z.position.set(boulder.x + Math.sin(n * 2.1) * 0.08, GROUND + h - 0.05, face(h + 0.3) + 0.25);
          z.rotation.set(0, Math.PI, 0);
          pose.current = 'climb';
        } else if (cy < 6.9) {
          const u = smooth((cy - 6.3) / 0.6);
          const from = face(1.6) + 0.25;
          z.position.set(boulder.x, GROUND + 1.25 + (2.02 - 1.25) * u + Math.sin(u * Math.PI) * 0.35, from + (boulder.z - from) * u);
          z.rotation.set(0, Math.PI * (1 - u), 0);
          pose.current = 'climb';
        } else if (cy < 8.9) {
          z.position.set(boulder.x, GROUND + 2.02, boulder.z);
          z.rotation.set(0, 0, 0);
          pose.current = 'cheer';
          once(`top${loop}`, () => {
            puff(z.position.clone().setY(GROUND + 3.0), confetti, 1.0, 0.5);
            sfx.chime();
            setSent(true);
          });
        } else if (cy < 9.7) {
          once(`down${loop}`, () => setSent(false));
          const u = (cy - 8.9) / 0.8;
          z.position.set(boulder.x, GROUND + 2.02 + (pad.y - GROUND - 2.02) * u + Math.sin(u * Math.PI) * 0.5, boulder.z + (pad.z - boulder.z) * u);
          pose.current = 'tuck';
        } else {
          z.position.copy(pad);
          pose.current = 'wave';
          once(`land${loop}`, () => {
            sfx.thump();
            puff(pad.clone().setY(pad.y + 0.1), ['#ffffff', c.lilac], 0.6, 0.1);
          });
          squash = 1 - 0.45 * Math.exp(-(cy - 9.7) * 6) * Math.cos((cy - 9.7) * 22);
        }
        padRef.current!.scale.y = squash;
      } else if (m.zone === 'dive') {
        const out = Math.atan2(pierDir.x, pierDir.y);
        if (t < 0.9) {
          z.position.copy(pierEnd).setY(0.33);
          z.rotation.set(0, out, 0);
          pose.current = 'idle';
        } else if (t < 1.7) {
          // a front flip off the end of the pier
          const u = (t - 0.9) / 0.8;
          z.position.lerpVectors(pierEnd, splash, u);
          z.position.y = 0.33 * (1 - u) + splash.y * u + Math.sin(u * Math.PI) * 1.1;
          z.rotation.set(u * Math.PI * 2, out, 0);
          pose.current = 'tuck';
        } else {
          once('splash', () => {
            puff(splash.clone().setY(0.05), ['#ffffff', c.sea[0]], 1.0, 0.9);
            sfx.splash();
            setUnder(true);
          });
          const s = t - 1.7;
          const a = reduced ? 0 : s * 0.3;
          const p = paths.swim(a);
          const ahead = paths.swim(a + 0.02);
          if (s < 1.4) z.position.lerpVectors(splash, p, smooth(s / 1.4));
          else z.position.copy(p);
          z.rotation.set(0, heading(p, ahead), 0);
          pose.current = 'swim';
        }
      }
      return;
    }

    // idle: turn to face the camera
    z.rotation.y += (0 - z.rotation.y) * Math.min(1, dt * 4);
  });

  return (
    <>
      <Sky colours={under ? c.deep : c.sky} />
      <ambientLight intensity={c.night ? 0.35 : 0.65} />
      <hemisphereLight args={[c.night ? '#7d6bd6' : '#ffffff', c.grass, c.night ? 0.5 : 0.85]} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={c.night ? 0.5 : 1.5}
        color={c.night ? '#b8b0ff' : '#fff4e8'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 3]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#ffc4e4" position={[-6, 2, 2]} scale={[4, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#c4f5ff" position={[6, 2, 2]} scale={[4, 4, 1]} rotation-y={-Math.PI / 2} />
      </Environment>
      {c.night && !under && <Stars radius={60} depth={20} count={1800} factor={3} fade speed={0.5} />}
      {!run && (
        <CameraControls
          ref={controls}
          minDistance={3}
          maxDistance={22}
          minPolarAngle={0.3}
          maxPolarAngle={1.45}
          minAzimuthAngle={-1.1}
          maxAzimuthAngle={1.1}
        />
      )}
      {run && <Run night={c.night} hud={hud} onDone={() => setRun(false)} />}
      {under && <Reef at={reef} sand={c.seabed} haze={c.haze} night={c.night} diver={zhao} />}

      <Water shallow={c.sea[0]} deep={c.sea[1]} foam={c.sea[2]} glow={c.glow} shore={6.6} />
      <group ref={root}>
        <Terrain c={c} />
        <Mountain c={c} />
        <Hill c={c} />
        <Boulder c={c} padRef={padRef} />
        <Hut c={c} />
        <Corkboard c={c} />
        <DanceFloor c={c} active={zone === 'dance'} />
        <Pier c={c} />
        <Dressing ground={GROUND} avoid={avoid} night={c.night} rock={c.rock} />
        {(
          [
            [-4.3, -0.4],
            [-3.6, 1.6],
            [1.4, -3.9],
            [4.6, -1.0],
          ] as [number, number][]
        ).map((at) => (
          <Sakura key={at.join()} at={at} c={c} />
        ))}
        {(
          [
            [5.9, 2.4],
            [-5.6, -2.3],
            [5.2, 3.6],
          ] as [number, number][]
        ).map((at) => (
          <Palm key={at.join()} at={at} c={c} />
        ))}

        <group
          ref={zhao}
          onPointerDown={startDrag}
          onPointerOver={() => (document.body.style.cursor = 'grab')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <group scale={1.15}>
            <Zhao pose={pose} outfit={outfit} />
          </group>
          {zone === 'snowboard' && <Sparkles position={[0, 0.1, 0]} count={24} scale={[1, 0.4, 1]} size={3} speed={2} color="#ffffff" />}
          <Html center position={[0, 1.9, 0]} className="desk-label" zIndexRange={[5, 0]} style={{ opacity: dragging || zone ? 0 : 1 }}>
            drag me
          </Html>
          <Html center position={[0, 1.7, 0]} zIndexRange={[5, 0]} style={{ display: zone === 'dance' ? 'block' : 'none' }}>
            <span className="reactions" aria-hidden="true">
              {reactions.map((r, i) => (
                <span key={r} style={{ '--i': i } as CSSProperties}>
                  {r}
                </span>
              ))}
            </span>
          </Html>
        </group>
      </group>
      <Clouds />
      {c.night && <Lanterns />}
      <Sparkles count={60} scale={[16, 5, 16]} position={[0, 3, 0]} size={2.2} speed={0.25} color={c.night ? '#fff6c8' : '#ffffff'} opacity={0.7} />
      {bursts.map((b) => (
        <Poof key={b.id} b={b} />
      ))}

      <Html center position={[-0.6, GROUND + 1.55, 2.3]} zIndexRange={[5, 0]} style={{ display: zone === 'work' ? 'block' : 'none' }}>
        <span className="chips" aria-hidden="true">
          {chips.map((chip, i) => (
            <span key={chip} style={{ '--i': i } as CSSProperties}>
              {chip}
            </span>
          ))}
        </span>
      </Html>
      <Html center position={[0.9, GROUND + 1.85, 3.55]} zIndexRange={[5, 0]} style={{ display: zone === 'dance' ? 'block' : 'none' }}>
        <Caption />
      </Html>
      <Html center position={[boulder.x, GROUND + 3.0, boulder.z]} zIndexRange={[5, 0]} style={{ display: sent ? 'block' : 'none' }}>
        <span className="pop-chip">sent it ✨</span>
      </Html>

      {zones.map((z) => (
        <DropRing key={z.id} zone={z} hot={hot === z.id} show={dragging || hot === z.id} onPick={() => sendTo(z.id)} />
      ))}
    </>
  );
}

// machines without a usable GPU fall back to software WebGL, where post-processing is far too slow
function softwareRenderer() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  return /swiftshader|llvmpipe|software/i.test(name);
}

function SoundToggle() {
  const [off, setOff] = useState(isMuted);
  return (
    <button
      type="button"
      className="button"
      aria-pressed={!off}
      onClick={() => {
        setMuted(!off);
        setOff(!off);
      }}
    >
      {off ? '♪ sound off' : '♪ sound on'}
    </button>
  );
}

const aberration = new Vector2(0.0025, 0.002);
const still = new Vector2(0, 0);

type Props = { theme: string; go: { zone: ZoneId; n: number } | null; onArrive: (zone: ZoneId) => void };

export default function IslandScene({ theme, go, onArrive }: Props) {
  const c = palettes[theme === 'dark' ? 'dark' : 'light'];
  const [fx, setFx] = useState(() => !softwareRenderer());
  const [mounted] = useState(() => performance.now());
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [run, setRunState] = useState(false);
  const [flash, setFlash] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLElement>(null);
  const say = useRef<HTMLParagraphElement>(null);
  const skip = useRef<HTMLButtonElement>(null);

  const setRun = useCallback((on: boolean) => {
    setRunState(on);
    setFlash((n) => n + 1);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('riding', run);
    if (!run) return;
    skip.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRun(false);
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      document.body.classList.remove('riding');
    };
  }, [run, setRun]);

  return (
    <>
      <div className="desk-canvas" aria-hidden="true">
        <Canvas shadows="percentage" camera={{ position: [0, 8.5, 13.5], fov: 38 }} dpr={[1, 1.75]}>
          <PerformanceMonitor onDecline={() => performance.now() - mounted > 5000 && setFx(false)} />
          <Scene c={c} go={go} onArrive={onArrive} zone={zone} setZone={setZone} run={run} setRun={setRun} hud={{ root, speed, say }} />
          {fx && (
            <EffectComposer multisampling={4}>
              <N8AO halfRes aoRadius={0.5} intensity={1.2} distanceFalloff={0.5} />
              <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.9} />
              <ChromaticAberration offset={run ? aberration : still} radialModulation modulationOffset={0.2} />
              <Vignette offset={0.25} darkness={run ? 0.75 : 0.35} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
        </Canvas>
      </div>
      {flash > 0 && <div key={flash} className="run-flash" aria-hidden="true" />}
      {run && (
        <div ref={root} className="run-hud" role="region" aria-label="Snowboard run, first person">
          <p ref={say} className="run-say">
            drop in
          </p>
          <p className="run-speed">
            <b ref={speed}>0</b> km/h
          </p>
          <p className="run-buttons">
            <SoundToggle />
            <button ref={skip} type="button" className="button" onClick={() => setRun(false)}>
              skip
            </button>
          </p>
        </div>
      )}
      {!run && (zone === 'dance' || zone === 'dive') && (
        <p className="sound-corner">
          <SoundToggle />
        </p>
      )}
    </>
  );
}
