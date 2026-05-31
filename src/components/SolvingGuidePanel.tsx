import React, { useState, useEffect } from 'react';
import { LBL_STEPS, type GuideAlgorithm, getStepTargetState } from '../utils/solvingGuide';
import { ChevronLeft, ChevronRight, Play, Award, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { type MoveType, type Cubie, DEFAULT_COLORS } from '../utils/cubeLogic';

interface SolvingGuidePanelProps {
  onPlayAlgorithm: (moves: MoveType[]) => void;
  isQueueAnimating: boolean;
  onResetCube: (stepId: number) => void;
  onAISolveStep: (stepId: number) => void;
  theme: 'classic' | 'neon' | 'pastel' | 'glass';
  customColors?: typeof DEFAULT_COLORS;
}

// Subcomponent to render a slowly spinning 3D preview of the step's goal state
const MiniCubePreview: React.FC<{
  cubies: Cubie[];
  theme: 'classic' | 'neon' | 'pastel' | 'glass';
}> = ({ cubies, theme }) => {
  const [angle, setAngle] = useState(45);
  
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setAngle((a) => (a + 0.5) % 360);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const size = 20; // px per cubie
  const spacing = 21; // px spacing

  const getStickerStyle = (colorCode: string | undefined) => {
    if (!colorCode) return { backgroundColor: '#111' };
    
    // Check if it's the unsolved indicator grey
    const isUnsolved = colorCode === '#27272a';

    if (isUnsolved) {
      return {
        backgroundColor: '#27272a',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '3px',
      };
    }

    switch (theme) {
      case 'neon': {
        return {
          backgroundColor: '#0a0a0a',
          border: `1.5px solid ${colorCode}`,
          boxShadow: `0 0 6px ${colorCode}, inset 0 0 3px ${colorCode}`,
        };
      }
      case 'pastel': {
        const pastelMap: Record<string, string> = {
          '#ffffff': 'rgba(255, 255, 255, 0.85)',
          '#ffd500': 'rgba(255, 238, 140, 0.85)',
          '#d50000': 'rgba(255, 120, 120, 0.85)',
          '#ff5800': 'rgba(255, 175, 120, 0.85)',
          '#0051ba': 'rgba(120, 180, 255, 0.85)',
          '#009b48': 'rgba(130, 235, 160, 0.85)',
        };
        const c = pastelMap[colorCode] || colorCode;
        return {
          backgroundColor: c,
          border: '0.5px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '4px',
        };
      }
      case 'glass': {
        const glassMap: Record<string, string> = {
          '#ffffff': 'rgba(255, 255, 255, 0.35)',
          '#ffd500': 'rgba(253, 224, 71, 0.35)',
          '#d50000': 'rgba(239, 68, 68, 0.35)',
          '#ff5800': 'rgba(249, 115, 22, 0.35)',
          '#0051ba': 'rgba(59, 130, 246, 0.35)',
          '#009b48': 'rgba(34, 197, 94, 0.35)',
        };
        const c = glassMap[colorCode] || colorCode;
        return {
          backgroundColor: c,
          border: `1.5px solid ${colorCode}`,
          boxShadow: `inset 0 0 4px rgba(255, 255, 255, 0.2)`,
          borderRadius: '5px',
        };
      }
      case 'classic':
      default: {
        return {
          backgroundColor: colorCode,
          border: '1px solid rgba(0, 0, 0, 0.6)',
          borderRadius: '3px',
        };
      }
    }
  };

  return (
    <div
      className="relative flex items-center justify-center select-none overflow-visible w-full h-[120px] bg-secondary/10 border border-border/10 rounded-xl py-2"
      style={{ perspective: '300px' }}
    >
      <span className="absolute top-2 left-3 text-[10px] font-bold text-muted-foreground uppercase">
        目标效果 (Target Preview)
      </span>
      <div
        className="relative transform-gpu"
        style={{
          width: `${size * 3}px`,
          height: `${size * 3}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(-22deg) rotateY(${angle}deg)`,
        }}
      >
        {cubies.map((cubie) => {
          const { x, y, z } = cubie.currentPos;
          const positionTransform = `translate3d(${x * spacing}px, ${-y * spacing}px, ${z * spacing}px)`;

          return (
            <div
              key={cubie.id}
              className="absolute"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${spacing}px`,
                top: `${spacing}px`,
                transformStyle: 'preserve-3d',
                transform: positionTransform,
              }}
            >
              {/* Up Face */}
              {y === 1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateX(90deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.U),
                  }}
                />
              )}
              {/* Down Face */}
              {y === -1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.D),
                  }}
                />
              )}
              {/* Right Face */}
              {x === 1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(90deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.R),
                  }}
                />
              )}
              {/* Left Face */}
              {x === -1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.L),
                  }}
                />
              )}
              {/* Front Face */}
              {z === 1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(0deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.F),
                  }}
                />
              )}
              {/* Back Face */}
              {z === -1 && (
                <div
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotateY(180deg) translateZ(${size / 2}px)`,
                    backfaceVisibility: 'hidden',
                    ...getStickerStyle(cubie.colors.B),
                  }}
                />
              )}
              {/* Internal block spacer */}
              <div
                className="absolute bg-[#18181b]/90 border border-zinc-900/30"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: 'translateZ(0px)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SolvingGuidePanel: React.FC<SolvingGuidePanelProps> = ({
  onPlayAlgorithm,
  isQueueAnimating,
  onResetCube,
  onAISolveStep,
  theme,
  customColors = DEFAULT_COLORS,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = LBL_STEPS[currentStepIndex];

  const handlePrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(LBL_STEPS.length - 1, prev + 1));
  };

  const handlePlayAlgorithm = (algo: GuideAlgorithm) => {
    if (isQueueAnimating) return;
    onPlayAlgorithm(algo.moves);
  };

  // Generate target preview cubies list for the current step
  const targetCubies = getStepTargetState(currentStep.id, customColors);

  return (
    <div className="flex flex-col h-full p-5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-3">
        <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          层先法还原指南 (Beginner Guide)
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-secondary/35 hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-secondary/35 transition-all"
            title="上一步"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="text-xs font-semibold px-2">
            {currentStepIndex + 1} / {LBL_STEPS.length}
          </span>
          <button
            onClick={handleNextStep}
            disabled={currentStepIndex === LBL_STEPS.length - 1}
            className="p-1.5 rounded-lg bg-secondary/35 hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-secondary/35 transition-all"
            title="下一步"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        <div>
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase block mb-1">
            步骤 {currentStep.id}
          </span>
          <h4 className="text-base font-extrabold text-foreground">{currentStep.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{currentStep.subtitle}</p>
        </div>

        {/* 3D Target State Preview (Effect Diagram) */}
        <MiniCubePreview cubies={targetCubies} theme={theme} />

        {/* Step Description */}
        <div className="p-3.5 rounded-xl bg-secondary/15 border border-border/20 text-xs md:text-sm leading-relaxed text-muted-foreground">
          {currentStep.description}
        </div>

        {/* Algorithms Section */}
        {currentStep.algorithms.length > 0 && (
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              公式动作演示
            </h5>
            <div className="space-y-2">
              {currentStep.algorithms.map((algo, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-secondary/25 border border-border/30 hover:border-primary/35 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{algo.name}</span>
                      <span className="font-mono text-xs font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                        {algo.notation}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {algo.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlayAlgorithm(algo)}
                    disabled={isQueueAnimating}
                    className="self-end md:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:hover:bg-primary transition-all shrink-0 shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    演示公式
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        {currentStep.tips.length > 0 && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <Lightbulb className="h-4 w-4" />
              提分秘籍 / 操作要领
            </div>
            <ul className="list-disc list-inside text-[11px] md:text-xs text-muted-foreground space-y-1 pl-1">
              {currentStep.tips.map((tip, i) => (
                <li key={i} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Guide Reset & AI Solve Actions */}
      <div className="mt-4 pt-3 border-t border-border/20 flex gap-2">
        <button
          onClick={() => onResetCube(currentStep.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-secondary/30 text-secondary-foreground hover:bg-secondary/50 border border-border/30 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重置魔方练习
        </button>
        <button
          onClick={() => onAISolveStep(currentStep.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-all cursor-pointer"
          title="AI 自动完成当前步骤"
        >
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          AI一键还原
        </button>
      </div>
    </div>
  );
};
