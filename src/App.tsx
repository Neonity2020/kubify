import { useState, useEffect, useRef } from 'react';
import { RubiksCube3D } from './components/RubiksCube3D';
import { ControlPanel } from './components/ControlPanel';
import { Timer } from './components/Timer';
import { SolvingGuidePanel } from './components/SolvingGuidePanel';
import { solveStepBFS, generatePracticeState } from './utils/solvingGuide';
import {
  initializeCube,
  applyMove,
  checkSolved,
  generateScramble,
  DEFAULT_COLORS,
  type MoveType,
  type FaceType,
  moveToString,
  mapRelativeToPhysical,
  type Cubie,
} from './utils/cubeLogic';
import { soundEffects } from './utils/soundEffects';
import { Info, Sparkles } from 'lucide-react';

type HistoryEntry =
  | { type: 'move'; move: MoveType }
  | { type: 'state'; state: Cubie[] };

function App() {
  // Theme and Colors
  const [theme, setTheme] = useState<'classic' | 'neon' | 'pastel' | 'glass'>('classic');
  const [customColors, setCustomColors] = useState(DEFAULT_COLORS);

  // Cube rotation view angle (lifted up from RubiksCube3D)
  const [cubeRotation, setCubeRotation] = useState({ x: -30, y: 45 });

  // Play Mode: practice = free practice, timer = speedtimer, guide = layer-by-layer helper
  const [mode, setMode] = useState<'practice' | 'timer' | 'guide'>('practice');

  // Cube State
  const [cubies, setCubies] = useState(() => initializeCube(DEFAULT_COLORS));
  const [isSolvedState, setIsSolvedState] = useState(true);
  const isSolvedRef = useRef(isSolvedState);
  isSolvedRef.current = isSolvedState;

  // Move Queue and Animation State
  const [moveQueue, setMoveQueue] = useState<MoveType[]>([]);
  const [animatingMove, setAnimatingMove] = useState<MoveType | null>(null);

  // Move history for undo/redo support
  const [moveHistory, setMoveHistory] = useState<HistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<HistoryEntry[]>([]);

  // Scramble and History for Timer mode
  const [currentScramble, setCurrentScramble] = useState('');

  // Refs for tracking values dynamically in effects (avoiding stale closures)
  const animationDuration = useRef(220); // ms per turn
  const cubeRotationRef = useRef(cubeRotation);
  cubeRotationRef.current = cubeRotation;
  const customColorsRef = useRef(customColors);
  customColorsRef.current = customColors;

  // Handle color customizations
  const handleUpdateColors = (newColors: typeof DEFAULT_COLORS) => {
    // Update existing cubies colors
    setCubies((prev) => {
      return prev.map((cubie) => {
        const colors = { ...cubie.colors };
        (Object.keys(colors) as Array<keyof typeof colors>).forEach((face) => {
          const currentHex = colors[face];
          // Find which face in customColors this hex corresponds to
          const faceKey = (Object.keys(customColors) as Array<keyof typeof customColors>).find(
            (k) => customColors[k] === currentHex
          );
          if (faceKey) {
            colors[face] = newColors[faceKey];
          }
        });
        return { ...cubie, colors };
      });
    });
    setCustomColors(newColors);
  };

  // Generate initial scramble on load
  useEffect(() => {
    handleNewScrambleRequest();
  }, []);

  const handleNewScrambleRequest = () => {
    const scramble = generateScramble(20);
    const scrambleStr = scramble.map(moveToString).join(' ');
    setCurrentScramble(scrambleStr);
  };

  // Reset the cube to solved state
  const handleResetCube = () => {
    setMoveQueue([]);
    setAnimatingMove(null);
    setMoveHistory([]);
    setRedoHistory([]);
    const freshCube = initializeCube(customColors);
    setCubies(freshCube);
    setIsSolvedState(true);
  };

  // Reset the cube to practice state for a specific LBL step
  const handleResetPractice = (stepId: number) => {
    setMoveQueue([]);
    setAnimatingMove(null);
    setMoveHistory([]);
    setRedoHistory([]);
    const practiceState = generatePracticeState(stepId, customColors);
    setCubies(practiceState);
    setIsSolvedState(checkSolved(practiceState));
    soundEffects.playTurn();
  };

  // Scramble the cube physically by adding moves to the queue
  const handleScrambleCube = () => {
    handleResetCube();
    const scrambleMoves = generateScramble(22);
    if (scrambleMoves.length > 0) {
      // Speed up animation duration during scrambles
      animationDuration.current = 75;
      setAnimatingMove(scrambleMoves[0]);
      setMoveQueue(scrambleMoves.slice(1));
    }
    
    // Update current scramble text for record
    const scrambleStr = scrambleMoves.map(moveToString).join(' ');
    setCurrentScramble(scrambleStr);
  };

  // Queue moves to execute
  const handleQueueMoves = (moves: MoveType[]) => {
    if (moves.length === 0) return;
    animationDuration.current = 220; // reset to normal speed
    const physicalMoves = moves.map((move) => ({
      ...move,
      face: mapRelativeToPhysical(move.face, cubeRotationRef.current.y),
    }));
    
    if (!animatingMove && moveQueue.length === 0) {
      setAnimatingMove(physicalMoves[0]);
      setMoveQueue(physicalMoves.slice(1));
    } else {
      setMoveQueue((prev) => [...prev, ...physicalMoves]);
    }
  };

  // Single Move Handler (handles button clicks, swipes)
  const handleSingleMove = (move: MoveType) => {
    if (moveQueue.length > 0 || animatingMove) return; // ignore if busy
    animationDuration.current = 220; // normal speed
    const physicalMove = {
      ...move,
      face: mapRelativeToPhysical(move.face, cubeRotationRef.current.y),
    };
    setAnimatingMove(physicalMove);
    setMoveHistory((prev) => [...prev, { type: 'move', move: physicalMove }]);
    setRedoHistory([]); // Invalidate redo stack on new action
  };

  // Undo the last move
  const handleUndo = () => {
    // If there are moves in the queue, clear them and remove from history
    if (moveQueue.length > 0) {
      const pendingCount = moveQueue.length;
      setMoveQueue([]);
      setMoveHistory((prev) => prev.slice(0, prev.length - pendingCount));
      setRedoHistory([]);
      return;
    }

    if (animatingMove) return; // ignore if mid-animation

    if (moveHistory.length === 0) return;

    const history = [...moveHistory];
    const lastEntry = history.pop();
    if (!lastEntry) return;

    setMoveHistory(history);
    setRedoHistory((prev) => [...prev, lastEntry]);

    if (lastEntry.type === 'move') {
      const lastMove = lastEntry.move;
      // Calculate inverse move
      const inverseDirection = lastMove.direction === 1 ? -1 : lastMove.direction === -1 ? 1 : 2;
      const inverseMove: MoveType = {
        face: lastMove.face,
        direction: inverseDirection,
      };

      // Play the inverse move physically
      animationDuration.current = 220;
      setAnimatingMove(inverseMove);
    } else if (lastEntry.type === 'state') {
      // Restore state instantly
      setCubies(lastEntry.state);
      setIsSolvedState(checkSolved(lastEntry.state));
      soundEffects.playTurn();
    }
  };

  // Redo the last undone move (Forward/下一步)
  const handleRedo = () => {
    if (animatingMove || moveQueue.length > 0) return; // ignore if busy

    if (redoHistory.length === 0) return;

    const redo = [...redoHistory];
    const lastEntry = redo.pop();
    if (!lastEntry) return;

    setRedoHistory(redo);
    setMoveHistory((prev) => [...prev, lastEntry]);

    if (lastEntry.type === 'move') {
      // Play the move physically
      animationDuration.current = 220;
      setAnimatingMove(lastEntry.move);
    } else if (lastEntry.type === 'state') {
      // Restore state instantly
      setCubies(lastEntry.state);
      setIsSolvedState(checkSolved(lastEntry.state));
      soundEffects.playTurn();
    }
  };

  // AI instant solving of the current step with animations
  const handleAISolveStep = (stepId: number) => {
    // Clear any active move queues or animations
    setMoveQueue([]);
    setAnimatingMove(null);
    setRedoHistory([]);

    // Try to solve mathematically using the full LBL solver
    const path = solveStepBFS(cubies, stepId, customColors);
    
    if (path !== null && path.length > 0) {
      // Real sequence of moves found! Play them.
      animationDuration.current = 220; // normal speed
      setAnimatingMove(path[0]);
      setMoveQueue(path.slice(1));
      setMoveHistory((prev) => [
        ...prev,
        ...path.map((m) => ({ type: 'move' as const, move: m })),
      ]);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Ignore if timer is running or holding
      const isTimerActive = document.querySelector('[data-timer-active="true"]');
      if (isTimerActive) return;

      const key = e.key.toLowerCase();

      // Check for Undo (Ctrl+Z / Cmd+Z)
      const isUndo = (e.metaKey || e.ctrlKey) && key === 'z' && !e.shiftKey;
      if (isUndo) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Check for Redo (Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y)
      const isRedo = 
        ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 'z') || 
        ((e.ctrlKey || e.metaKey) && key === 'y');
      if (isRedo) {
        e.preventDefault();
        handleRedo();
        return;
      }
      const validFaces: Record<string, FaceType> = {
        u: 'U',
        d: 'D',
        r: 'R',
        l: 'L',
        f: 'F',
        b: 'B',
      };

      if (validFaces[key]) {
        e.preventDefault();
        const direction = e.shiftKey ? -1 : 1;
        handleSingleMove({ face: validFaces[key], direction });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveQueue, animatingMove, customColors, moveHistory, redoHistory]);

  // Main Queue Processor and Animation Timer
  // Effect 1: Pop next move from queue when not animating
  useEffect(() => {
    if (!animatingMove && moveQueue.length > 0) {
      const nextMove = moveQueue[0];
      setMoveQueue((prev) => prev.slice(1));
      setAnimatingMove(nextMove);
    }
  }, [animatingMove, moveQueue]);

  // Effect 2: Handle active animation duration timer
  useEffect(() => {
    if (!animatingMove) return;

    const timer = setTimeout(() => {
      // Play click sound
      if (animationDuration.current > 100) {
        soundEffects.playTurn();
      } else {
        soundEffects.playScrambleClick();
      }

      setCubies((prev) => {
        const nextState = applyMove(prev, animatingMove);
        
        // Check if solved
        const solved = checkSolved(nextState);
        const wasSolved = isSolvedRef.current;
        if (solved && !wasSolved) {
          soundEffects.playSolvedChime();
          setIsSolvedState(true);
        } else if (!solved && wasSolved) {
          setIsSolvedState(false);
        }

        return nextState;
      });

      setAnimatingMove(null);
    }, animationDuration.current);

    return () => clearTimeout(timer);
  }, [animatingMove]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden font-sans pb-8">
      {/* Decorative Glow Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Header Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between border-b border-zinc-900/60 z-10 backdrop-blur-md bg-zinc-950/20">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
            <span className="text-white text-sm">3D</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              KUBIFY <span className="text-xs font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 ml-1">Beginner LBL</span>
            </h1>
            <p className="text-[10px] text-zinc-500">丝滑优美的 3D 三阶模拟器</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSolvedState && (
            <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 animate-bounce">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              已还原 (Solved)
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Side: Cube & Timer Viewports */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* 3D Cube Canvas Widget */}
          <div className="relative rounded-2xl bg-zinc-900/20 border border-zinc-800/40 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center p-4">
            <RubiksCube3D
              cubies={cubies}
              onMove={handleSingleMove}
              animatingMove={animatingMove}
              animationDuration={animationDuration.current}
              theme={theme}
              customColors={customColors}
              cubeRotation={cubeRotation}
              setCubeRotation={setCubeRotation}
            />
          </div>

          {/* Mode-specific Widget Area */}
          <div className="w-full">
            {mode === 'timer' ? (
              <Timer
                currentScramble={currentScramble}
                onScrambleRequest={handleNewScrambleRequest}
              />
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-900/20 border border-zinc-800/40 backdrop-blur-md">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  操作指示 (Quick Instructions)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-zinc-400">
                  <div className="space-y-2 bg-secondary/10 p-3 rounded-xl border border-border/10">
                    <p className="font-bold text-foreground">💡 视角与旋转方式：</p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-1">
                      <li>在魔方外部区域按住鼠标并拖拽，可以旋转视角。</li>
                      <li>在魔方表面按住并划动，可直接转动对应的外层。</li>
                      <li>使用键盘快捷键 <code className="px-1 py-0.5 rounded bg-zinc-800 font-mono text-foreground font-bold">U/D/R/L/F/B</code> 直接转动层，配合 <code className="px-1 py-0.5 rounded bg-zinc-800 text-foreground font-bold font-mono">Shift</code> 可逆时针转动。</li>
                    </ul>
                  </div>
                  <div className="space-y-2 bg-secondary/10 p-3 rounded-xl border border-border/10">
                    <p className="font-bold text-foreground">🏆 训练技巧：</p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground pl-1">
                      <li>点击右侧 <span className="font-bold text-primary">“快速打乱”</span> 即可生成乱序。</li>
                      <li>在 <span className="font-bold text-primary">“速度竞时”</span> 模式中，配合观察时间训练手速。</li>
                      <li>在 <span className="font-bold text-primary">“还原指南”</span> 模式中，按照底部教程进行分步训练。</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Panel Controls */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-full">
          {mode === 'guide' ? (
            <SolvingGuidePanel
              onPlayAlgorithm={handleQueueMoves}
              isQueueAnimating={moveQueue.length > 0 || animatingMove !== null}
              onResetCube={handleResetPractice}
              onAISolveStep={handleAISolveStep}
              theme={theme}
              customColors={customColors}
            />
          ) : (
            <ControlPanel
              onMove={handleSingleMove}
              onScramble={handleScrambleCube}
              onReset={handleResetCube}
              mode={mode}
              setMode={setMode}
              theme={theme}
              setTheme={setTheme}
              customColors={customColors}
              onUpdateColors={handleUpdateColors}
            />
          )}

          {/* Side Banner helper in practice / timer mode */}
          {mode !== 'guide' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-900/20 backdrop-blur-md flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-400">觉得太难还原？</h4>
                <p className="text-[10px] text-zinc-400">切换至右上角“还原指南”一步步复原魔方。</p>
              </div>
              <button
                onClick={() => setMode('guide')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
              >
                学习还原
              </button>
            </div>
          )}
        </section>
      </main>


      {/* Footer Info */}
      <footer className="w-full text-center text-[10px] text-zinc-600 mt-8 border-t border-zinc-900/30 pt-4">
        © 2026 Kubify. Built with React + Tailwind v4 + CSS 3D. Sleek & Butter-Smooth.
      </footer>
    </div>
  );
}

export default App;
