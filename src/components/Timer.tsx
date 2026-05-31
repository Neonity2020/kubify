import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Clock, Award, BarChart2 } from 'lucide-react';



export interface Solve {
  id: string;
  time: number; // in milliseconds
  date: number;
  scramble: string;
}

interface TimerProps {
  currentScramble: string;
  onScrambleRequest: () => void;
}

export const Timer: React.FC<TimerProps> = ({ currentScramble, onScrambleRequest }) => {
  const [time, setTime] = useState(0);
  const [timerState, setTimerState] = useState<'idle' | 'holding' | 'ready' | 'running'>('idle');
  const [solves, setSolves] = useState<Solve[]>([]);
  const [useInspection, setUseInspection] = useState(false);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [inspectionState, setInspectionState] = useState<'idle' | 'running'>('idle');

  const runningInterval = useRef<number | null>(null);
  const inspectionInterval = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const holdTimeout = useRef<number | null>(null);

  // Load solves from localStorage on mount
  useEffect(() => {
    const savedSolves = localStorage.getItem('rubiks_solves');
    if (savedSolves) {
      try {
        setSolves(JSON.parse(savedSolves));
      } catch (e) {
        console.error('Failed to parse saved solves', e);
      }
    }
  }, []);

  // Save solves to localStorage
  const saveSolves = (newSolves: Solve[]) => {
    setSolves(newSolves);
    localStorage.setItem('rubiks_solves', JSON.stringify(newSolves));
  };

  // Keyboard Event Listeners for Timer Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault(); // Prevent page scrolling

      if (timerState === 'running') {
        // Stop timer
        stopTimer();
      } else if (timerState === 'idle' && inspectionState === 'idle') {
        if (useInspection) {
          // If inspection is off and we want to start it
          startInspection();
        } else {
          // Ready the timer
          if (holdTimeout.current === null) {
            setTimerState('holding');
            holdTimeout.current = window.setTimeout(() => {
              setTimerState('ready');
            }, 500); // Must hold space for 500ms
          }
        }
      } else if (inspectionState === 'running') {
        // Stop inspection and ready the timer
        stopInspection();
        if (holdTimeout.current === null) {
          setTimerState('holding');
          holdTimeout.current = window.setTimeout(() => {
            setTimerState('ready');
          }, 500);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (holdTimeout.current !== null) {
        clearTimeout(holdTimeout.current);
        holdTimeout.current = null;
      }

      if (timerState === 'ready') {
        startTimer();
      } else if (timerState === 'holding') {
        setTimerState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeout.current) clearTimeout(holdTimeout.current);
    };
  }, [timerState, inspectionState, useInspection, currentScramble, solves]);

  // Inspection logic
  const startInspection = () => {
    setInspectionState('running');
    setInspectionTime(15);
    const start = Date.now();
    inspectionInterval.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = 15 - elapsed;
      if (remaining <= 0) {
        stopInspection();
        // DNF (Did Not Finish) or Auto-start
        setTime(0);
        setTimerState('idle');
      } else {
        setInspectionTime(remaining);
      }
    }, 200);
  };

  const stopInspection = () => {
    if (inspectionInterval.current) {
      clearInterval(inspectionInterval.current);
      inspectionInterval.current = null;
    }
    setInspectionState('idle');
  };

  // Timer run functions
  const startTimer = () => {
    setTimerState('running');
    startTime.current = Date.now();
    runningInterval.current = window.setInterval(() => {
      setTime(Date.now() - startTime.current);
    }, 10);
  };

  const stopTimer = () => {
    if (runningInterval.current) {
      clearInterval(runningInterval.current);
      runningInterval.current = null;
    }
    const finalTime = Date.now() - startTime.current;
    setTime(finalTime);
    setTimerState('idle');

    // Add solve to history
    const newSolve: Solve = {
      id: Math.random().toString(36).substring(2, 9),
      time: finalTime,
      date: Date.now(),
      scramble: currentScramble,
    };
    saveSolves([newSolve, ...solves]);
    
    // Request a new scramble sequence for the next run
    onScrambleRequest();
  };

  // Touch triggers for mobile compatibility
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'idle' && inspectionState === 'idle') {
      if (useInspection) {
        startInspection();
      } else {
        setTimerState('holding');
        holdTimeout.current = window.setTimeout(() => {
          setTimerState('ready');
        }, 500);
      }
    } else if (inspectionState === 'running') {
      stopInspection();
      setTimerState('holding');
      holdTimeout.current = window.setTimeout(() => {
        setTimerState('ready');
      }, 500);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (holdTimeout.current !== null) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }

    if (timerState === 'ready') {
      startTimer();
    } else if (timerState === 'holding') {
      setTimerState('idle');
    }
  };

  // Clear single solve or reset history
  const deleteSolve = (id: string) => {
    const updated = solves.filter((s) => s.id !== id);
    saveSolves(updated);
  };

  const clearHistory = () => {
    if (confirm('确定要清除所有还原记录吗？此操作无法撤销。')) {
      saveSolves([]);
    }
  };

  // Helper formatting time (e.g. 12345 ms -> 12.34s, or 65432ms -> 1:05.43)
  const formatTime = (ms: number): string => {
    if (ms === 0) return '0.00';
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) {
      return totalSeconds.toFixed(2);
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${parseFloat(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  // Calculations for Ao5 and Ao12
  const getAverage = (solvesList: Solve[], count: number): string => {
    if (solvesList.length < count) return '--';
    const subset = solvesList.slice(0, count).map((s) => s.time);
    // Sort ascending
    subset.sort((a, b) => a - b);
    // Remove slowest (last) and fastest (first)
    const trimmed = subset.slice(1, count - 1);
    const sum = trimmed.reduce((acc, t) => acc + t, 0);
    return formatTime(sum / trimmed.length);
  };

  const getBest = (): string => {
    if (solves.length === 0) return '--';
    const times = solves.map((s) => s.time);
    return formatTime(Math.min(...times));
  };

  const getSessionAverage = (): string => {
    if (solves.length === 0) return '--';
    const sum = solves.reduce((acc, s) => acc + s.time, 0);
    return formatTime(sum / solves.length);
  };

  // Timer dynamic text color and size styling
  const getTimerDisplay = () => {
    if (inspectionState === 'running') {
      return (
        <div className="text-center">
          <div className="text-7xl font-extrabold tracking-wider text-orange-500 animate-pulse">
            {inspectionTime}
          </div>
          <p className="text-sm mt-2 text-muted-foreground">观察时间 - 触摸或按空格开始还原</p>
        </div>
      );
    }

    let timerColor = 'text-foreground';
    let labelText = '按住空格键或触摸此区域以准备';

    if (timerState === 'holding') {
      timerColor = 'text-red-500';
      labelText = '按住不要松开...';
    } else if (timerState === 'ready') {
      timerColor = 'text-green-500';
      labelText = '松开按键开始计时！';
    } else if (timerState === 'running') {
      timerColor = 'text-blue-500';
      labelText = '触摸屏幕或按任意键停止';
    }

    return (
      <div className="text-center">
        <div
          className={`font-mono text-7xl md:text-8xl font-black tracking-tight select-none ${timerColor} transition-colors duration-200`}
        >
          {formatTime(time)}
        </div>
        <p className="text-xs md:text-sm mt-3 text-muted-foreground select-none uppercase tracking-wide">
          {labelText}
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {/* Left: Timer Display Panel */}
      <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md min-h-[300px] relative overflow-hidden group">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setUseInspection(!useInspection)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              useInspection
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                : 'bg-muted border-transparent text-muted-foreground'
            }`}
          >
            {useInspection ? '开启15s观察' : '关闭15s观察'}
          </button>
        </div>

        {/* Current Scramble */}
        <div className="w-full text-center max-w-lg mb-6">
          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block mb-1">
            打乱序列 (Scramble)
          </span>
          <p className="font-mono text-sm md:text-base font-semibold leading-relaxed px-4 py-2 rounded-xl bg-secondary/30 text-secondary-foreground border border-border/30 break-words">
            {currentScramble || '正在生成...'}
          </p>
        </div>

        {/* Big Interactive Timer Area */}
        <div
          onMouseDown={(e) => {
            // Only trigger on main mouse button, not control clicks
            if (e.button === 0) handleTouchStart(e as any);
          }}
          onMouseUp={handleTouchEnd as any}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 flex items-center justify-center w-full max-w-md py-6 rounded-2xl cursor-pointer hover:bg-muted/10 transition-colors"
          data-timer-active={timerState !== 'idle' || inspectionState !== 'idle'}
        >
          {getTimerDisplay()}
        </div>
      </div>

      {/* Right: Solves History & Stats Panel */}
      <div className="flex flex-col p-5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md max-h-[350px] lg:max-h-none overflow-hidden">
        {/* Stats Header Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Award className="h-3 w-3 text-amber-500" />
              最佳
            </div>
            <div className="text-lg font-bold mt-1 text-amber-500">{getBest()}</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              Ao5
            </div>
            <div className="text-lg font-bold mt-1 text-blue-500">{getAverage(solves, 5)}</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 text-center">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <BarChart2 className="h-3 w-3 text-emerald-500" />
              Ao12
            </div>
            <div className="text-lg font-bold mt-1 text-emerald-500">{getAverage(solves, 12)}</div>
          </div>
        </div>

        {/* History List */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold flex items-center gap-2">
            历史成绩 ({solves.length}) {solves.length > 0 && `| 均值: ${getSessionAverage()}`}
          </span>
          {solves.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs flex items-center gap-1 text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-[150px]">
          {solves.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs py-8">
              <Play className="h-5 w-5 mb-2 opacity-50" />
              暂无记录，按下空格键开始第一次还原！
            </div>
          ) : (
            solves.map((solve, index) => (
              <div
                key={solve.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/15 hover:bg-secondary/25 border border-border/20 transition-all text-sm group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{solves.length - index}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatTime(solve.time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] text-muted-foreground font-mono hidden group-hover:block max-w-[120px] truncate"
                    title={solve.scramble}
                  >
                    {solve.scramble}
                  </span>
                  <button
                    onClick={() => deleteSolve(solve.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
