import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { CameraControls, ContactShadows, Html, Outlines, RoundedBox, Sparkles, useTexture } from '@react-three/drei';
import type { Group } from 'three';
import { siteProjects } from '../content/site';
import type { ObjectId, WinId } from './windows';
import photo from '../assets/images/zhao.webp';

const palettes = {
  light: { bg: '#ebe5ff', desk: '#f7f3ff', ink: '#1b1743', pink: '#fc9ac9', mint: '#a5f0db', butter: '#fbe48d', lilac: '#cbbcfc', signal: '#b8196f' },
  dark: { bg: '#141029', desk: '#2b2652', ink: '#0b0920', pink: '#fc9ac9', mint: '#a5f0db', butter: '#fbe48d', lilac: '#cbbcfc', signal: '#ff7fbf' },
};
type Palette = (typeof palettes)['light'];

// where each object sits; the camera frames it a little to the left so open windows don't cover it
const spots: Record<ObjectId, [number, number, number]> = {
  globe: [-0.6, 0.3, 0.82],
  laptop: [0.1, 0.45, 0.05],
  server: [1.45, 0.5, -0.6],
  polaroid: [-1.5, 0.42, -0.6],
  notes: [1.1, 0.05, 0.65],
  books: [-1.55, 0.2, 0.55],
};

function pose(focus: ObjectId | null): [number, number, number, number, number, number] {
  // portrait screens see less of the desk's width, so pull the camera back
  const back = Math.max(1, 1.05 / (innerWidth / innerHeight));
  if (!focus) return [0.9 * back, 3.6 * back, 5.6 * back, 0.4, 0.2, 0];
  const [x, y, z] = spots[focus];
  const shift = innerWidth > 900 ? 0.7 : 0;
  return [x + shift - 0.4, y + 1.7 * back, z + 2.9 * back, x + shift, y, z];
}

type PickProps = {
  id: ObjectId | 'resume' | 'snowboard';
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  labelHeight: number;
  focused: boolean;
  onPick: () => void;
  children: ReactNode;
};

function Pickable({ label, position, rotation, labelHeight, focused, onPick, children }: PickProps) {
  const group = useRef<Group>(null);
  const [hover, setHover] = useState(false);

  useFrame((_, dt) => {
    const lift = hover || focused ? 0.06 : 0;
    group.current!.position.y += (position[1] + lift - group.current!.position.y) * Math.min(1, dt * 10);
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick();
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

function Box({ args, color, ink, radius = 0.04, ...rest }: { args: [number, number, number]; color: string; ink: string; radius?: number } & Record<string, unknown>) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={3} {...rest}>
      <meshStandardMaterial color={color} roughness={0.7} />
      <Outlines thickness={0.012} color={ink} />
    </RoundedBox>
  );
}

function Polaroid({ c }: { c: Palette }) {
  const texture = useTexture(photo);
  return (
    <>
      <Box args={[0.62, 0.8, 0.03]} color="#ffffff" ink={c.ink} radius={0.01} />
      <mesh position={[0, 0.07, 0.017]}>
        <planeGeometry args={[0.52, 0.56]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </>
  );
}

function Leds({ c }: { c: Palette }) {
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
          <meshBasicMaterial color={i === 1 ? c.signal : '#3ddc97'} />
        </mesh>
      ))}
    </group>
  );
}

function Laptop({ c, onOpen }: { c: Palette; onOpen: (id: WinId) => void }) {
  return (
    <>
      <Box args={[1.3, 0.06, 0.9]} color={c.pink} ink={c.ink} />
      <group position={[0, 0.03, -0.44]} rotation={[-0.28, 0, 0]}>
        <Box args={[1.3, 0.86, 0.05]} color={c.pink} ink={c.ink} position={[0, 0.43, 0]} />
        <Html transform position={[0, 0.44, 0.03]} scale={0.6} zIndexRange={[4, 0]} className="laptop-screen">
          <div className="laptop-ui">
            <p className="mono">~/projects</p>
            <div className="laptop-icons">
              {siteProjects.map((p) => (
                <button key={p.id} type="button" tabIndex={-1} onClick={() => onOpen(`project:${p.id}`)}>
                  <span aria-hidden="true" />
                  {p.id}
                </button>
              ))}
            </div>
          </div>
        </Html>
      </group>
    </>
  );
}

function Globe({ c, shaking }: { c: Palette; shaking: boolean }) {
  return (
    <>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.12, 32]} />
        <meshStandardMaterial color={c.lilac} />
        <Outlines thickness={0.012} color={c.ink} />
      </mesh>
      <Box args={[0.12, 0.12, 0.12]} color={c.pink} ink={c.ink} position={[0, 0.2, 0]} rotation={[0, 0.6, 0]} radius={0.03} />
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.24, 48, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      <Sparkles position={[0, 0.3, 0]} count={50} scale={0.4} size={3} speed={shaking ? 4 : 0.3} color="#ffffff" />
    </>
  );
}

function Snowboard({ c }: { c: Palette }) {
  const board = useRef<Group>(null);
  const until = useRef(0);
  useFrame((state) => {
    const left = (until.current - performance.now()) / 900;
    board.current!.rotation.z = left > 0 ? Math.sin(state.clock.elapsedTime * 18) * 0.08 * left : 0;
  });
  return (
    <group ref={board} onClick={() => (until.current = performance.now() + 900)}>
      <Box args={[0.34, 1.9, 0.04]} color={c.pink} ink={c.ink} radius={0.016} />
      <Box args={[0.34, 0.2, 0.045]} color={c.butter} ink={c.ink} radius={0.01} position={[0, 0.4, 0]} />
    </group>
  );
}

function Scene({ c, focus, onPick, onOpen }: { c: Palette; focus: ObjectId | null; onPick: (id: ObjectId) => void; onOpen: (id: WinId) => void }) {
  const controls = useRef<CameraControls>(null);
  const tilt = useRef<Group>(null);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shake, setShake] = useState(false);

  useEffect(() => {
    controls.current?.setLookAt(...pose(focus), !reduced);
  }, [focus, reduced]);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 1600);
    return () => clearTimeout(t);
  }, [shake]);

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
    tilt.current!.rotation.y += (target.x * 0.06 - tilt.current!.rotation.y) * Math.min(1, dt * 3);
    tilt.current!.rotation.x += (-target.y * 0.03 - tilt.current!.rotation.x) * Math.min(1, dt * 3);
  });

  const pick = (id: ObjectId) => () => onPick(id);

  return (
    <>
      <color attach="background" args={[c.bg]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <CameraControls ref={controls} minDistance={1.5} maxDistance={16} minPolarAngle={0.35} maxPolarAngle={1.35} minAzimuthAngle={-0.9} maxAzimuthAngle={0.9} />

      <group ref={tilt}>
        <Box args={[4.6, 0.16, 2.6]} color={c.desk} ink={c.ink} position={[0, -0.08, 0]} radius={0.06} />

        <Pickable id="laptop" label="projects" position={[0.1, 0.03, 0.05]} labelHeight={1.15} focused={focus === 'laptop'} onPick={pick('laptop')}>
          <Laptop c={c} onOpen={onOpen} />
        </Pickable>

        <Pickable id="server" label="work at ncs" position={[1.45, 0.5, -0.6]} labelHeight={0.75} focused={focus === 'server'} onPick={pick('server')}>
          <Box args={[0.6, 1.0, 0.7]} color={c.mint} ink={c.ink} />
          {[-0.15, 0, 0.15].map((y) => (
            <Box key={y} args={[0.46, 0.06, 0.02]} color={c.desk} ink={c.ink} radius={0.01} position={[0, y, 0.36]} />
          ))}
          <Leds c={c} />
        </Pickable>

        <Pickable id="polaroid" label="about me" position={[-1.5, 0.42, -0.6]} rotation={[-0.08, 0.4, 0.04]} labelHeight={0.6} focused={focus === 'polaroid'} onPick={pick('polaroid')}>
          <Suspense fallback={null}>
            <Polaroid c={c} />
          </Suspense>
        </Pickable>

        <Pickable id="notes" label="how i work" position={[1.1, 0.01, 0.65]} labelHeight={0.35} focused={focus === 'notes'} onPick={pick('notes')}>
          <Box args={[0.42, 0.02, 0.42]} color={c.butter} ink={c.ink} radius={0.006} rotation={[0, 0.2, 0]} />
          <Box args={[0.42, 0.02, 0.42]} color={c.pink} ink={c.ink} radius={0.006} position={[0.16, 0.025, 0.08]} rotation={[0, -0.25, 0]} />
        </Pickable>

        <Pickable id="books" label="earlier" position={[-1.55, 0.0, 0.55]} labelHeight={0.6} focused={focus === 'books'} onPick={pick('books')}>
          <Box args={[0.7, 0.12, 0.5]} color={c.lilac} ink={c.ink} position={[0, 0.06, 0]} radius={0.02} />
          <Box args={[0.64, 0.11, 0.46]} color={c.mint} ink={c.ink} position={[0.02, 0.175, 0]} rotation={[0, 0.12, 0]} radius={0.02} />
          <Box args={[0.6, 0.1, 0.44]} color={c.pink} ink={c.ink} position={[-0.02, 0.28, 0]} rotation={[0, -0.1, 0]} radius={0.02} />
        </Pickable>

        <Pickable
          id="globe"
          label="hello"
          position={[-0.6, 0, 0.82]}
          labelHeight={0.7}
          focused={focus === 'globe'}
          onPick={() => {
            setShake(true);
            onPick('globe');
          }}
        >
          <Globe c={c} shaking={shake} />
        </Pickable>

        <Pickable id="resume" label="resume.pdf" position={[0.45, 0.012, 0.95]} rotation={[0, -0.15, 0]} labelHeight={0.3} focused={false} onPick={() => window.open('/wang-zhao-resume.pdf', '_blank', 'noopener')}>
          <Box args={[0.5, 0.012, 0.66]} color="#ffffff" ink={c.ink} radius={0.004} />
          {[0.2, 0.12, 0.04, -0.04, -0.12].map((z) => (
            <mesh key={z} position={[0, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.36, 0.025]} />
              <meshBasicMaterial color={c.lilac} />
            </mesh>
          ))}
        </Pickable>

        <Pickable id="snowboard" label="off screen: bouldering, diving, snowboarding, dance" position={[2.05, 0.95, -1.05]} rotation={[0.15, -0.3, -0.12]} labelHeight={1.1} focused={false} onPick={() => undefined}>
          <Snowboard c={c} />
        </Pickable>
      </group>

      <ContactShadows position={[0, -0.17, 0]} opacity={0.35} scale={8} blur={2.4} far={2} color={c.ink} />
    </>
  );
}

type Props = { theme: string; focus: ObjectId | null; onPick: (id: ObjectId) => void; onOpen: (id: WinId) => void };

export default function DeskScene({ theme, focus, onPick, onOpen }: Props) {
  const c = palettes[theme === 'dark' ? 'dark' : 'light'];
  return (
    <div className="desk-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0.9, 3.6, 5.6], fov: 36 }} dpr={[1, 2]}>
        <Scene c={c} focus={focus} onPick={onPick} onOpen={onOpen} />
      </Canvas>
    </div>
  );
}
