import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  LatheGeometry,
  Plane,
  Raycaster,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Group,
} from 'three';
import Zhao, { type Pose } from './Zhao';
import Water from './Water';

export type ZoneId = 'work' | 'projects' | 'snowboard' | 'dive' | 'boulder' | 'hike' | 'dance';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GROUND = 0.35;

const palettes = {
  light: {
    sky: ['#ffd6ec', '#e9e2ff', '#c9f1ff'],
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

// paths for the activities that move, as functions of progress u in [0, 1]
const mountain = new Vector3(-2.8, GROUND, -2.6);
const hill = new Vector3(2.9, GROUND, -2.3);
const pierDir = new Vector2(-0.55, 0.83).normalize();
const pierEnd = new Vector3(pierDir.x * 8.4, 0.3, pierDir.y * 8.4);

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
  dive: (u: number) => {
    const a = u * Math.PI * 2;
    return new Vector3(pierEnd.x + pierDir.x * 2 + Math.sin(a) * 0.8, -0.22, pierEnd.z + pierDir.y * 2 + Math.cos(a) * 0.8);
  },
};

type Zone = { id: ZoneId; label: string; at: Vector3; pose: Pose };

const zones: Zone[] = [
  { id: 'work', label: 'work · laptop', at: new Vector3(-0.6, GROUND, 1.5), pose: 'type' },
  { id: 'projects', label: 'side projects', at: new Vector3(0.85, GROUND, 1.75), pose: 'wave' },
  { id: 'snowboard', label: 'snowboarding', at: paths.snowboard(0), pose: 'board' },
  { id: 'hike', label: 'hiking', at: paths.hike(0), pose: 'walk' },
  { id: 'boulder', label: 'bouldering', at: new Vector3(3.9, GROUND, 1.55), pose: 'climb' },
  { id: 'dance', label: 'dance', at: new Vector3(2.1, GROUND + 0.12, 2.8), pose: 'dance' },
  { id: 'dive', label: 'diving', at: pierEnd, pose: 'swim' },
];

const home = new Vector3(0.6, GROUND, 0.3);

// camera position and target per spot, framing the whole route for the activities that move
const shots: Record<ZoneId, [number, number, number, number, number, number]> = {
  work: [0.4, 2.8, 6.2, -0.6, 0.9, 1.6],
  projects: [1.6, 2.6, 5.6, 0.85, 1.1, 1.4],
  snowboard: [1.2, 4.8, 7.0, -2.4, 1.7, -1.5],
  hike: [1.4, 4.4, 4.6, 2.9, 1.1, -2.1],
  boulder: [5.4, 2.8, 6.2, 3.9, 1.1, 1.3],
  dance: [3.0, 3.4, 8.0, 2.1, 0.8, 2.8],
  dive: [-3.2, 3.2, 12.0, pierEnd.x + pierDir.x, 0, pierEnd.z + pierDir.y],
};

function Toy({ color, rough = 0.35 }: { color: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.8} clearcoatRoughness={0.25} />;
}

function Sky({ c }: { c: Palette }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    c.sky.forEach((colour, i) => g.addColorStop(i / (c.sky.length - 1), colour));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [c]);
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
    </group>
  );
}

function Boulder({ c }: { c: Palette }) {
  const holds: [number, number, string][] = [
    [-0.25, 0.25, c.pink],
    [0.2, 0.55, c.mint],
    [-0.15, 0.85, c.butter],
    [0.25, 1.1, c.lilac],
    [-0.05, 1.35, c.pink],
  ];
  return (
    <group position={[3.9, GROUND, 0.7]}>
      <mesh position={[0, 0.7, 0]} scale={[1, 1.55, 0.95]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color={c.rock} flatShading roughness={0.8} />
        <Outlines thickness={0.015} color={c.ink} />
      </mesh>
      {holds.map(([x, y, colour]) => (
        <mesh key={y} position={[x, y, 0.82 - Math.abs(y - 0.7) * 0.25]} scale={[1.3, 0.8, 0.6]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <Toy color={colour} />
        </mesh>
      ))}
    </group>
  );
}

function Hut({ c }: { c: Palette }) {
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
      {/* stool, table and laptop out front */}
      <mesh position={[0, 0.16, 0.75]}>
        <cylinderGeometry args={[0.16, 0.16, 0.32, 16]} />
        <Toy color={c.lilac} />
      </mesh>
      <RoundedBox args={[0.8, 0.05, 0.45]} radius={0.02} position={[0, 0.5, 1.25]}>
        <Toy color="#ffffff" />
        <Outlines thickness={0.008} color={c.ink} />
      </RoundedBox>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.24, 1.25]}>
          <cylinderGeometry args={[0.025, 0.025, 0.48, 8]} />
          <meshStandardMaterial color={c.ink} />
        </mesh>
      ))}
      <RoundedBox args={[0.42, 0.02, 0.28]} radius={0.008} position={[0, 0.535, 1.22]}>
        <Toy color={c.lilac} />
      </RoundedBox>
      <group position={[0, 0.545, 1.35]} rotation={[0.35, 0, 0]}>
        <RoundedBox args={[0.42, 0.28, 0.02]} radius={0.008} position={[0, 0.14, 0]}>
          <Toy color={c.lilac} />
        </RoundedBox>
        <mesh position={[0, 0.15, 0.012]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={c.pink} />
        </mesh>
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

function DanceFloor({ c, active }: { c: Palette; active: boolean }) {
  const tiles = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (x * x + z * z <= 5) out.push([x * 0.32, z * 0.32]);
    return out;
  }, []);
  const group = useRef<Group>(null);
  const colours = [c.pink, c.mint, c.butter, c.lilac];
  useFrame((state) => {
    // tiles step through the palette in a chase while someone is dancing
    const step = Math.floor(state.clock.elapsedTime * (active ? 6 : 1.5));
    group.current!.children.forEach((tile, i) => {
      const lit = (i + step) % 4;
      const material = (tile as unknown as { material: { color: Color; emissiveIntensity: number } }).material;
      material.color.set(colours[lit]);
      material.emissiveIntensity = active && lit === 0 ? 0.9 : 0.15;
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
      <mesh position={[0.95, 1.85, -0.6]}>
        <icosahedronGeometry args={[0.18, 2]} />
        <meshStandardMaterial color="#efeaff" emissive="#b9a8ff" emissiveIntensity={0.45} metalness={0.8} roughness={0.18} flatShading />
      </mesh>
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

type Mode =
  | { kind: 'idle' }
  | { kind: 'drag' }
  | { kind: 'hop'; to: ZoneId; from: Vector3; start: number }
  | { kind: 'zone'; zone: ZoneId; start: number };

type SceneProps = { c: Palette; go: { zone: ZoneId; n: number } | null; onArrive: (zone: ZoneId) => void };

function Scene({ c, go, onArrive }: SceneProps) {
  const controls = useRef<CameraControls>(null);
  const zhao = useRef<Group>(null);
  const pose = useRef<Pose>('wave');
  const mode = useRef<Mode>({ kind: 'idle' });
  const target = useRef(new Vector3());
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState<ZoneId | null>(null);
  const [props, setProps] = useState({ board: false, snorkel: false, backpack: false });
  const { camera, pointer } = useThree();
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -GROUND), []);
  const raycaster = useMemo(() => new Raycaster(), []);

  const frame = (z: ZoneId | null) => {
    const back = Math.max(1, 1.05 / (innerWidth / innerHeight));
    if (!z) return controls.current?.setLookAt(0, 8.5 * back, 13.5 * back, 0, 0.6, 0, !reduced);
    // windows open on the right on wide screens, so aim a little right to keep her on the left
    const shift = innerWidth > 900 ? 0.9 : 0;
    const [cx, cy, cz, tx, ty, tz] = shots[z];
    controls.current?.setLookAt(cx + shift, cy * back, cz * back, tx + shift, ty, tz, !reduced);
  };

  const sendTo = (z: ZoneId) => {
    mode.current = { kind: 'hop', to: z, from: zhao.current!.position.clone(), start: performance.now() };
    pose.current = 'dangle';
    setProps({ board: false, snorkel: false, backpack: false });
  };

  useEffect(() => {
    zhao.current!.position.copy(home);
    const t = setTimeout(() => (pose.current = 'idle'), 2600);
    return () => clearTimeout(t);
  }, []);

  // requests from the welcome window's buttons; checked per frame so the hop starts from wherever she is
  const handled = useRef(0);

  useEffect(() => {
    frame(zone);
  }, [zone]);

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
    e.stopPropagation();
    controls.current!.enabled = false;
    mode.current = { kind: 'drag' };
    pose.current = 'dangle';
    setDragging(true);
    setZone(null);
    setProps({ board: false, snorkel: false, backpack: false });
    document.body.style.cursor = 'grabbing';
    const onUp = () => {
      removeEventListener('pointerup', onUp);
      controls.current!.enabled = true;
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
    if (go && go.n !== handled.current) {
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
        mode.current = { kind: 'zone', zone: m.to, start: now };
        pose.current = zoneDef.pose;
        setProps({ board: m.to === 'snowboard', snorkel: m.to === 'dive', backpack: m.to === 'hike' });
        setZone(m.to);
        onArrive(m.to);
      }
      return;
    }

    if (m.kind === 'zone') {
      const t = (now - m.start) / 1000;
      if (m.zone === 'work') {
        z.position.set(-0.6, GROUND + 0.32, 1.45);
        z.rotation.y = 0;
      } else if (m.zone === 'projects') {
        z.rotation.y = -0.25;
      } else if (m.zone === 'snowboard') {
        const u = reduced ? 0.5 : (t * 0.09) % 1;
        const p = paths.snowboard(u);
        const ahead = paths.snowboard(Math.min(1, u + 0.01));
        z.position.copy(p);
        z.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z) + Math.PI / 2;
      } else if (m.zone === 'hike') {
        // up the trail, a wave at the top, then back down
        const cycle = (t % 22) / 22;
        const u = cycle < 0.45 ? cycle / 0.45 : cycle < 0.55 ? 1 : 1 - (cycle - 0.55) / 0.45;
        pose.current = cycle >= 0.45 && cycle < 0.55 ? 'wave' : 'walk';
        const p = paths.hike(u);
        const dir = cycle < 0.5 ? 1 : -1;
        const ahead = paths.hike(Math.min(1, Math.max(0, u + 0.01 * dir)));
        z.position.copy(p);
        if (pose.current === 'walk') z.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z);
        else z.rotation.y += (0.3 - z.rotation.y) * 0.1;
      } else if (m.zone === 'boulder') {
        z.position.set(3.9, GROUND - 0.2 + (reduced ? 0.3 : (Math.sin(t * 0.6) * 0.5 + 0.5) * 0.65), 1.62);
        z.rotation.y = Math.PI;
      } else if (m.zone === 'dive') {
        const u = reduced ? 0 : (t * 0.08) % 1;
        const p = paths.dive(u);
        const ahead = paths.dive(u + 0.01);
        z.position.copy(p);
        z.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z);
      }
      return;
    }

    // idle: turn to face the camera
    z.rotation.y += (0 - z.rotation.y) * Math.min(1, dt * 4);
  });

  return (
    <>
      <Sky c={c} />
      <ambientLight intensity={c.night ? 0.35 : 0.7} />
      <hemisphereLight args={[c.night ? '#7d6bd6' : '#ffffff', c.grass, c.night ? 0.5 : 0.9]} />
      <directionalLight position={[6, 9, 5]} intensity={c.night ? 0.5 : 1.4} color={c.night ? '#b8b0ff' : '#fff4e8'} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 3]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#ffc4e4" position={[-6, 2, 2]} scale={[4, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#c4f5ff" position={[6, 2, 2]} scale={[4, 4, 1]} rotation-y={-Math.PI / 2} />
      </Environment>
      {c.night && <Stars radius={60} depth={20} count={1800} factor={3} fade speed={0.5} />}
      <CameraControls
        ref={controls}
        minDistance={3}
        maxDistance={22}
        minPolarAngle={0.3}
        maxPolarAngle={1.35}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
      />

      <Water shallow={c.sea[0]} deep={c.sea[1]} foam={c.sea[2]} glow={c.glow} shore={6.6} />
      <Terrain c={c} />
      <Mountain c={c} />
      <Hill c={c} />
      <Boulder c={c} />
      <Hut c={c} />
      <Corkboard c={c} />
      <DanceFloor c={c} active={zone === 'dance'} />
      <Pier c={c} />
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
      <Clouds />
      {c.night && <Lanterns />}
      <Sparkles
        count={60}
        scale={[16, 5, 16]}
        position={[0, 3, 0]}
        size={2.2}
        speed={0.25}
        color={c.night ? '#fff6c8' : '#ffffff'}
        opacity={0.7}
      />

      {zones.map((z) => (
        <DropRing key={z.id} zone={z} hot={hot === z.id} show={dragging || hot === z.id} onPick={() => sendTo(z.id)} />
      ))}

      <group
        ref={zhao}
        onPointerDown={startDrag}
        onPointerOver={() => (document.body.style.cursor = 'grab')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <group scale={1.15}>
          <Zhao pose={pose} board={props.board} snorkel={props.snorkel} backpack={props.backpack} />
        </group>
        {zone === 'dive' && <Sparkles position={[0, 0.5, 0]} count={14} scale={[0.6, 1.2, 0.6]} size={4} speed={1.2} color="#ffffff" />}
        {zone === 'snowboard' && <Sparkles position={[0, 0.1, 0]} count={20} scale={[0.8, 0.3, 0.8]} size={3} speed={2} color="#ffffff" />}
        {zone === 'boulder' && <Sparkles position={[0, 0.9, 0.2]} count={8} scale={[0.4, 0.3, 0.3]} size={3} speed={0.8} color="#ffffff" />}
        <Html center position={[0, 1.9, 0]} className="desk-label" zIndexRange={[5, 0]} style={{ opacity: dragging || zone ? 0 : 1 }}>
          drag me
        </Html>
      </group>
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

type Props = { theme: string; go: { zone: ZoneId; n: number } | null; onArrive: (zone: ZoneId) => void };

export default function IslandScene({ theme, go, onArrive }: Props) {
  const c = palettes[theme === 'dark' ? 'dark' : 'light'];
  const [fx, setFx] = useState(() => !softwareRenderer());
  const [mounted] = useState(() => performance.now());
  return (
    <div className="desk-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 8.5, 13.5], fov: 38 }} dpr={[1, 1.75]}>
        <PerformanceMonitor onDecline={() => performance.now() - mounted > 5000 && setFx(false)} />
        <Scene c={c} go={go} onArrive={onArrive} />
        {fx && (
          <EffectComposer multisampling={4}>
            <N8AO halfRes aoRadius={0.5} intensity={1.2} distanceFalloff={0.5} />
            <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.9} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
