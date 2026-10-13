import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Environment,
  Html,
  Instance,
  Instances,
  Lightformer,
  Line,
  Outlines,
  PerformanceMonitor,
  RoundedBox,
  Sparkles,
  useTexture,
} from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { CanvasTexture, CatmullRomCurve3, Shape, SRGBColorSpace, Vector2, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { siteProjects } from '../content/site';
import type { ObjectId, WinId } from './windows';
import photo from '../assets/images/zhao.webp';

const palettes = {
  light: {
    sky: ['#ffd9ee', '#ece4ff', '#d8f4ec'],
    desk: '#f7f3ff',
    wall: '#e4dbff',
    ink: '#1b1743',
    pink: '#fc9ac9',
    mint: '#a5f0db',
    butter: '#fbe48d',
    lilac: '#cbbcfc',
    leaf: '#7fd6a8',
  },
  dark: {
    sky: ['#3a1d4f', '#161230', '#0e2230'],
    desk: '#2b2652',
    wall: '#231e45',
    ink: '#0b0920',
    pink: '#fc9ac9',
    mint: '#a5f0db',
    butter: '#fbe48d',
    lilac: '#cbbcfc',
    leaf: '#5fc394',
  },
};
type Palette = (typeof palettes)['light'];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// where each clickable object sits; the camera frames it a little to the left so open windows don't cover it
const spots: Record<ObjectId, [number, number, number]> = {
  globe: [-1.75, 0.3, 0.6],
  laptop: [-0.3, 0.75, -0.45],
  keyboard: [-0.3, 0.05, 0.45],
  server: [1.55, 0.5, -0.75],
  polaroid: [-1.3, 1.5, -1.25],
  notes: [1.6, 0.05, 0.45],
  books: [-1.05, 0.2, 0.75],
};

function pose(focus: ObjectId | null): [number, number, number, number, number, number] {
  // portrait screens see less of the desk's width, so pull the camera back
  const back = Math.max(1, 1.05 / (innerWidth / innerHeight));
  if (!focus) return [0.9 * back, 3.1 * back, 6.4 * back, 0.2, 0.75, -0.2];
  const [x, y, z] = spots[focus];
  const shift = innerWidth > 900 ? 0.7 : 0;
  return [x + shift - 0.4, y + 1.5 * back, z + 2.9 * back, x + shift, y, z];
}

// the classic parametric heart, used for the neon sign, the snow globe and the plant's leaves
const heart = (scale: number) =>
  Array.from({ length: 64 }, (_, i) => {
    const t = (i / 64) * Math.PI * 2;
    return new Vector2(16 * Math.sin(t) ** 3 * scale, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale);
  });

function Toy({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} clearcoatRoughness={0.18} />;
}

type BoxProps = { args: [number, number, number]; color: string; ink: string; radius?: number } & Record<string, unknown>;

function Box({ args, color, ink, radius = 0.04, ...rest }: BoxProps) {
  const thinnest = Math.min(...args);
  // RoundedBox smooths normals across the whole shape, which turns very thin boxes black, so those stay square
  if (thinnest < 0.03)
    return (
      <mesh {...rest}>
        <boxGeometry args={args} />
        <Toy color={color} />
        <Outlines thickness={0.006} color={ink} />
      </mesh>
    );
  return (
    <RoundedBox args={args} radius={Math.min(radius, thinnest * 0.3)} smoothness={4} {...rest}>
      <Toy color={color} />
      <Outlines thickness={0.01} color={ink} />
    </RoundedBox>
  );
}

type PickProps = {
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  labelHeight: number;
  focused?: boolean;
  onPick?: () => void;
  onHover?: (hover: boolean) => void;
  children: ReactNode;
};

function Pickable({ label, position, rotation, labelHeight, focused = false, onPick, onHover, children }: PickProps) {
  const group = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const squish = useRef(0);

  useFrame((_, dt) => {
    const g = group.current!;
    const lift = hover || focused ? 0.06 : 0;
    g.position.y += (position[1] + lift - g.position.y) * Math.min(1, dt * 10);
    // a quick squash-and-stretch after a click, settling back to 1
    squish.current = Math.max(0, squish.current - dt * 3);
    const s = squish.current * Math.sin(squish.current * 18) * 0.12;
    g.scale.set(1 + s, 1 - s, 1 + s);
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        onHover?.(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        onHover?.(false);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!reduced) squish.current = 1;
        onPick?.();
      }}
    >
      {children}
      {/* kept mounted and faded, since unmounting Html mid-render upsets React 19 */}
      <Html center position={[0, labelHeight, 0]} className="desk-label" zIndexRange={[5, 0]} style={{ opacity: hover || focused ? 1 : 0 }}>
        {label}
      </Html>
    </group>
  );
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

function Pegboard({ c }: { c: Palette }) {
  const holes = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -2.1; x <= 2.11; x += 0.3) for (let y = 0.3; y <= 2.0; y += 0.3) out.push([x, y]);
    return out;
  }, []);
  return (
    <group position={[0, 0, -1.4]}>
      <Box args={[4.7, 2.4, 0.08]} color={c.wall} ink={c.ink} position={[0, 1.15, 0]} radius={0.04} />
      <Instances limit={holes.length}>
        <cylinderGeometry args={[0.022, 0.022, 0.02, 10]} />
        <meshStandardMaterial color={c.ink} transparent opacity={0.35} />
        {holes.map(([x, y]) => (
          <Instance key={`${x}:${y}`} position={[x, y, 0.042]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
      </Instances>
    </group>
  );
}

function NeonHeart() {
  const curve = useMemo(() => new CatmullRomCurve3(heart(0.022).map((p) => new Vector3(p.x, p.y, 0)), true), []);
  const tube = useRef<Mesh>(null);
  useFrame((state) => {
    if (reduced) return;
    // the odd neon flicker
    const t = state.clock.elapsedTime;
    tube.current!.visible = !(Math.sin(t * 7) > 0.99 && Math.sin(t * 1.3) > 0.5);
  });
  return (
    <mesh ref={tube} position={[0.65, 1.55, -1.32]}>
      <tubeGeometry args={[curve, 160, 0.018, 10, true]} />
      <meshBasicMaterial color={[2.6, 0.55, 1.7]} toneMapped={false} />
    </mesh>
  );
}

function FairyLights({ c }: { c: Palette }) {
  const points = useMemo(
    () => Array.from({ length: 41 }, (_, i) => new Vector3(-2.15 + (i / 40) * 4.3, 2.2 - Math.sin((i / 40) * Math.PI) * 0.28, -1.3)),
    [],
  );
  // values above 1 bloom; clamped without bloom they still read pink, butter and mint
  const colours: [number, number, number][] = [
    [2.6, 0.8, 1.8],
    [2.4, 2.0, 0.6],
    [0.6, 2.4, 1.9],
  ];
  return (
    <>
      <Line points={points} color={c.ink} lineWidth={1.2} />
      {points
        .filter((_, i) => i % 3 === 1)
        .map((p, i) => (
          <mesh key={i} position={[p.x, p.y - 0.035, p.z + 0.02]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshBasicMaterial color={colours[i % 3]} toneMapped={false} />
          </mesh>
        ))}
    </>
  );
}

function Polaroid({ c }: { c: Palette }) {
  const texture = useTexture(photo);
  return (
    <>
      <Box args={[0.1, 0.06, 0.03]} color={c.pink} ink={c.ink} radius={0.01} position={[0, 0.42, 0.02]} />
      <Box args={[0.62, 0.78, 0.02]} color="#ffffff" ink={c.ink} radius={0.008} />
      <mesh position={[0, 0.07, 0.012]}>
        <planeGeometry args={[0.52, 0.56]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </>
  );
}

function DiscoBall({ spin }: { spin: boolean }) {
  const ball = useRef<Mesh>(null);
  useFrame((_, dt) => {
    ball.current!.rotation.y += dt * (reduced ? 0.1 : spin ? 4 : 0.35);
  });
  return (
    <>
      <Line
        points={[
          [0, 0.3, 0],
          [0, 2, 0],
        ]}
        color="#8a86a8"
        lineWidth={1}
      />
      <mesh ref={ball}>
        <icosahedronGeometry args={[0.3, 2]} />
        <meshStandardMaterial color="#efeaff" emissive="#b9a8ff" emissiveIntensity={0.45} metalness={0.8} roughness={0.18} envMapIntensity={2.5} flatShading />
      </mesh>
      <Sparkles count={spin ? 40 : 12} scale={1.4} size={spin ? 5 : 3} speed={spin ? 2 : 0.4} color="#ffffff" />
    </>
  );
}

function Holds({ c }: { c: Palette }) {
  const holds: [number, number, string, number][] = [
    [1.45, 0.75, c.pink, 0.2],
    [1.85, 1.05, c.mint, 1.4],
    [1.5, 1.35, c.butter, 2.2],
    [1.95, 1.6, c.lilac, 0.8],
    [1.6, 1.9, c.pink, 3],
  ];
  return (
    <>
      {holds.map(([x, y, colour, r]) => (
        <mesh key={`${x}:${y}`} position={[x, y, -1.33]} rotation={[r, r * 2, r]} scale={[1.3, 0.85, 0.55]}>
          <icosahedronGeometry args={[0.075, 1]} />
          <Toy color={colour} />
          <Outlines thickness={0.008} color={c.ink} />
        </mesh>
      ))}
    </>
  );
}

function Keyboard({ c, active }: { c: Palette; active: boolean }) {
  const keys = useRef<Group>(null);
  const tones = [c.pink, c.lilac, c.mint, c.butter, '#ffffff'];
  const grid = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 13; col++) out.push([-0.45 + col * 0.075, row, -0.11 + row * 0.075]);
    return out;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    keys.current!.children.forEach((key, i) => {
      // a wave runs across the keys while the pointer is over the keyboard
      const press = active && !reduced ? Math.max(0, Math.sin(t * 8 - grid[i][0] * 10)) * 0.018 : 0;
      key.position.y += (0.045 - press - key.position.y) * 0.3;
    });
  });
  return (
    <>
      <Box args={[1.05, 0.05, 0.36]} color={c.lilac} ink={c.ink} radius={0.02} position={[0, 0.025, 0]} />
      <group ref={keys}>
        {grid.map(([x, row, z], i) => (
          <RoundedBox key={i} args={[0.062, 0.035, 0.062]} radius={0.012} smoothness={2} position={[x, 0.045, z]}>
            <Toy color={i === 24 ? c.pink : tones[(row + (i % 3)) % tones.length]} />
          </RoundedBox>
        ))}
      </group>
    </>
  );
}

function BubbleTea({ c, sip }: { c: Palette; sip: boolean }) {
  const tea = useRef<Group>(null);
  const level = useRef(1);
  useFrame((_, dt) => {
    // drink down while sipping, then slowly refill
    level.current += ((sip ? 0.25 : 1) - level.current) * Math.min(1, dt * (sip ? 2 : 0.6));
    tea.current!.scale.y = level.current;
  });
  const boba = useMemo(
    () => Array.from({ length: 14 }, (_, i) => [Math.cos(i * 2.4) * 0.07 * ((i % 3) / 2 + 0.3), 0.04 + (i % 3) * 0.035, Math.sin(i * 2.4) * 0.07 * ((i % 3) / 2 + 0.3)] as const),
    [],
  );
  return (
    <>
      <group ref={tea}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.135, 0.11, 0.32, 32]} />
          <meshPhysicalMaterial color="#ffc2dc" roughness={0.4} />
        </mesh>
      </group>
      {boba.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshPhysicalMaterial color="#2a1a22" roughness={0.2} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 32, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.28} roughness={0.05} clearcoat={1} side={2} />
        <Outlines thickness={0.008} color={c.ink} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.35} roughness={0.05} />
      </mesh>
      <mesh position={[0.04, 0.55, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.022, 0.022, 0.6, 16]} />
        <Toy color={c.pink} />
        <Outlines thickness={0.006} color={c.ink} />
      </mesh>
    </>
  );
}

function Plant({ c }: { c: Palette }) {
  const leaf = useMemo(() => new Shape(heart(0.006).map((p) => new Vector2(p.x, -p.y))), []);
  return (
    <>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.17, 0.13, 0.26, 32]} />
        <Toy color={c.butter} />
        <Outlines thickness={0.008} color={c.ink} />
      </mesh>
      {[0, 1.1, 2.2, 3.3, 4.4, 5.5].map((a, i) => (
        <group key={a} position={[0, 0.28 + (i % 2) * 0.08, 0]} rotation={[0, a, 0]}>
          <mesh position={[0, 0.06, 0.1]} rotation={[-0.9 + (i % 3) * 0.2, 0, 0]}>
            <extrudeGeometry args={[leaf, { depth: 0.006, bevelEnabled: false }]} />
            <Toy color={c.leaf} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Leds() {
  const on = useRef(0);
  const leds = useRef<Group>(null);
  useFrame((state) => {
    // a slow pseudo-random blink, like a server under light load
    const t = Math.floor(state.clock.elapsedTime * 3);
    if (t === on.current) return;
    on.current = t;
    leds.current!.children.forEach((led, i) => (led.visible = Math.sin(t * (i + 1.7)) > -0.2));
  });
  return (
    <group ref={leds}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.18 + i * 0.09, 0.36, 0.36]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color={i === 1 ? [2.6, 0.5, 1.6] : [0.4, 2.4, 1.0]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Server({ c }: { c: Palette }) {
  const sticker = useMemo(() => new Shape(heart(0.006)), []);
  return (
    <>
      <Box args={[0.6, 1.0, 0.7]} color={c.mint} ink={c.ink} />
      {[-0.15, 0, 0.15].map((y) => (
        <Box key={y} args={[0.46, 0.06, 0.02]} color={c.desk} ink={c.ink} radius={0.01} position={[0, y, 0.36]} />
      ))}
      <Leds />
      {/* laptop-style stickers on the side */}
      <mesh position={[0.302, 0.25, 0.1]} rotation={[0, Math.PI / 2, 0.3]}>
        <circleGeometry args={[0.08, 32]} />
        <meshStandardMaterial color={c.butter} />
      </mesh>
      <mesh position={[0.302, -0.1, -0.15]} rotation={[0, Math.PI / 2, -0.2]}>
        <shapeGeometry args={[sticker]} />
        <meshStandardMaterial color={c.pink} />
      </mesh>
      <mesh position={[0.302, -0.32, 0.18]} rotation={[0, Math.PI / 2, 0.1]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshStandardMaterial color={c.lilac} />
      </mesh>
    </>
  );
}

const screenTones = ['#fc9ac9', '#a5f0db', '#fbe48d', '#cbbcfc'];

// the laptop screen is drawn to a canvas texture; clicks map back to an icon through the hit's uv
function useScreen() {
  const material = useRef<MeshBasicMaterial>(null);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    const draw = () => {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1b1743';
      ctx.fillRect(0, 0, 1024, 680);
      ctx.fillStyle = '#e9e4ff';
      ctx.font = '600 40px "Atkinson Hyperlegible Mono Variable", monospace';
      ctx.fillText('~/projects', 56, 84);
      siteProjects.forEach((p, i) => {
        const x = 56 + (i % 3) * 320;
        const y = 150 + Math.floor(i / 3) * 250;
        ctx.fillStyle = screenTones[i % screenTones.length];
        ctx.beginPath();
        ctx.roundRect(x + 60, y, 140, 140, 32);
        ctx.fill();
        ctx.fillStyle = '#e9e4ff';
        ctx.font = '30px "Atkinson Hyperlegible Mono Variable", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.id, x + 130, y + 190);
        ctx.textAlign = 'left';
      });
      t.needsUpdate = true;
    };
    draw();
    // redraw once the web font is in, so the labels aren't stuck in the fallback face
    document.fonts.ready.then(draw);
    material.current!.map = t;
    material.current!.needsUpdate = true;
    return () => t.dispose();
  }, []);
  return material;
}

function screenIcon(u: number, v: number) {
  const x = u * 1024;
  const y = (1 - v) * 680;
  const col = Math.floor((x - 56) / 320);
  const row = Math.floor((y - 150) / 250);
  const i = row * 3 + col;
  return col >= 0 && col < 3 && row >= 0 && siteProjects[i] ? siteProjects[i] : null;
}

function Laptop({ c, onOpen }: { c: Palette; onOpen: (id: WinId) => void }) {
  const screen = useScreen();
  return (
    <>
      <Box args={[1.0, 0.24, 0.5]} color={c.mint} ink={c.ink} position={[0, -0.12, 0]} radius={0.03} />
      <Box args={[1.3, 0.06, 0.9]} color={c.pink} ink={c.ink} position={[0, 0.03, 0]} />
      <group position={[0, 0.06, -0.44]} rotation={[-0.28, 0, 0]}>
        <Box args={[1.3, 0.86, 0.05]} color={c.pink} ink={c.ink} position={[0, 0.43, 0]} />
        <mesh
          position={[0, 0.44, 0.027]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            const project = e.uv && screenIcon(e.uv.x, e.uv.y);
            if (!project) return;
            e.stopPropagation();
            onOpen(`project:${project.id}`);
          }}
        >
          <planeGeometry args={[1.18, 0.78]} />
          <meshBasicMaterial ref={screen} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

function Globe({ c, shaking }: { c: Palette; shaking: boolean }) {
  const charm = useMemo(() => new Shape(heart(0.007)), []);
  return (
    <>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.12, 32]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.9} roughness={0.15} iridescence={1} iridescenceIOR={1.7} />
        <Outlines thickness={0.01} color={c.ink} />
      </mesh>
      <mesh position={[0, 0.27, -0.02]} rotation={[0, 0.4, Math.PI]}>
        <extrudeGeometry args={[charm, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 }]} />
        <Toy color={c.pink} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.24, 48, 48]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.02} clearcoat={1} />
      </mesh>
      <Sparkles position={[0, 0.3, 0]} count={50} scale={0.4} size={3} speed={shaking ? 4 : 0.3} color="#ffffff" />
    </>
  );
}

function Snowboard({ c, wobble }: { c: Palette; wobble: number }) {
  const board = useRef<Group>(null);
  useFrame((state) => {
    const left = (wobble - performance.now()) / 900;
    board.current!.rotation.z = left > 0 ? Math.sin(state.clock.elapsedTime * 18) * 0.08 * left : 0;
  });
  return (
    <group ref={board}>
      <Box args={[0.34, 1.9, 0.04]} color={c.pink} ink={c.ink} radius={0.016} />
      <Box args={[0.34, 0.2, 0.045]} color={c.butter} ink={c.ink} radius={0.01} position={[0, 0.4, 0]} />
      <Box args={[0.34, 0.08, 0.045]} color={c.mint} ink={c.ink} radius={0.01} position={[0, -0.2, 0]} />
    </group>
  );
}

type SceneProps = { c: Palette; focus: ObjectId | null; onPick: (id: ObjectId) => void; onOpen: (id: WinId) => void };

function Scene({ c, focus, onPick, onOpen }: SceneProps) {
  const controls = useRef<CameraControls>(null);
  const tilt = useRef<Group>(null);
  const [shake, setShake] = useState(false);
  const [spin, setSpin] = useState(false);
  const [sip, setSip] = useState(false);
  const [wobble, setWobble] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    controls.current?.setLookAt(...pose(focus), !reduced);
  }, [focus]);

  // short-lived effects switch themselves off
  useEffect(() => {
    if (!shake && !spin && !sip) return;
    const t = setTimeout(() => {
      setShake(false);
      setSpin(false);
      setSip(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [shake, spin, sip]);

  // the whole desk leans a little toward the pointer, or with the phone's tilt
  const orientation = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onTilt = (e: DeviceOrientationEvent) => {
      orientation.current = { x: Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30)), y: Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30)) };
    };
    addEventListener('deviceorientation', onTilt);
    return () => removeEventListener('deviceorientation', onTilt);
  }, []);

  useFrame((state, dt) => {
    if (reduced) return;
    const target = orientation.current.x || orientation.current.y ? orientation.current : state.pointer;
    const g = tilt.current!;
    g.rotation.y += (target.x * 0.06 - g.rotation.y) * Math.min(1, dt * 3);
    g.rotation.x += (-target.y * 0.03 - g.rotation.x) * Math.min(1, dt * 3);
    // a gentle float, like a little island
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.025;
  });

  const pick = (id: ObjectId) => () => onPick(id);

  return (
    <>
      <Sky c={c} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#ffffff', c.lilac, 0.8]} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[8, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2} color="#ffc4e4" position={[-5, 2, 1]} scale={[3, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2} color="#c4f5ff" position={[5, 2, 1]} scale={[3, 4, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 1, 6]} scale={2} />
      </Environment>
      <CameraControls
        ref={controls}
        minDistance={1.5}
        maxDistance={16}
        minPolarAngle={0.35}
        maxPolarAngle={1.35}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
      />

      <group ref={tilt}>
        <Box args={[4.7, 0.16, 2.7]} color={c.desk} ink={c.ink} position={[0, -0.08, -0.05]} radius={0.06} />
        <Pegboard c={c} />
        <NeonHeart />
        <FairyLights c={c} />
        <Holds c={c} />
        <Sparkles count={40} scale={[6, 3, 3]} position={[0, 1.4, 0]} size={2.2} speed={0.25} color={c.pink} opacity={0.7} />

        <Pickable label="projects" position={[-0.3, 0.15, -0.45]} labelHeight={1.15} focused={focus === 'laptop'} onPick={pick('laptop')}>
          <Laptop c={c} onOpen={onOpen} />
        </Pickable>

        <Pickable label="terminal" position={[-0.3, 0, 0.45]} labelHeight={0.3} focused={focus === 'keyboard'} onPick={pick('keyboard')} onHover={setTyping}>
          <Keyboard c={c} active={typing || focus === 'keyboard'} />
        </Pickable>

        <Pickable label="work at ncs" position={[1.55, 0.5, -0.75]} labelHeight={0.75} focused={focus === 'server'} onPick={pick('server')}>
          <Server c={c} />
        </Pickable>

        <Pickable label="about me" position={[-1.3, 1.55, -1.3]} rotation={[0, 0, 0.06]} labelHeight={0.6} focused={focus === 'polaroid'} onPick={pick('polaroid')}>
          <Suspense fallback={null}>
            <Polaroid c={c} />
          </Suspense>
        </Pickable>

        <Pickable label="how i work" position={[1.6, 0.01, 0.45]} labelHeight={0.35} focused={focus === 'notes'} onPick={pick('notes')}>
          <Box args={[0.42, 0.02, 0.42]} color={c.butter} ink={c.ink} radius={0.006} rotation={[0, 0.2, 0]} />
          <Box args={[0.42, 0.02, 0.42]} color={c.pink} ink={c.ink} radius={0.006} position={[0.16, 0.025, 0.08]} rotation={[0, -0.25, 0]} />
        </Pickable>

        <Pickable label="earlier" position={[-1.05, 0, 0.75]} labelHeight={0.6} focused={focus === 'books'} onPick={pick('books')}>
          <Box args={[0.7, 0.12, 0.5]} color={c.lilac} ink={c.ink} position={[0, 0.06, 0]} radius={0.02} />
          <Box args={[0.64, 0.11, 0.46]} color={c.mint} ink={c.ink} position={[0.02, 0.175, 0]} rotation={[0, 0.12, 0]} radius={0.02} />
          <Box args={[0.6, 0.1, 0.44]} color={c.pink} ink={c.ink} position={[-0.02, 0.28, 0]} rotation={[0, -0.1, 0]} radius={0.02} />
        </Pickable>

        <Pickable
          label="hello"
          position={[-1.75, 0, 0.6]}
          labelHeight={0.7}
          focused={focus === 'globe'}
          onPick={() => {
            setShake(true);
            onPick('globe');
          }}
        >
          <Globe c={c} shaking={shake} />
        </Pickable>

        <Pickable label="boba break" position={[1.0, 0, 0.6]} labelHeight={0.95} onPick={() => setSip(true)}>
          <BubbleTea c={c} sip={sip} />
        </Pickable>

        <Pickable label="pothos" position={[-1.75, 0, -0.55]} labelHeight={0.75}>
          <Plant c={c} />
        </Pickable>

        <Pickable label="dance break" position={[-0.95, 2.35, -0.35]} labelHeight={0.5} onPick={() => setSpin(true)}>
          <DiscoBall spin={spin} />
        </Pickable>

        <Pickable label="resume.pdf" position={[0.55, 0.012, 0.85]} rotation={[0, -0.15, 0]} labelHeight={0.3} onPick={() => window.open('/wang-zhao-resume.pdf', '_blank', 'noopener')}>
          <Box args={[0.5, 0.012, 0.66]} color="#ffffff" ink={c.ink} radius={0.004} />
          {[0.2, 0.12, 0.04, -0.04, -0.12].map((z) => (
            <mesh key={z} position={[0, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.36, 0.025]} />
              <meshBasicMaterial color={c.lilac} />
            </mesh>
          ))}
        </Pickable>

        <Pickable
          label="off screen: bouldering, diving, snowboarding, dance"
          position={[2.1, 1.0, -1.18]}
          rotation={[0.12, -0.3, -0.1]}
          labelHeight={1.1}
          onPick={() => setWobble(performance.now() + 900)}
        >
          <Snowboard c={c} wobble={wobble} />
        </Pickable>
      </group>

      <ContactShadows position={[0, -0.17, 0]} opacity={0.35} scale={9} blur={2.4} far={2} color={c.ink} />
    </>
  );
}

type Props = { theme: string; focus: ObjectId | null; onPick: (id: ObjectId) => void; onOpen: (id: WinId) => void };

// machines without a usable GPU fall back to software WebGL, where post-processing is far too slow
function softwareRenderer() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  return /swiftshader|llvmpipe|software/i.test(name);
}

export default function DeskScene({ theme, focus, onPick, onOpen }: Props) {
  const c = palettes[theme === 'dark' ? 'dark' : 'light'];
  // post-processing switches itself off if the frame rate struggles, ignoring the first seconds of shader compiles
  const [fx, setFx] = useState(() => !softwareRenderer());
  const [mounted] = useState(() => performance.now());
  return (
    <div className="desk-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0.9, 3.1, 6.4], fov: 36 }} dpr={[1, 1.75]}>
        <PerformanceMonitor onDecline={() => performance.now() - mounted > 5000 && setFx(false)} />
        <Scene c={c} focus={focus} onPick={onPick} onOpen={onOpen} />
        {fx && (
          <EffectComposer multisampling={4}>
            <N8AO halfRes aoRadius={0.25} intensity={1.1} distanceFalloff={0.4} />
            <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.9} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
