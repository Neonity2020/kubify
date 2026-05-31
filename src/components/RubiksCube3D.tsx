import React, { useState, useEffect, useRef } from 'react';
import { type Cubie, type FaceType, type MoveType, isCubieInFace, DEFAULT_COLORS, mapPhysicalToRelative, mapPhysicalPosToRelative } from '../utils/cubeLogic';
import { Lock, Unlock, RotateCcw } from 'lucide-react';

interface RubiksCube3DProps {
  cubies: Cubie[];
  onMove: (move: MoveType) => void;
  animatingMove: MoveType | null;
  animationProgress: number; // 0 to 1
  theme: 'classic' | 'neon' | 'pastel' | 'glass';
  customColors?: typeof DEFAULT_COLORS;
  cubeRotation: { x: number; y: number };
  setCubeRotation: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  cubies,
  onMove,
  animatingMove,
  animationProgress,
  theme,
  customColors: _customColors = DEFAULT_COLORS,
  cubeRotation,
  setCubeRotation,
}) => {
  const [snapLockEnabled, setSnapLockEnabled] = useState(true);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const inertiaRef = useRef({ vx: 0, vy: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Swipe detection on cubies
  const activeTouch = useRef<{
    cubieId: number;
    face: FaceType;
    startX: number;
    startY: number;
  } | null>(null);

  // Dimensions
  const cubieSize = 64; // px
  const spacing = 66; // px (includes small gap)

  // Inertia simulation for background dragging with magnetic snapping support
  useEffect(() => {
    const updateInertia = () => {
      if (!isDragging.current) {
        const vx = inertiaRef.current.vx;
        const vy = inertiaRef.current.vy;
        const hasVelocity = Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05;

        if (hasVelocity) {
          setCubeRotation((prev) => {
            let nextX = prev.x + vy;
            nextX = Math.max(-85, Math.min(85, nextX));
            const nextY = prev.y + vx;

            // Apply friction
            inertiaRef.current.vx *= 0.92;
            inertiaRef.current.vy *= 0.92;

            return { x: nextX, y: nextY };
          });
        } else if (snapLockEnabled) {
          // Snap lock phase
          setCubeRotation((prev) => {
            // Snap X to nearest of -75, -50, -25, 0, 25, 50, 75
            const targetX = Math.max(-75, Math.min(75, Math.round(prev.x / 25) * 25));
            // Snap Y to nearest multiple of 45
            const targetY = Math.round(prev.y / 45) * 45;

            const diffX = targetX - prev.x;
            const diffY = targetY - prev.y;

            // If we are extremely close, snap directly to target
            if (Math.abs(diffX) < 0.08 && Math.abs(diffY) < 0.08) {
              return { x: targetX, y: targetY };
            }

            // Lerp towards target
            return {
              x: prev.x + diffX * 0.15,
              y: prev.y + diffY * 0.15,
            };
          });
        }
      }
      animationFrameId.current = requestAnimationFrame(updateInertia);
    };

    animationFrameId.current = requestAnimationFrame(updateInertia);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [snapLockEnabled]);

  // Background Drag Event Handlers
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // If we clicked on a cubie face, we don't start background dragging
    if ((e.target as HTMLElement).closest('.cubie-face')) return;

    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    inertiaRef.current = { vx: 0, vy: 0 };
  };

  const handleBackgroundMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Sensitivity factor
    const sens = 0.45;

    setCubeRotation((prev) => {
      let nextX = prev.x - deltaY * sens;
      nextX = Math.max(-85, Math.min(85, nextX));
      const nextY = prev.y + deltaX * sens;

      // Track instantaneous velocity per frame for inertia
      inertiaRef.current = {
        vx: deltaX * sens * 0.85,
        vy: -deltaY * sens * 0.85,
      };

      return { x: nextX, y: nextY };
    });
  };

  const handleBackgroundMouseUp = () => {
    isDragging.current = false;
  };

  // Touch handlers for mobile background rotate
  const handleBackgroundTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.cubie-face')) return;

    const touch = e.touches[0];
    isDragging.current = true;
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    inertiaRef.current = { vx: 0, vy: 0 };
  };

  const handleBackgroundTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    const sens = 0.45;

    setCubeRotation((prev) => {
      let nextX = prev.x - deltaY * sens;
      nextX = Math.max(-85, Math.min(85, nextX));
      const nextY = prev.y + deltaX * sens;

      inertiaRef.current = {
        vx: deltaX * sens * 0.85,
        vy: -deltaY * sens * 0.85,
      };

      return { x: nextX, y: nextY };
    });
  };

  const handleBackgroundTouchEnd = () => {
    isDragging.current = false;
  };


  // Refs to keep latest handler references to avoid stale closure bugs
  const mouseMoveHandlerRef = useRef(handleBackgroundMouseMove);
  const mouseUpHandlerRef = useRef(handleBackgroundMouseUp);
  const touchMoveHandlerRef = useRef(handleBackgroundTouchMove);
  const touchEndHandlerRef = useRef(handleBackgroundTouchEnd);

  useEffect(() => {
    mouseMoveHandlerRef.current = handleBackgroundMouseMove;
    mouseUpHandlerRef.current = handleBackgroundMouseUp;
    touchMoveHandlerRef.current = handleBackgroundTouchMove;
    touchEndHandlerRef.current = handleBackgroundTouchEnd;
  });

  // Add global event listeners for mouse move and mouse up during dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => mouseMoveHandlerRef.current(e);
    const onMouseUp = () => mouseUpHandlerRef.current();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => touchMoveHandlerRef.current(e);
    const onTouchEnd = () => touchEndHandlerRef.current();

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Cubie Face Interaction (Swipe Turns)
  const handleFaceStart = (cubieId: number, face: FaceType, clientX: number, clientY: number) => {
    if (animatingMove) return; // Ignore input during animations
    activeTouch.current = {
      cubieId,
      face,
      startX: clientX,
      startY: clientY,
    };
  };

  const handleFaceEnd = (clientX: number, clientY: number) => {
    if (!activeTouch.current) return;

    const { cubieId, face, startX, startY } = activeTouch.current;
    activeTouch.current = null;

    const dx = clientX - startX;
    const dy = clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) return; // Drag threshold

    // Determine primary drag direction (horizontal or vertical)
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    // Get the cubie that was dragged
    const cubie = cubies.find((c) => c.id === cubieId);
    if (!cubie) return;

    const relativePos = mapPhysicalPosToRelative(cubie.currentPos, cubeRotation.y);
    const relativeFace = mapPhysicalToRelative(face, cubeRotation.y);
    let targetFace: FaceType | null = null;
    let direction: 1 | -1 = 1;

    // Gesture interpretation based on which face was clicked (in screen-relative coordinates)
    if (relativeFace === 'F') {
      if (isHorizontal) {
        // Dragging left/right on Front face: U or D layer rotates
        targetFace = relativePos.y === 1 ? 'U' : relativePos.y === -1 ? 'D' : null;
        if (targetFace) {
          // Drag right on U: U move (CW looking from top is rotateY(-90), which is screen right to left... wait!)
          // Let's make it direct:
          // Drag right on U: moves top layer right visually, which is U' (CCW). Drag left: U (CW).
          // Drag right on D: moves bottom layer right visually, which is D (CW). Drag left: D' (CCW).
          if (targetFace === 'U') {
            direction = dx > 0 ? -1 : 1;
          } else {
            direction = dx > 0 ? 1 : -1;
          }
        }
      } else {
        // Dragging up/down on Front face: L or R layer rotates
        targetFace = relativePos.x === 1 ? 'R' : relativePos.x === -1 ? 'L' : null;
        if (targetFace) {
          // Drag up on R: R move (CW). Drag down: R' (CCW).
          // Drag up on L: L' move (CCW). Drag down: L (CW).
          if (targetFace === 'R') {
            direction = dy < 0 ? 1 : -1;
          } else {
            direction = dy < 0 ? -1 : 1;
          }
        }
      }
    } else if (relativeFace === 'R') {
      if (isHorizontal) {
        // Dragging left/right on Right face: U or D layer rotates
        targetFace = relativePos.y === 1 ? 'U' : relativePos.y === -1 ? 'D' : null;
        if (targetFace) {
          // Drag left on R-face U-layer: U move (CW). Drag right: U' (CCW).
          // Drag left on R-face D-layer: D' move (CCW). Drag right: D (CW).
          if (targetFace === 'U') {
            direction = dx < 0 ? 1 : -1;
          } else {
            direction = dx < 0 ? -1 : 1;
          }
        }
      } else {
        // Dragging up/down on Right face: F or B layer rotates
        targetFace = relativePos.z === 1 ? 'F' : relativePos.z === -1 ? 'B' : null;
        if (targetFace) {
          // Drag up on Front-Right column: F' (CCW). Drag down: F (CW).
          // Drag up on Back-Right column: B (CW). Drag down: B' (CCW).
          if (targetFace === 'F') {
            direction = dy < 0 ? -1 : 1;
          } else {
            direction = dy < 0 ? 1 : -1;
          }
        }
      }
    } else if (relativeFace === 'U') {
      // Top face drags:
      // X-drag can rotate F/B or L/R depending on rotation.
      // To make it simple and predictable, map horizontal swipe to Left/Right layer turns (R/L) and vertical to Front/Back (F/B)
      if (isHorizontal) {
        targetFace = relativePos.z === 1 ? 'F' : relativePos.z === -1 ? 'B' : null;
        if (targetFace) {
          direction = dx > 0 ? 1 : -1;
        }
      } else {
        targetFace = relativePos.x === 1 ? 'R' : relativePos.x === -1 ? 'L' : null;
        if (targetFace) {
          direction = dy < 0 ? 1 : -1;
        }
      }
    }

    if (targetFace) {
      onMove({ face: targetFace, direction });
    }
  };

  // Helper to determine sticker CSS color or class based on active theme
  const getStickerStyle = (colorCode: string | undefined, _face: FaceType) => {
    if (!colorCode) return { backgroundColor: '#111' };

    switch (theme) {
      case 'neon': {
        // Black sticker with thick glowing borders in the specific color
        return {
          backgroundColor: '#0a0a0a',
          border: `2px solid ${colorCode}`,
          boxShadow: `0 0 12px ${colorCode}, inset 0 0 6px ${colorCode}`,
        };
      }
      case 'pastel': {
        // Frosted glass effect with soft pastel colors
        // Adjust standard colors to pastel values
        const pastelMap: Record<string, string> = {
          '#ffffff': 'rgba(255, 255, 255, 0.85)', // White
          '#ffd500': 'rgba(255, 238, 140, 0.85)', // Light yellow
          '#d50000': 'rgba(255, 120, 120, 0.85)', // Soft red
          '#ff5800': 'rgba(255, 175, 120, 0.85)', // Soft orange
          '#0051ba': 'rgba(120, 180, 255, 0.85)', // Soft blue
          '#009b48': 'rgba(130, 235, 160, 0.85)', // Soft green
        };
        const c = pastelMap[colorCode] || colorCode;
        return {
          backgroundColor: c,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(4px)',
          borderRadius: '8px',
        };
      }
      case 'glass': {
        // High opacity glassmorphism
        const glassMap: Record<string, string> = {
          '#ffffff': 'rgba(255, 255, 255, 0.4)',
          '#ffd500': 'rgba(253, 224, 71, 0.4)',
          '#d50000': 'rgba(239, 68, 68, 0.4)',
          '#ff5800': 'rgba(249, 115, 22, 0.4)',
          '#0051ba': 'rgba(59, 130, 246, 0.4)',
          '#009b48': 'rgba(34, 197, 94, 0.4)',
        };
        const c = glassMap[colorCode] || colorCode;
        return {
          backgroundColor: c,
          border: `2px solid ${colorCode}`,
          boxShadow: `inset 0 0 8px rgba(255, 255, 255, 0.3)`,
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
        };
      }
      case 'classic':
      default: {
        // Classic speedcube stickers with thick black frames
        return {
          backgroundColor: colorCode,
          border: '1px solid rgba(0, 0, 0, 0.65)',
          borderRadius: '6px',
        };
      }
    }
  };

  return (
    <div
      className="relative flex items-center justify-center select-none outline-none overflow-visible w-full h-[360px] md:h-[450px]"
      onMouseDown={handleBackgroundMouseDown}
      onTouchStart={handleBackgroundTouchStart}
      style={{
        perspective: '1200px',
      }}
    >
      {/* Visual Instruction Indicator */}
      <div className="absolute top-2 text-sm text-muted-foreground hidden md:block">
        按住背景拖拽旋转视角 | 点击并划动魔方表面进行转面
      </div>

      {/* Main 3D Scene Wrapper */}
      <div
        className="relative cursor-grab active:cursor-grabbing transform-gpu"
        style={{
          width: `${cubieSize * 3}px`,
          height: `${cubieSize * 3}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`,
        }}
      >
        {/* Render the 27 Cubies */}
        {cubies.map((cubie) => {
          const { x, y, z } = cubie.currentPos;

          // Determine if this cubie is currently rotating
          const isRotating = animatingMove && isCubieInFace(cubie, animatingMove.face);

          // Get animation transform
          let rotationTransform = '';
          if (isRotating && animatingMove) {
            const face = animatingMove.face;
            const dir = animatingMove.direction;
            const targetAngle = 90 * dir;
            // Face factor for visual CW matching logical coordinate direction
            const factor = face === 'U' || face === 'L' || face === 'B' ? -1 : 1;
            const angle = targetAngle * factor * animationProgress;

            if (face === 'U' || face === 'D') {
              rotationTransform = `rotateY(${angle}deg)`;
            } else if (face === 'R' || face === 'L') {
              rotationTransform = `rotateX(${angle}deg)`;
            } else {
              rotationTransform = `rotateZ(${angle}deg)`;
            }
          }

          // Static positioning. Math Y positive is Up, CSS translation Y negative is Up.
          const positionTransform = `translate3d(${x * spacing}px, ${-y * spacing}px, ${z * spacing}px)`;

          // Combined transform: Rotation * Position
          // If we rotate a layer, we apply rotation *around center* first, then translate.
          // In CSS, transforms are applied right-to-left:
          // rotate(angle) translate3d(x, y, z) means we rotate the coordinate system, then translate along the rotated axes.
          // This creates the orbiting movement!
          const style: React.CSSProperties = {
            width: `${cubieSize}px`,
            height: `${cubieSize}px`,
            position: 'absolute',
            left: `${spacing}px`,
            top: `${spacing}px`,
            transformStyle: 'preserve-3d',
            transform: `${rotationTransform} ${positionTransform}`,
            // Smoother layer visual transitions if needed, but we handle steps frame-by-frame
          };

          return (
            <div key={cubie.id} className="cubie" style={style}>
              {/* Up Face */}
              {y === 1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateX(90deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.U, 'U'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'U', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'U', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Down Face */}
              {y === -1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateX(-90deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.D, 'D'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'D', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'D', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Right Face */}
              {x === 1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(90deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.R, 'R'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'R', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'R', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Left Face */}
              {x === -1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(-90deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.L, 'L'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'L', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'L', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Front Face */}
              {z === 1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(0deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.F, 'F'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'F', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'F', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Back Face */}
              {z === -1 && (
                <div
                  className="cubie-face absolute flex items-center justify-center p-[3px] select-none cursor-pointer"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(180deg) translateZ(${cubieSize / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.B, 'B'),
                  }}
                  onMouseDown={(e) => handleFaceStart(cubie.id, 'B', e.clientX, e.clientY)}
                  onMouseUp={(e) => handleFaceEnd(e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleFaceStart(cubie.id, 'B', touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    handleFaceEnd(touch.clientX, touch.clientY);
                  }}
                />
              )}

              {/* Internal plastic volume rendering (makes the cubies look solid rather than empty boxes) */}
              <div
                className="absolute bg-[#18181b] border border-[#27272a] opacity-80"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `translateZ(0px)`,
                  borderRadius: '2px',
                }}
              />
            </div>
          );
        })}

        {/* 3D Heads-Up Display (HUD) Face Labels */}
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-yellow-500/50 flex items-center justify-center text-xs font-black text-yellow-500 shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(0px, -145px, 0px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          U
        </div>
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-white/50 flex items-center justify-center text-xs font-black text-white shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(0px, 145px, 0px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          D
        </div>
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-red-500/50 flex items-center justify-center text-xs font-black text-red-500 shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(145px, 0px, 0px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {mapPhysicalToRelative('R', cubeRotation.y)}
        </div>
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-orange-500/50 flex items-center justify-center text-xs font-black text-orange-500 shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(-145px, 0px, 0px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {mapPhysicalToRelative('L', cubeRotation.y)}
        </div>
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-blue-500/50 flex items-center justify-center text-xs font-black text-blue-500 shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(0px, 0px, 145px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {mapPhysicalToRelative('F', cubeRotation.y)}
        </div>
        <div
          className="absolute w-7 h-7 rounded-full bg-zinc-950/90 border border-green-500/50 flex items-center justify-center text-xs font-black text-green-500 shadow-lg select-none pointer-events-none font-mono"
          style={{
            left: `${spacing}px`,
            top: `${spacing}px`,
            transform: `translate3d(0px, 0px, -145px) rotateY(${-cubeRotation.y}deg) rotateX(${-cubeRotation.x}deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {mapPhysicalToRelative('B', cubeRotation.y)}
        </div>
      </div>

      {/* Floating View Control Panel */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => {
            inertiaRef.current = { vx: 0, vy: 0 };
            setCubeRotation({ x: -30, y: 45 });
          }}
          className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/40 text-foreground hover:bg-zinc-800/80 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
          title="重置视角 (Reset View)"
        >
          <RotateCcw className="h-4.5 w-4.5 text-primary" />
        </button>
        <button
          onClick={() => setSnapLockEnabled(!snapLockEnabled)}
          className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer ${
            snapLockEnabled
              ? 'bg-primary/20 border-primary/45 text-primary hover:bg-primary/30'
              : 'bg-zinc-900/60 border-zinc-800/40 text-muted-foreground hover:bg-zinc-800/80'
          }`}
          title={snapLockEnabled ? "磁性对齐锁已启用" : "磁性对齐锁已禁用"}
        >
          {snapLockEnabled ? (
            <Lock className="h-4.5 w-4.5" />
          ) : (
            <Unlock className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
};
