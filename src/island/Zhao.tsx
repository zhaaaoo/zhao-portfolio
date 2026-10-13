import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines, RoundedBox } from '@react-three/drei';
import type { Group, Mesh } from 'three';

export type Pose = 'idle' | 'dangle' | 'walk' | 'type' | 'board' | 'swim' | 'climb' | 'dance' | 'wave';

const skin = '#ffd9c4';
const hair = '#2f2226';
const jacket = '#2b2733';
const trousers = '#cdb38a';
const ink = '#1b1743';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function Puffer({ y, r }: { y: number; r: number }) {
  // the jacket is a few stacked rings, which reads as a puffer at this size
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r, 0.055, 12, 24]} />
      <meshPhysicalMaterial color={jacket} roughness={0.35} clearcoat={0.6} />
    </mesh>
  );
}

function Limb({ length, radius, color }: { length: number; radius: number; color: string }) {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, length - radius * 2, 6, 12]} />
      <meshPhysicalMaterial color={color} roughness={0.5} clearcoat={0.3} />
      <Outlines thickness={0.008} color={ink} />
    </mesh>
  );
}

type Props = { pose: RefObject<Pose>; board?: boolean; snorkel?: boolean; backpack?: boolean };

export default function Zhao({ pose, board, snorkel, backpack }: Props) {
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const eyes = useRef<Group>(null);

  useFrame((state, dt) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    const p = pose.current;
    const k = Math.min(1, dt * 10);
    // target joint angles for each pose; everything eases toward them so poses blend
    let aL = 0.15,
      aR = -0.15,
      aLx = 0,
      aRx = 0,
      lL = 0,
      lR = 0,
      bodyX = 0,
      bodyY = 0,
      lift = 0,
      headY = 0,
      headX = 0;
    const s = Math.sin(t * 9);

    if (p === 'idle') {
      aL = 0.15 + Math.sin(t * 1.5) * 0.04;
      aR = -0.15 - Math.sin(t * 1.5) * 0.04;
      headY = state.pointer.x * 0.5;
      headX = -state.pointer.y * 0.2;
    } else if (p === 'wave') {
      aR = -2.6 + Math.sin(t * 10) * 0.35;
      headY = 0.2;
    } else if (p === 'dangle') {
      aL = 2.6;
      aR = -2.6;
      lL = Math.sin(t * 7) * 0.5;
      lR = -Math.sin(t * 7) * 0.5;
      lift = Math.sin(t * 3) * 0.03;
    } else if (p === 'walk') {
      lL = s * 0.6;
      lR = -s * 0.6;
      aLx = -s * 0.5;
      aRx = s * 0.5;
      lift = Math.abs(s) * 0.04;
    } else if (p === 'type') {
      lL = -1.5;
      lR = -1.5;
      aLx = -1.25 + Math.max(0, s) * 0.12;
      aRx = -1.25 + Math.max(0, -s) * 0.12;
      aL = 0.1;
      aR = -0.1;
      lift = -0.32;
      headX = 0.25 + Math.sin(t * 2) * 0.05;
    } else if (p === 'board') {
      aL = 1.3;
      aR = -1.3;
      lL = -0.35;
      lR = 0.35;
      bodyX = 0.15;
      lift = -0.06;
      headY = 0.9;
    } else if (p === 'swim') {
      bodyX = 1.35;
      aLx = Math.sin(t * 4) * 2.4;
      aRx = Math.sin(t * 4 + Math.PI) * 2.4;
      lL = Math.sin(t * 10) * 0.4;
      lR = -Math.sin(t * 10) * 0.4;
      headX = -1;
    } else if (p === 'climb') {
      const c = Math.sin(t * 3);
      aLx = -2.5 - c * 0.4;
      aRx = -2.5 + c * 0.4;
      lL = -0.6 - Math.max(0, c) * 0.5;
      lR = -0.6 - Math.max(0, -c) * 0.5;
      headX = -0.4;
    } else if (p === 'dance') {
      aL = 2.2 + Math.sin(t * 6) * 0.5;
      aR = -2.2 + Math.sin(t * 6 + 1) * 0.5;
      lL = Math.max(0, s) * 0.5;
      lR = Math.max(0, -s) * 0.5;
      bodyY = t * 3;
      lift = Math.abs(Math.sin(t * 6)) * 0.08;
    }

    armL.current!.rotation.z += (aL - armL.current!.rotation.z) * k;
    armR.current!.rotation.z += (aR - armR.current!.rotation.z) * k;
    armL.current!.rotation.x += (aLx - armL.current!.rotation.x) * k;
    armR.current!.rotation.x += (aRx - armR.current!.rotation.x) * k;
    legL.current!.rotation.x += (lL - legL.current!.rotation.x) * k;
    legR.current!.rotation.x += (lR - legR.current!.rotation.x) * k;
    head.current!.rotation.y += (headY - head.current!.rotation.y) * k;
    head.current!.rotation.x += (headX - head.current!.rotation.x) * k;
    body.current!.rotation.x += (bodyX - body.current!.rotation.x) * k;
    body.current!.position.y += (lift - body.current!.position.y) * k;
    if (p === 'dance') body.current!.rotation.y = bodyY;
    else body.current!.rotation.y += (0 - body.current!.rotation.y) * k;

    // blink every few seconds
    eyes.current!.scale.y = reduced || t % 3.7 > 0.12 ? 1 : 0.1;
  });

  return (
    <group ref={body}>
      {/* legs hang from the hips */}
      <group ref={legL} position={[-0.09, 0.42, 0]}>
        <Limb length={0.4} radius={0.07} color={trousers} />
        <mesh position={[0, -0.42, 0.04]}>
          <sphereGeometry args={[0.075, 16, 12]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
      <group ref={legR} position={[0.09, 0.42, 0]}>
        <Limb length={0.4} radius={0.07} color={trousers} />
        <mesh position={[0, -0.42, 0.04]}>
          <sphereGeometry args={[0.075, 16, 12]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>

      {/* torso: a capsule wrapped in puffer rings */}
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.17, 0.22, 8, 16]} />
        <meshPhysicalMaterial color={jacket} roughness={0.35} clearcoat={0.6} />
        <Outlines thickness={0.01} color={ink} />
      </mesh>
      <Puffer y={0.52} r={0.17} />
      <Puffer y={0.64} r={0.175} />
      <Puffer y={0.76} r={0.16} />

      {backpack && (
        <RoundedBox args={[0.26, 0.3, 0.12]} radius={0.04} position={[0, 0.66, -0.2]}>
          <meshPhysicalMaterial color="#fc9ac9" roughness={0.4} clearcoat={0.6} />
          <Outlines thickness={0.008} color={ink} />
        </RoundedBox>
      )}

      {/* arms pivot at the shoulders */}
      <group ref={armL} position={[-0.21, 0.8, 0]}>
        <Limb length={0.34} radius={0.06} color={jacket} />
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshPhysicalMaterial color={skin} roughness={0.6} />
        </mesh>
      </group>
      <group ref={armR} position={[0.21, 0.8, 0]}>
        <Limb length={0.34} radius={0.06} color={jacket} />
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshPhysicalMaterial color={skin} roughness={0.6} />
        </mesh>
      </group>

      <group ref={head} position={[0, 0.98, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 32, 24]} />
          <meshPhysicalMaterial color={skin} roughness={0.55} />
          <Outlines thickness={0.01} color={ink} />
        </mesh>
        {/* a bob with bangs: a back shell, a fringe and two side curtains */}
        <mesh position={[0, 0.04, -0.03]} scale={[1.08, 1.05, 1.06]}>
          <sphereGeometry args={[0.24, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshPhysicalMaterial color={hair} roughness={0.45} clearcoat={0.5} side={2} />
        </mesh>
        <mesh position={[0, 0.12, 0.17]} rotation={[0.5, 0, 0]} scale={[1, 0.4, 0.5]}>
          <sphereGeometry args={[0.2, 24, 16]} />
          <meshPhysicalMaterial color={hair} roughness={0.45} clearcoat={0.5} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.2, -0.08, 0.02]} scale={[0.35, 1, 0.8]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshPhysicalMaterial color={hair} roughness={0.45} clearcoat={0.5} />
          </mesh>
        ))}
        <group ref={eyes}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.085, 0.0, 0.215]}>
              <mesh scale={[0.8, 1.15, 0.5]}>
                <sphereGeometry args={[0.032, 12, 12]} />
                <meshBasicMaterial color="#1a1220" />
              </mesh>
              <mesh position={[0.01, 0.012, 0.015]}>
                <sphereGeometry args={[0.009, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
        </group>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.13, -0.07, 0.19]} rotation={[0, side * 0.5, 0]}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial color="#ff9fbf" transparent opacity={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0.225]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.028, 0.008, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#7a2a45" />
        </mesh>
        {snorkel && (
          <mesh position={[0, 0.02, 0.22]}>
            <torusGeometry args={[0.13, 0.025, 8, 24]} />
            <meshPhysicalMaterial color="#a5f0db" roughness={0.2} clearcoat={1} transparent opacity={0.85} />
          </mesh>
        )}
      </group>

      {board && <Board />}
    </group>
  );
}

function Board() {
  const ref = useRef<Mesh>(null);
  return (
    <RoundedBox ref={ref} args={[0.9, 0.04, 0.26]} radius={0.02} position={[0, 0.0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <meshPhysicalMaterial color="#fc9ac9" roughness={0.3} clearcoat={1} />
      <Outlines thickness={0.008} color={ink} />
    </RoundedBox>
  );
}
