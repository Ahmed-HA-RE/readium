'use client';

import { useEffect, useRef } from 'react';
import { cn } from 'cn';

type Vec3 = { x: number; y: number; z: number };

type Spark = Vec3 & {
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
};

const POINTS_PER_LINK = 2400;
const SPARK_COUNT = 80;

// A link is a stadium-shaped ring: two straight sides joined by half-circle ends, swept by a tube.
const HALF_STRAIGHT = 0.55;
const END_RADIUS = 0.38;
const TUBE_RADIUS = 0.09;
const LINK_OFFSET = 0.68;

// Half the angle cut out of the right link's left end, where it snapped.
const BREAK_HALF_ANGLE = 0.55;
const BREAK_POINT: Vec3 = {
  x: LINK_OFFSET - HALF_STRAIGHT - END_RADIUS,
  y: 0,
  z: 0,
};

const SPIN_SPEED = 0.35;
const TILT = 0.45;
const CAMERA_DISTANCE = 4;
const MAX_DEPTH = 1.7;

// Samples a link in its own XY plane; a broken one skips a slice of its left end.
const sampleLink = (broken: boolean) => {
  const points: Vec3[] = [];
  const endLength = Math.PI * END_RADIUS;
  const perimeter = 4 * HALF_STRAIGHT + 2 * endLength;

  while (points.length < POINTS_PER_LINK) {
    const s = Math.random() * perimeter;
    // A point on the centerline (cx, cy) and its outward normal (nx, ny).
    let cx: number, cy: number, nx: number, ny: number;

    if (s < 2 * HALF_STRAIGHT) {
      [cx, cy, nx, ny] = [s - HALF_STRAIGHT, END_RADIUS, 0, 1];
    } else if (s < 2 * HALF_STRAIGHT + endLength) {
      const angle = Math.PI / 2 - (s - 2 * HALF_STRAIGHT) / END_RADIUS;
      [nx, ny] = [Math.cos(angle), Math.sin(angle)];
      [cx, cy] = [HALF_STRAIGHT + END_RADIUS * nx, END_RADIUS * ny];
    } else if (s < 4 * HALF_STRAIGHT + endLength) {
      const along = s - 2 * HALF_STRAIGHT - endLength;
      [cx, cy, nx, ny] = [HALF_STRAIGHT - along, -END_RADIUS, 0, -1];
    } else {
      // From the bottom (-90°) round to the top (-270°); the leftmost point is at -180°.
      const angle =
        -Math.PI / 2 - (s - 4 * HALF_STRAIGHT - endLength) / END_RADIUS;
      if (broken && Math.abs(angle + Math.PI) < BREAK_HALF_ANGLE) continue;
      [nx, ny] = [Math.cos(angle), Math.sin(angle)];
      [cx, cy] = [-HALF_STRAIGHT + END_RADIUS * nx, END_RADIUS * ny];
    }

    // Around the tube, with some jitter in the radius for the grainy look.
    const phi = Math.random() * Math.PI * 2;
    const radius = TUBE_RADIUS * (0.8 + Math.random() * 0.4);
    points.push({
      x: cx + radius * Math.cos(phi) * nx,
      y: cy + radius * Math.cos(phi) * ny,
      z: radius * Math.sin(phi),
    });
  }

  return points;
};

// Two interlocked links, the right one perpendicular to the left (in the XZ plane), as in a chain.
const buildChain = () => [
  ...sampleLink(false).map(({ x, y, z }) => ({ x: x - LINK_OFFSET, y, z })),
  ...sampleLink(true).map(({ x, y, z }) => ({ x: x + LINK_OFFSET, y: z, z: y })),
];

// `stagger` starts a spark partway through its life, so the first frame isn't a single burst.
const spawnSpark = (stagger = false): Spark => {
  const theta = Math.random() * Math.PI * 2;
  const u = Math.random() * 2 - 1;
  const ring = Math.sqrt(1 - u * u);
  const speed = 0.15 + Math.random() * 0.45;
  const life = 0.6 + Math.random();
  const age = stagger ? Math.random() * life : 0;
  const [vx, vy, vz] = [
    ring * Math.cos(theta) * speed,
    u * speed,
    ring * Math.sin(theta) * speed,
  ];

  return {
    x: BREAK_POINT.x + vx * age,
    y: BREAK_POINT.y + vy * age,
    z: BREAK_POINT.z + vz * age,
    vx,
    vy,
    vz,
    age,
    life,
  };
};

// Dark mode's `--primary` is too dim to glow on the background; `--sidebar-primary` is the same hue, brighter.
const readColors = () => {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const sparkToken = root.classList.contains('dark')
    ? '--sidebar-primary'
    : '--primary';

  return {
    dot: styles.getPropertyValue('--foreground').trim(),
    spark: styles.getPropertyValue(sparkToken).trim(),
  };
};

// A snapped chain link drawn as a rotating cloud of dots, with sparks drifting from the break.
const BrokenLinkCanvas = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const chain = buildChain();
    const sparks = Array.from({ length: SPARK_COUNT }, () => spawnSpark(true));
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let colors = readColors();
    let size = 0;
    let time = 0.8;
    let frameId = 0;
    let lastTimestamp: number | null = null;

    const draw = () => {
      const spin = time * SPIN_SPEED;
      const [spinCos, spinSin] = [Math.cos(spin), Math.sin(spin)];
      const [tiltCos, tiltSin] = [Math.cos(TILT), Math.sin(TILT)];
      const scale = size / 4.4;
      const center = size / 2;

      // Spins around the vertical axis, tilts toward the viewer, then applies perspective.
      const project = ({ x, y, z }: Vec3) => {
        const spunX = x * spinCos + z * spinSin;
        const spunZ = -x * spinSin + z * spinCos;
        const tiltedY = y * tiltCos - spunZ * tiltSin;
        const depth = y * tiltSin + spunZ * tiltCos;
        const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - depth);

        return {
          screenX: center + spunX * scale * perspective,
          screenY: center - tiltedY * scale * perspective,
          nearness: Math.min(
            Math.max((depth + MAX_DEPTH) / (2 * MAX_DEPTH), 0),
            1,
          ),
        };
      };

      ctx.clearRect(0, 0, size, size);

      ctx.fillStyle = colors.dot;
      for (const point of chain) {
        const { screenX, screenY, nearness } = project(point);
        ctx.globalAlpha = 0.2 + 0.8 * nearness;
        ctx.fillRect(screenX, screenY, 1.5, 1.5);
      }

      ctx.fillStyle = colors.spark;
      for (const spark of sparks) {
        const { screenX, screenY } = project(spark);
        ctx.globalAlpha = 1 - spark.age / spark.life;
        ctx.fillRect(screenX - 1, screenY - 1, 2, 2);
      }

      ctx.globalAlpha = 1;
    };

    const updateSparks = (delta: number) => {
      for (const spark of sparks) {
        spark.age += delta;
        if (spark.age >= spark.life) {
          Object.assign(spark, spawnSpark());
          continue;
        }
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.z += spark.vz * delta;
      }
    };

    const tick = (timestamp: number) => {
      // Capped, so a tab coming back from the background doesn't jump ahead.
      const delta =
        lastTimestamp === null
          ? 0
          : Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;
      time += delta;
      updateSparks(delta);
      draw();
      frameId = requestAnimationFrame(tick);
    };

    const resize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      size = canvas.clientWidth;
      canvas.width = Math.round(size * pixelRatio);
      canvas.height = Math.round(size * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (reduceMotion) draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);


    const themeObserver = new MutationObserver(() => {
      colors = readColors();
      if (reduceMotion) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    resize();
    if (!reduceMotion) frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className={cn('aspect-square', className)}
    />
  );
};

export default BrokenLinkCanvas;
