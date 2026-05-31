import React, { useState } from 'react';
import { type FaceType, type MoveType, DEFAULT_COLORS } from '../utils/cubeLogic';

import { soundEffects } from '../utils/soundEffects';
import { Volume2, VolumeX, Shuffle, RotateCcw, Palette, Gamepad2, Timer as TimerIcon, Compass } from 'lucide-react';

interface ControlPanelProps {
  onMove: (move: MoveType) => void;
  onScramble: () => void;
  onReset: () => void;
  mode: 'practice' | 'timer' | 'guide';
  setMode: (mode: 'practice' | 'timer' | 'guide') => void;
  theme: 'classic' | 'neon' | 'pastel' | 'glass';
  setTheme: (theme: 'classic' | 'neon' | 'pastel' | 'glass') => void;
  customColors: typeof DEFAULT_COLORS;
  onUpdateColors: (colors: typeof DEFAULT_COLORS) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onMove,
  onScramble,
  onReset,
  mode,
  setMode,
  theme,
  setTheme,
  customColors,
  onUpdateColors,
}) => {
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toggleMute = () => {
    const nextMute = !isMuted;
    soundEffects.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  const handleManualMove = (face: FaceType, direction: 1 | -1) => {
    onMove({ face, direction });
  };

  // Preset Palettes for the color pickers
  const palettes = [
    {
      name: '官方标准 (Standard)',
      colors: DEFAULT_COLORS,
    },
    {
      name: '极光霓虹 (Cyber Neon)',
      colors: {
        U: '#00ffff', // Cyan
        D: '#ff00ff', // Magenta
        R: '#ff3366', // Hot pink
        L: '#ffaa00', // Neon orange
        F: '#33ff33', // Neon green
        B: '#3333ff', // Deep blue
      },
    },
    {
      name: '柔和马卡龙 (Macaron)',
      colors: {
        U: '#f8fafc', // Soft white
        D: '#fef08a', // Pale yellow
        R: '#fca5a5', // Pale red
        L: '#fed7aa', // Pale orange
        F: '#93c5fd', // Pale blue
        B: '#86efac', // Pale green
      },
    },
    {
      name: '复古赛车 (Retro Racing)',
      colors: {
        U: '#e2e8f0', // Cool grey
        D: '#eab308', // Dark yellow
        R: '#991b1b', // Wine red
        L: '#c2410c', // Rust orange
        F: '#1e3a8a', // Navy blue
        B: '#14532d', // Forest green
      },
    },
  ];

  const handleColorChange = (face: keyof typeof DEFAULT_COLORS, value: string) => {
    onUpdateColors({
      ...customColors,
      [face]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md h-full">
      {/* Mode Selector */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          选择模式 (Play Mode)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode('practice')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all gap-1 ${
              mode === 'practice'
                ? 'bg-primary/10 border-primary/45 text-primary'
                : 'bg-secondary/20 border-transparent text-muted-foreground hover:bg-secondary/40'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            自主练习
          </button>
          <button
            onClick={() => setMode('timer')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all gap-1 ${
              mode === 'timer'
                ? 'bg-primary/10 border-primary/45 text-primary'
                : 'bg-secondary/20 border-transparent text-muted-foreground hover:bg-secondary/40'
            }`}
          >
            <TimerIcon className="h-4 w-4" />
            速度竞时
          </button>
          <button
            onClick={() => setMode('guide')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all gap-1 ${
              mode === 'guide'
                ? 'bg-primary/10 border-primary/45 text-primary'
                : 'bg-secondary/20 border-transparent text-muted-foreground hover:bg-secondary/40'
            }`}
          >
            <Compass className="h-4 w-4" />
            还原指南
          </button>
        </div>
      </div>

      {/* Style & Audio Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            主题皮肤
          </h4>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="w-full text-xs font-bold bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-all"
          >
            <option value="classic">经典原色 (Classic)</option>
            <option value="neon">赛博霓虹 (Cyber Neon)</option>
            <option value="pastel">柔和果冻 (Pastel)</option>
            <option value="glass">水晶磨砂 (Glass)</option>
          </select>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            音效设置
          </h4>
          <button
            onClick={toggleMute}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isMuted
                ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                : 'bg-secondary/30 border-border/30 text-foreground hover:bg-secondary/50'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4.5 w-4.5" />
                已静音
              </>
            ) : (
              <>
                <Volume2 className="h-4.5 w-4.5 text-primary" />
                转动音效
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          魔方操作
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onScramble}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
          >
            <Shuffle className="h-4 w-4" />
            快速打乱
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-secondary/35 text-secondary-foreground hover:bg-secondary/60 border border-border/20 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            重置魔方
          </button>
        </div>
      </div>

      {/* Manual Turn Buttons */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            手动转动 (Manual Controls)
          </h4>
          <span className="text-[10px] text-muted-foreground font-semibold">支持键盘对应键</span>
        </div>
        <div className="grid grid-cols-6 gap-1 text-center font-mono">
          {(['U', 'D', 'R', 'L', 'F', 'B'] as FaceType[]).map((face) => (
            <div key={face} className="flex flex-col gap-1">
              <button
                onClick={() => handleManualMove(face, 1)}
                className="py-1.5 rounded-lg bg-secondary/25 border border-border/20 text-xs font-extrabold hover:bg-primary/20 hover:border-primary/30 transition-all text-foreground"
                title={`${face} 顺时针旋转`}
              >
                {face}
              </button>
              <button
                onClick={() => handleManualMove(face, -1)}
                className="py-1.5 rounded-lg bg-secondary/15 border border-border/15 text-[10px] font-bold hover:bg-primary/10 hover:border-primary/25 transition-all text-muted-foreground"
                title={`${face}' 逆时针旋转`}
              >
                {face}'
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Color Palette Picker */}
      <div className="border-t border-border/20 pt-3">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center justify-between w-full text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="h-4.5 w-4.5 text-primary" />
            配色自定义工具 (Color Customizer)
          </span>
          <span className="text-[10px] font-semibold underline">
            {showColorPicker ? '收起' : '展开'}
          </span>
        </button>

        {showColorPicker && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
            {/* Palette Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                配色预设
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {palettes.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdateColors(p.colors)}
                    className="p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 text-[10px] font-bold text-left border border-border/10 flex flex-col gap-1"
                  >
                    <span>{p.name}</span>
                    <div className="flex gap-0.5">
                      {Object.values(p.colors).map((c, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full border border-black/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Pickers */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DEFAULT_COLORS) as Array<keyof typeof DEFAULT_COLORS>).map((face) => {
                const labelMap = { U: '顶(U)', D: '底(D)', R: '右(R)', L: '左(L)', F: '前(F)', B: '后(B)' };
                return (
                  <div
                    key={face}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/10 border border-border/10 gap-1.5"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground">{labelMap[face]}</span>
                    <input
                      type="color"
                      value={customColors[face]}
                      onChange={(e) => handleColorChange(face, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
