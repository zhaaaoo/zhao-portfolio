import { useRef, type ReactNode, type Ref, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines, RoundedBox } from '@react-three/drei';
import { Shape, type Group } from 'three';
import { beats } from './sound';

export type Pose =
  | 'idle'
  | 'dangle'
  | 'walk'
  | 'type'
  | 'board'
  | 'swim'
  | 'climb'
  | 'dance'
  | 'wave'
  | 'cheer'
  | 'selfie'
  | 'chalk'
  | 'tuck';

export type Outfit = 'none' | 'work' | 'snow' | 'dive' | 'hike' | 'dance';

const skin = '#ffd9c4';
const hair = '#2f2226';
const ink = '#1b1743';

const looks: Record<Outfit, { jacket: string; legs: string; puffer: boolean }> = {
  none: { jacket: '#2b2733', legs: '#cdb38a', puffer: true },
  work: { jacket: '#2b2733', legs: '#cdb38a', puffer: true },
  snow: { jacket: '#fc9ac9', legs: '#cbbcfc', puffer: true },
  dive: { jacket: '#4b3fc4', legs: '#4b3fc4', puffer: false },
  hike: { jacket: '#a5f0db', legs: '#cdb38a', puffer: false },
  dance: { jacket: '#cbbcfc', legs: '#2b2733', puffer: true },
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const heart = new Shape();
heart.moveTo(0, -0.5);
heart.bezierCurveTo(-0.1, -0.35, -0.6, -0.1, -0.5, 0.2);
heart.bezierCurveTo(-0.42, 0.5, -0.05, 0.5, 0, 0.25);
heart.bezierCurveTo(0.05, 0.5, 0.42, 0.5, 0.5, 0.2);
heart.bezierCurveTo(0.6, -0.1, 0.1, -0.35, 0, -0.5);

function Gloss({ color, rough = 0.45, coat = 0.4 }: { color: string; rough?: number; coat?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={coat} clearcoatRoughness={0.3} />;
}

function Limb({ length, radius, color }: { length: number; radius: number; color: string }) {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, length - radius * 2, 6, 12]} />
      <Gloss color={color} />
      <Outlines thickness={0.008} color={ink} />
    </mesh>
  );
}

function Leg({ ref, x, outfit }: { ref: Ref<Group>; x: number; outfit: Outfit }) {
  return (
    <group ref={ref} position={[x, 0.42, 0]}>
      <Limb length={0.4} radius={0.07} color={looks[outfit].legs} />
      <mesh position={[0, -0.42, 0.04]} scale={[1, 0.8, 1.25]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <Gloss color={outfit === 'snow' ? '#2b2733' : '#ffffff'} />
      </mesh>
      {outfit === 'dive' && (
        <RoundedBox args={[0.15, 0.025, 0.32]} radius={0.01} position={[0, -0.45, 0.17]}>
          <Gloss color="#fbe48d" coat={1} />
        </RoundedBox>
      )}
    </group>
  );
}

function Arm({ ref, x, outfit, children }: { ref: Ref<Group>; x: number; outfit: Outfit; children?: ReactNode }) {
  return (
    <group ref={ref} position={[x, 0.82, 0]}>
      <Limb length={0.34} radius={0.06} color={looks[outfit].jacket} />
      <mesh position={[0, -0.36, 0]}>
        <sphereGeometry args={[outfit === 'snow' ? 0.07 : 0.05, 12, 12]} />
        <Gloss color={outfit === 'snow' ? '#a5f0db' : skin} rough={0.6} />
      </mesh>
      {children}
    </group>
  );
}

type Props = { pose: RefObject<Pose>; outfit: Outfit };

export default function Zhao({ pose, outfit }: Props) {
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const phone = useRef<Group>(null);
  const look = looks[outfit];

  useFrame((state, dt) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    const p = pose.current;
    // targets per pose: spread lifts an arm or leg out sideways, fwd swings it forward
    let spreadL = 0.18,
      spreadR = 0.18,
      fwdL = 0,
      fwdR = 0,
      legFL = 0,
      legFR = 0,
      legS = 0,
      bodyX = 0,
      bodyY = 0,
      bodyZ = 0,
      lift = 0,
      headX = 0,
      headY = 0,
      headZ = 0,
      snap = false,
      spin = false;
    const s = Math.sin(t * 9);

    if (p === 'idle') {
      spreadL = spreadR = 0.18 + Math.sin(t * 1.5) * 0.04;
      headY = state.pointer.x * 0.5;
      headX = -state.pointer.y * 0.2;
    } else if (p === 'wave') {
      spreadR = 2.6 + Math.sin(t * 10) * 0.35;
      headZ = -0.15;
    } else if (p === 'dangle') {
      spreadL = spreadR = 2.5;
      legFL = Math.sin(t * 7) * 0.5;
      legFR = -legFL;
      lift = Math.sin(t * 3) * 0.03;
    } else if (p === 'walk') {
      legFL = s * 0.6;
      legFR = -legFL;
      fwdL = -s * 0.5;
      fwdR = s * 0.5;
      lift = Math.abs(s) * 0.04;
    } else if (p === 'type') {
      legFL = legFR = 1.5;
      fwdL = 1.0 + Math.max(0, s) * 0.12;
      fwdR = 1.0 + Math.max(0, -s) * 0.12;
      spreadL = spreadR = -0.12;
      lift = -0.32;
      headX = 0.28 + Math.sin(t * 2) * 0.05;
      headZ = Math.sin(t * 2.1) * 0.08;
    } else if (p === 'board') {
      spreadL = 1.1 + Math.sin(t * 2) * 0.15;
      spreadR = 1.1 - Math.sin(t * 2) * 0.15;
      legS = 0.28;
      lift = -0.06;
      headY = 0.9;
    } else if (p === 'swim') {
      bodyX = 1.35;
      fwdL = 2.4 + Math.sin(t * 4) * 0.5;
      fwdR = fwdL;
      spreadL = spreadR = 0.4 + Math.sin(t * 4) * 0.6;
      legFL = Math.sin(t * 10) * 0.4;
      legFR = -legFL;
      headX = -1;
    } else if (p === 'climb') {
      const c = Math.sin(t * 3);
      fwdL = 2.5 + c * 0.4;
      fwdR = 2.5 - c * 0.4;
      spreadL = spreadR = 0.35;
      legFL = 0.6 + Math.max(0, c) * 0.5;
      legFR = 0.6 + Math.max(0, -c) * 0.5;
      legS = 0.2;
      headX = -0.4;
    } else if (p === 'tuck') {
      legFL = legFR = 1.3;
      fwdL = fwdR = 1.1;
      spreadL = spreadR = 0.3;
      headX = 0.3;
    } else if (p === 'cheer') {
      const pump = Math.max(0, Math.sin(t * 8));
      spreadL = spreadR = 2.4 + pump * 0.35;
      lift = Math.abs(Math.sin(t * 4)) * 0.12;
      headX = -0.2;
    } else if (p === 'selfie') {
      fwdR = 1.9;
      spreadR = 0.35;
      spreadL = 2.75;
      headZ = 0.25;
      headX = -0.15;
    } else if (p === 'chalk') {
      fwdL = fwdR = 0.9 + Math.sin(t * 14) * 0.08;
      spreadL = spreadR = -0.45;
      headX = 0.35;
    } else if (p === 'dance') {
      const b = reduced ? 0 : beats();
      const beat = Math.floor(b);
      const ph = b - beat;
      const hit = Math.exp(-ph * 5);
      const side = beat % 2 ? 1 : -1;
      snap = true;
      lift = hit * 0.05;
      switch (Math.floor(b / 8) % 4) {
        case 0:
          // the griddy: heel taps, arms swinging the other way
          legFL = side > 0 ? 0.7 * hit : -0.1;
          legFR = side < 0 ? 0.7 * hit : -0.1;
          fwdL = side * 0.9;
          fwdR = -side * 0.9;
          spreadL = spreadR = 0.25;
          bodyX = 0.18;
          break;
        case 1: {
          // the floss
          const f = Math.sin(b * Math.PI);
          spreadL = 0.3 + f * 0.45;
          spreadR = 0.3 - f * 0.45;
          fwdL = f > 0 ? 0.6 : -0.6;
          fwdR = -fwdL;
          bodyZ = -f * 0.22;
          break;
        }
        case 2:
          // shoulder shimmy, with a hair flip on the last beat
          spreadL = spreadR = 0.9;
          fwdL = fwdR = 0.6;
          bodyY = Math.sin(b * Math.PI * 4) * 0.22;
          headZ = Math.sin(b * Math.PI) * 0.25;
          if (beat % 8 === 7) headX = -0.7 * Math.sin(ph * Math.PI);
          break;
        default:
          if (b % 32 >= 30) {
            // close the phrase with a jump spin
            const u = (b % 32 - 30) / 2;
            bodyY = u * Math.PI * 2;
            spin = true;
            lift = Math.sin(u * Math.PI) * 0.25;
            spreadL = spreadR = 2.4;
          } else if (side > 0) {
            // the dab, ironically
            spreadL = 2.1;
            fwdL = 0.3;
            fwdR = 1.9;
            spreadR = -0.9;
            headX = 0.45;
            headY = 0.5;
          } else {
            spreadL = spreadR = 0.7;
            fwdL = fwdR = -0.3;
            bodyZ = 0.18;
            headZ = -0.2;
          }
      }
    }

    const k = Math.min(1, dt * (snap ? 18 : 10));
    const ease = (o: { x: number; y: number; z: number }, key: 'x' | 'y' | 'z', to: number) => (o[key] += (to - o[key]) * k);
    ease(armL.current!.rotation, 'z', -spreadL);
    ease(armR.current!.rotation, 'z', spreadR);
    ease(armL.current!.rotation, 'x', -fwdL);
    ease(armR.current!.rotation, 'x', -fwdR);
    ease(legL.current!.rotation, 'x', -legFL);
    ease(legR.current!.rotation, 'x', -legFR);
    ease(legL.current!.rotation, 'z', -legS);
    ease(legR.current!.rotation, 'z', legS);
    ease(head.current!.rotation, 'x', headX);
    ease(head.current!.rotation, 'y', headY);
    ease(head.current!.rotation, 'z', headZ);
    ease(body.current!.rotation, 'x', bodyX);
    ease(body.current!.rotation, 'z', bodyZ);
    ease(body.current!.position, 'y', lift);
    const r = body.current!.rotation;
    if (spin) r.y = bodyY;
    else {
      // unwind any leftover spin the short way round
      r.y = Math.atan2(Math.sin(r.y), Math.cos(r.y));
      ease(r, 'y', bodyY);
    }

    eyes.current!.scale.y = reduced || t % 3.7 > 0.12 ? 1 : 0.1;
    if (phone.current) phone.current.visible = p === 'selfie';
  });

  return (
    <group ref={body}>
      {/* legs hang from the hips */}
      <Leg ref={legL} x={-0.09} outfit={outfit} />
      <Leg ref={legR} x={0.09} outfit={outfit} />

      {/* torso: one soft capsule; quilting seams make it a puffer */}
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.19, 0.2, 8, 20]} />
        <Gloss color={look.jacket} rough={0.35} coat={look.puffer ? 0.7 : 0.2} />
        <Outlines thickness={0.01} color={ink} />
      </mesh>
      {look.puffer &&
        [0.5, 0.64, 0.78].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.016, 8, 32]} />
            <meshStandardMaterial color={ink} transparent opacity={0.35} />
          </mesh>
        ))}
      {outfit === 'dive' && (
        <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.02, 8, 32]} />
          <Gloss color="#fc9ac9" />
        </mesh>
      )}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.04, 10, 24]} />
        <Gloss color={look.jacket} />
      </mesh>

      {outfit === 'hike' && (
        <RoundedBox args={[0.28, 0.34, 0.14]} radius={0.05} position={[0, 0.66, -0.24]}>
          <Gloss color="#fc9ac9" coat={0.7} />
          <Outlines thickness={0.008} color={ink} />
        </RoundedBox>
      )}

      {/* arms pivot at the shoulders */}
      <Arm ref={armL} x={-0.25} outfit={outfit} />
      <Arm ref={armR} x={0.25} outfit={outfit}>
        {outfit === 'hike' && (
          <group ref={phone} position={[0, -0.4, 0.04]} rotation={[-1.6, 0, 0]}>
            <RoundedBox args={[0.1, 0.18, 0.015]} radius={0.007}>
              <Gloss color="#fc9ac9" coat={1} />
            </RoundedBox>
          </group>
        )}
      </Arm>

      <group ref={head} position={[0, 0.99, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 32, 24]} />
          <meshPhysicalMaterial color={skin} roughness={0.55} sheen={0.4} sheenColor="#ffc7d6" />
          <Outlines thickness={0.01} color={ink} />
        </mesh>
        {/* a bob with bangs: a back shell, a fringe and two side curtains */}
        <mesh position={[0, 0.04, -0.03]} scale={[1.08, 1.05, 1.06]}>
          <sphereGeometry args={[0.24, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshPhysicalMaterial color={hair} roughness={0.4} clearcoat={0.6} side={2} />
        </mesh>
        <mesh position={[0, 0.12, 0.17]} rotation={[0.5, 0, 0]} scale={[1, 0.4, 0.5]}>
          <sphereGeometry args={[0.2, 24, 16]} />
          <meshPhysicalMaterial color={hair} roughness={0.4} clearcoat={0.6} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.2, -0.08, 0.02]} scale={[0.35, 1, 0.8]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshPhysicalMaterial color={hair} roughness={0.4} clearcoat={0.6} />
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
        <Gear outfit={outfit} />
      </group>

      {outfit === 'snow' && (
        <RoundedBox args={[1.0, 0.045, 0.28]} radius={0.02} position={[0, -0.07, 0.03]}>
          <meshPhysicalMaterial color="#fc9ac9" roughness={0.25} clearcoat={1} iridescence={0.6} />
          <Outlines thickness={0.008} color={ink} />
        </RoundedBox>
      )}
    </group>
  );
}

// headwear per outfit, in head space
function Gear({ outfit }: { outfit: Outfit }) {
  if (outfit === 'snow')
    return (
      <>
        <mesh position={[0, 0.05, -0.01]}>
          <sphereGeometry args={[0.275, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <Gloss color="#a5f0db" rough={0.25} coat={1} />
          <Outlines thickness={0.01} color={ink} />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.255, 0.022, 8, 32]} />
          <Gloss color={ink} />
        </mesh>
        <RoundedBox args={[0.34, 0.12, 0.08]} radius={0.04} position={[0, 0.07, 0.22]}>
          <meshPhysicalMaterial color="#ffb86b" metalness={0.9} roughness={0.08} iridescence={1} iridescenceIOR={1.8} />
          <Outlines thickness={0.008} color={ink} />
        </RoundedBox>
      </>
    );
  if (outfit === 'dive')
    return (
      <>
        <RoundedBox args={[0.32, 0.15, 0.08]} radius={0.04} position={[0, 0.03, 0.22]}>
          <meshPhysicalMaterial color="#c9f1ff" transparent opacity={0.55} roughness={0.05} clearcoat={1} />
          <Outlines thickness={0.012} color="#fc9ac9" />
        </RoundedBox>
        <mesh position={[0.24, 0.12, 0.05]}>
          <cylinderGeometry args={[0.025, 0.025, 0.42, 10]} />
          <Gloss color="#fbe48d" coat={1} />
        </mesh>
      </>
    );
  if (outfit === 'hike')
    return (
      <group position={[0, 0.16, -0.01]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.14, 24]} />
          <Gloss color="#fbe48d" rough={0.8} coat={0} />
          <Outlines thickness={0.008} color={ink} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.27, 0.36, 0.05, 28]} />
          <Gloss color="#fbe48d" rough={0.8} coat={0} />
        </mesh>
      </group>
    );
  if (outfit === 'work')
    return (
      <>
        <mesh position={[0, 0.02, -0.01]}>
          <torusGeometry args={[0.27, 0.025, 8, 24, Math.PI]} />
          <Gloss color="#a5f0db" coat={1} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.27, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.07, 20]} />
            <Gloss color="#fc9ac9" coat={1} />
            <Outlines thickness={0.008} color={ink} />
          </mesh>
        ))}
      </>
    );
  if (outfit === 'dance')
    return (
      <group position={[0, 0.02, 0.24]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.09, 0, 0]} scale={0.14}>
            <shapeGeometry args={[heart, 12]} />
            <meshPhysicalMaterial color="#ff4f9a" roughness={0.1} clearcoat={1} side={2} />
          </mesh>
        ))}
        <mesh position={[0, 0.01, -0.005]}>
          <boxGeometry args={[0.06, 0.012, 0.01]} />
          <meshBasicMaterial color="#ff4f9a" />
        </mesh>
      </group>
    );
  return null;
}
