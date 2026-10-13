import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, RoundedBox } from '@react-three/drei';
import {
  CanvasTexture,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
  type PerspectiveCamera as Camera,
} from 'three';
import { ride, sfx } from './sound';
import { rand } from './Dressing';

// first-person run down a made-up slope. The camera stays put and the slope scrolls past it.
const ORIGIN: [number, number, number] = [0, 0, -600];
const LENGTH = 120;
const KICKER = 125;
const AIR = 0.9;
const END = 10.5;
const TOP = 30;
const TREES = 70;

const trees = Array.from({ length: TREES }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  return { z: rand(i) * LENGTH, x: side * (3.2 + rand(i + 99) * 14), s: 0.8 + rand(i + 7) * 1.3 };
});

// slalom flags sit just inside each turn, so the carve swings round them
const flags = Array.from({ length: 8 }, (_, i) => {
  const z = i * 15;
  const sway = Math.sin((Math.PI * (LENGTH - 8 - z)) / 15);
  return { z, x: Math.sign(sway) * 0.55, colour: i % 2 ? '#a5f0db' : '#fc9ac9' };
});

const sway = (d: number) => Math.sin((Math.PI * d) / 15);
const wrap = (z: number) => ((z % LENGTH) + LENGTH) % LENGTH - LENGTH + 8;

function snowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(150, 160, 220, ${0.08 + rand(i) * 0.18})`;
    g.fillRect(rand(i + 1) * 256, rand(i + 2) * 256, 2, 2 + rand(i + 3) * 6);
  }
  // grooves left by other riders, running down the slope
  g.strokeStyle = 'rgba(180, 170, 240, 0.35)';
  for (let i = 0; i < 7; i++) {
    g.lineWidth = 1 + rand(i + 50) * 2;
    g.beginPath();
    g.moveTo(rand(i + 60) * 256, 0);
    g.lineTo(rand(i + 60) * 256 + 10, 256);
    g.stroke();
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(6, 30);
  t.anisotropy = 8;
  return t;
}

type Hud = { root: RefObject<HTMLDivElement | null>; speed: RefObject<HTMLElement | null>; say: RefObject<HTMLElement | null> };

export default function Run({ night, hud, onDone }: { night: boolean; hud: Hud; onDone: () => void }) {
  const camera = useRef<Camera>(null);
  const rig = useRef<Group>(null);
  const hands = useRef<Group>(null);
  const tiers = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);
  const flagGroup = useRef<Group>(null);
  const kicker = useRef<Group>(null);
  const ground = useRef<Mesh>(null);
  const flakes = useRef<BufferGeometry>(null);
  const texture = useMemo(() => snowTexture(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const flakeStart = useMemo(() => Float32Array.from({ length: 900 }, (_, i) => rand(i + 500)), []);
  const run = useRef({ clock: 0, d: 0, air: -1, landed: -1, beats: 0, shake: 0, said: '', done: false });
  const wind = useRef<ReturnType<typeof ride>>(null);

  useEffect(() => {
    wind.current = ride();
    sfx.whoosh();
    return () => {
      wind.current?.stop();
      texture.dispose();
    };
  }, [texture]);

  useFrame((state, delta) => {
    const r = run.current;
    const dt = Math.min(delta, 0.05);
    const airU = r.air >= 0 ? (r.clock - r.air) / AIR : -1;
    const flying = airU >= 0 && airU < 1;
    // slow motion while airborne
    const scale = flying ? 0.4 : 1;
    r.clock += dt * scale;
    const v = r.clock < 0.9 ? 0 : Math.min(TOP, (r.clock - 0.9) * 9);
    r.d += v * dt * scale;

    if (r.air < 0 && r.d >= KICKER) {
      r.air = r.clock;
      sfx.heartbeat();
    }
    if (flying && airU > 0.5 && r.beats < 1) {
      r.beats = 1;
      sfx.heartbeat();
    }
    if (r.air >= 0 && airU >= 1 && r.landed < 0) {
      r.landed = r.clock;
      r.shake = 1;
      sfx.thump();
    }
    if (r.clock >= END && !r.done) {
      r.done = true;
      onDone();
    }

    // scrolling world
    trees.forEach((tree, i) => {
      const z = wrap(tree.z + r.d);
      [0, 1, 2].forEach((tier) => {
        dummy.position.set(tree.x, tree.s * (0.6 + tier * 0.55), z);
        dummy.scale.setScalar(tree.s * (1 - tier * 0.24));
        dummy.updateMatrix();
        tiers.current!.setMatrixAt(i * 3 + tier, dummy.matrix);
      });
      dummy.position.set(tree.x, tree.s * 1.95, z);
      dummy.scale.setScalar(tree.s * 0.42);
      dummy.updateMatrix();
      caps.current!.setMatrixAt(i, dummy.matrix);
    });
    tiers.current!.instanceMatrix.needsUpdate = true;
    caps.current!.instanceMatrix.needsUpdate = true;
    flagGroup.current!.children.forEach((flag, i) => flag.position.setZ(wrap(flags[i].z + r.d)));
    kicker.current!.position.z = r.d - KICKER + 2;
    const map = (ground.current!.material as MeshStandardMaterial).map!;
    map.offset.y = r.d / (260 / 30);

    const pos = flakes.current!.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const a = flakeStart[i * 3],
        b = flakeStart[i * 3 + 1],
        c = flakeStart[i * 3 + 2];
      pos.setXYZ(i, (a - 0.5) * 16, (((b * 6 - r.clock * 0.8) % 6) + 6) % 6, ((((c * 44 + r.d * 1.15) % 44) + 44) % 44) - 40);
    }
    pos.needsUpdate = true;

    // camera: carve sway, ride up the kicker, the air, and the landing shake
    const x = 1.4 * sway(r.d);
    const toLip = KICKER - r.d;
    let y = 1.2;
    if (r.air < 0 && toLip < 4) y += 0.7 * (1 - toLip / 4);
    if (flying) y += 0.7 * (1 - airU) + 4 * 2.3 * airU * (1 - airU);
    r.shake *= Math.exp(-dt * 4);
    const buzz = (v / TOP) * 0.018 + r.shake * 0.12;
    const t = state.clock.elapsedTime;
    rig.current!.position.set(x + Math.sin(t * 41) * buzz, y + Math.sin(t * 53) * buzz, 0);
    const lean = flying ? 0 : -0.22 * sway(r.d) * (v / TOP);
    rig.current!.rotation.set(-0.16 - (flying ? 0.25 * airU : 0), -0.18 * Math.cos((Math.PI * r.d) / 15) * (v / TOP), lean);
    const cam = camera.current!;
    cam.fov = 62 + 30 * (v / TOP) - (flying ? 12 * Math.sin(airU * Math.PI) : 0) + r.shake * 12;
    cam.updateProjectionMatrix();
    hands.current!.position.y = Math.sin(t * 6) * 0.02 + (flying ? 0.12 * Math.sin(airU * Math.PI) : 0);
    hands.current!.rotation.z = -lean * 0.8;

    const carve = Math.abs(sway(r.d));
    wind.current?.set(flying ? 0.25 : v / TOP, flying ? 0 : carve);

    const kmh = Math.round(v * 2.6);
    hud.speed.current?.replaceChildren(String(kmh));
    hud.root.current?.style.setProperty('--speed', String(flying ? 0.35 : v / TOP));
    const say = r.clock < 0.9 ? 'drop in' : r.landed >= 0 ? 'landed it ✨' : flying ? 'airtime ✦' : v >= TOP ? 'send it' : 'speeding up';
    if (say !== r.said) {
      r.said = say;
      hud.say.current?.replaceChildren(say);
    }
  });

  const snow = night ? '#c9c6ef' : '#ffffff';
  const pine = night ? '#22504f' : '#3c8f7f';

  return (
    <group position={ORIGIN}>
      <fog attach="fog" args={[night ? '#20183d' : '#f3e6ff', 14, 95]} />
      <group ref={rig}>
        <PerspectiveCamera ref={camera} makeDefault fov={62} near={0.05} far={200}>
          {/* her mittens and the board's nose at the bottom of the frame */}
          <group ref={hands}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.62, -0.5, -0.95]} rotation={[0, 0, side * -0.5]}>
                <mesh position={[side * 0.25, -0.1, 0.1]} rotation={[0, 0, side * 1.1]}>
                  <capsuleGeometry args={[0.09, 0.4, 6, 12]} />
                  <meshPhysicalMaterial color="#fc9ac9" roughness={0.4} clearcoat={0.7} />
                </mesh>
                <mesh scale={[1, 0.85, 1]}>
                  <sphereGeometry args={[0.11, 16, 12]} />
                  <meshPhysicalMaterial color="#a5f0db" roughness={0.5} clearcoat={0.4} />
                </mesh>
              </group>
            ))}
          </group>
          <RoundedBox args={[0.42, 0.05, 1.4]} radius={0.025} position={[0.1, -1.05, -1.3]} rotation={[0.35, 0.25, 0]}>
            <meshPhysicalMaterial color="#fc9ac9" roughness={0.25} clearcoat={1} iridescence={0.6} />
          </RoundedBox>
        </PerspectiveCamera>
      </group>

      {/* the sun ahead, bright enough to bloom */}
      <mesh position={[18, 30, -170]}>
        <sphereGeometry args={[7, 32, 16]} />
        <meshBasicMaterial color={night ? [1.6, 1.6, 2.2] : [3, 2.4, 1.8]} toneMapped={false} fog={false} />
      </mesh>
      {[-70, -35, 30, 65].map((x, i) => (
        <mesh key={x} position={[x, -6, -150 - i * 12]}>
          <coneGeometry args={[34, 46 + i * 6, 7]} />
          <meshStandardMaterial color={i % 2 ? '#d8d0ff' : '#efe9ff'} flatShading />
        </mesh>
      ))}

      <group rotation={[-0.24, 0, 0]}>
        <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -120]}>
          <planeGeometry args={[60, 260]} />
          <meshStandardMaterial map={texture} color={snow} roughness={0.9} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 20, 3, -120]} rotation={[0, 0, side * 0.5]}>
            <boxGeometry args={[14, 0.5, 260]} />
            <meshStandardMaterial color={snow} roughness={1} />
          </mesh>
        ))}
        <instancedMesh ref={tiers} args={[undefined, undefined, TREES * 3]} frustumCulled={false}>
          <coneGeometry args={[0.85, 1.2, 8]} />
          <meshStandardMaterial color={pine} flatShading roughness={0.8} />
        </instancedMesh>
        <instancedMesh ref={caps} args={[undefined, undefined, TREES]} frustumCulled={false}>
          <coneGeometry args={[0.85, 1.0, 8]} />
          <meshStandardMaterial color={snow} flatShading />
        </instancedMesh>
        <group ref={flagGroup}>
          {flags.map((f) => (
            <group key={f.z} position={[f.x, 0, 0]}>
              <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
                <meshStandardMaterial color={f.colour} />
              </mesh>
              <mesh position={[f.x > 0 ? 0.22 : -0.22, 1.2, 0]} rotation={[0, 0, f.x > 0 ? -Math.PI / 2 : Math.PI / 2]}>
                <coneGeometry args={[0.18, 0.44, 3]} />
                <meshStandardMaterial color={f.colour} emissive={f.colour} emissiveIntensity={0.4} />
              </mesh>
            </group>
          ))}
        </group>
        <group ref={kicker}>
          <mesh position={[0, 0.3, 0]} rotation={[0.17, 0, 0]}>
            <boxGeometry args={[3.2, 0.3, 4.1]} />
            <meshStandardMaterial color={snow} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.66, -2.02]}>
            <boxGeometry args={[3.2, 0.06, 0.08]} />
            <meshBasicMaterial color={[2.4, 0.7, 1.5]} toneMapped={false} />
          </mesh>
        </group>
        <points frustumCulled={false}>
          <bufferGeometry ref={flakes}>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(900), 3]} />
          </bufferGeometry>
          <pointsMaterial color="#ffffff" size={0.07} transparent opacity={0.9} />
        </points>
      </group>
    </group>
  );
}
