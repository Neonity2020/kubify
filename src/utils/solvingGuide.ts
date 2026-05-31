import { type MoveType, parseMoveString, type Cubie, DEFAULT_COLORS, checkSolved, applyMove, type FaceType } from './cubeLogic';



export interface GuideAlgorithm {
  name: string;
  notation: string; // e.g. "R U R' U'"
  moves: MoveType[];
  description: string;
  triggerState?: string; // Description of when to use it
}

export interface GuideStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  algorithms: GuideAlgorithm[];
  tips: string[];
}

export const LBL_STEPS: GuideStep[] = [
  {
    id: 1,
    title: '第一步：底面白十字 (White Cross)',
    subtitle: '在底部（D面）拼出一个白色十字，且侧面棱色与中心块颜色对齐。',
    description:
      '通常将白色作为底面。首先在顶层（黄色面）把4个白色棱块找齐，拼成一个围绕黄色中心块的“小花”（菊花），然后再依次转动顶层使侧面颜色对齐中心块，转动180度放入底面。',
    algorithms: [
      {
        name: '翻转棱块 (Flip Edge)',
        notation: "F' U L' U'",
        moves: ["F'", "U", "L'", "U'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当棱块已经在顶层但颜色颠倒（侧面为白色，顶面为其他颜色）时使用。',
      },
    ],
    tips: [
      '新手可以先在黄色顶面做出“小白花”（小黄点周围四个白棱）。',
      '观察每个白棱的另一个颜色，对齐侧面中心块颜色后，旋转该面180度（做F2）沉到底部。',
    ],
  },
  {
    id: 2,
    title: '第二步：底角归位 (White Corners)',
    subtitle: '还原底层4个角块，完成白色底层以及侧面第一层的T字形。',
    description:
      '寻找含有白色的角块。将角块转到顶层，移动至目标位置的上方，然后使用“右手公式”将其放入底层并调整好朝向。',
    algorithms: [
      {
        name: '右手公式 (Right Trigger / Sexy Move)',
        notation: "R U R' U'",
        moves: ['R', 'U', "R'", "U'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '最基础的四步公式。如果角块朝向不对，可重复做1-5次直到白色朝下且颜色正确。',
      },
      {
        name: '左手公式 (Left Trigger)',
        notation: "L' U' L U",
        moves: ["L'", "U'", 'L', 'U'].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '右手公式的对称版，用于将左侧的角块还原。',
      },
    ],
    tips: [
      '角块在底角但位置或朝向错误时，做一次右手公式可以将其带回顶层。',
      '一定要确保还原后，底层四周呈现完美的“T”字形（即侧面第一层颜色与中心块一致）。',
    ],
  },
  {
    id: 3,
    title: '第三步：中层棱块归位 (Middle Layer)',
    subtitle: '还原魔方中层的4个棱块，完成前两层（F2L雏形）。',
    description:
      '在顶层（U面）寻找不含黄色（不含顶面色）的棱块。通过转动U面，使该棱块的侧面颜色与对应的中心块对齐，根据其目标位置选择左倾或右倾公式。',
    algorithms: [
      {
        name: '往右侧归位 (To Right Edge)',
        notation: "U R U R' U' F' U' F",
        moves: ['U', 'R', 'U', "R'", "U'", "F'", "U'", 'F'].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当顶层棱块对齐前中心块后，需要移动到右侧中层位置时使用。',
      },
      {
        name: '往左侧归位 (To Left Edge)',
        notation: "U' L' U' L U F U F'",
        moves: ["U'", "L'", "U'", 'L', 'U', 'F', 'U', "F'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当顶层棱块对齐前中心块后，需要移动到左侧中层位置时使用。',
      },
    ],
    tips: [
      '如果中层棱块位置对但颜色反了，或者在中层其他位置，先用上述任一公式放入一个黄色棱块将其“顶出”到顶层，再重新操作。',
    ],
  },
  {
    id: 4,
    title: '第四步：顶面黄色十字 (Yellow Cross)',
    subtitle: '在顶面（U面）拼出一个黄色十字，不考虑侧面颜色是否对齐。',
    description:
      '观察顶面黄色，可能会出现三种情况：点（只有中心块）、拐角（L型）、一字线（I型）。利用基础公式，可以将这几种状态依次转换，最终得到黄色十字。',
    algorithms: [
      {
        name: '顺时针转十字 (Orient Edges)',
        notation: "F R U R' U' F'",
        moves: ['F', 'R', 'U', "R'", "U'", "F'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '最经典的顶层十字公式。如果是“拐角”，放在左上角方向做此公式；如果是“一字”，水平放置做此公式。',
      },
    ],
    tips: [
      '点状态：做一次公式变成“拐角”；“拐角”放在左上角做公式变成“一字”；“一字”水平放置做公式变成“十字”。',
    ],
  },
  {
    id: 5,
    title: '第五步：顶面黄色归位 (Yellow Face / Sune)',
    subtitle: '将顶面全部翻转为黄色，即完成整个黄色的顶面。',
    description:
      '拼出黄色十字后，观察顶面角块。我们要利用著名的“小鱼公式”旋转角块朝向，直到把顶面全部刷成黄色。',
    algorithms: [
      {
        name: '小鱼一式 (Sune)',
        notation: "R U R' U R U2 R'",
        moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当顶面只有一个黄色角块（形成一条小鱼），且鱼头朝向左下角，右前方的角块黄色面朝前时使用。',
      },
      {
        name: '小鱼二式 (Anti-Sune)',
        notation: "R' U' R U' R' U2 R",
        moves: ["R'", "U'", 'R', "U'", "R'", 'U', 'U', 'R'].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当鱼头放在右上角，左前方的角块黄色朝前时使用；或者作为对称公式。',
      },
    ],
    tips: [
      '如果是“小鱼”状态，把鱼头放在左下角（对于小鱼一式）或右上角（对于小鱼二式）进行公式操作。',
      '如果不是小鱼（比如有2个或0个黄色角块），随便放，多做一两次小鱼公式就能逼出小鱼状态。',
    ],
  },
  {
    id: 6,
    title: '第六步：顶角归位 (Permute Corners)',
    subtitle: '调整顶层4个角块的水平位置，使其侧面颜色全部对齐。',
    description:
      '观察顶层侧面，寻找是否有两个角块侧面颜色相同（称为“眼睛”或“同色边”）。如果有一对“眼睛”，将其转到B面（背面），然后使用公式；若没有，则先做一次公式做出“眼睛”。',
    algorithms: [
      {
        name: '换角公式 (T-Perm / Swap Corners)',
        notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
        moves: ['R', 'U', "R'", "U'", "R'", 'F', 'R', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'"].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '用于交换右侧的两个角块。做完后，所有角块都将正确归位。',
      },
    ],
    tips: [
      '做完换角公式后，记得转动顶层（U面）让四个角块与底层的颜色完全对齐。',
      '如果找不到“眼睛”（四个侧面都没有相同的两个角），在任意方向做一次公式即可制作出“眼睛”。',
    ],
  },
  {
    id: 7,
    title: '第七步：顶棱归位 (Permute Edges)',
    subtitle: '调整顶层4个棱块的位置，最终还原整个魔方！',
    description:
      '此时角块都已对齐，通常会有一个面已经完全还原（侧面），另外三个面各缺一个棱块。将已经还原的那个面放在背面（B面），然后根据另外三个棱块的逆时针或顺时针循环关系选择公式。',
    algorithms: [
      {
        name: '三棱逆时针循环 (Edge U Perm CCW)',
        notation: "F2 U L R' F2 L' R U F2",
        moves: ['F', 'F', 'U', 'L', "R'", 'F', 'F', "L'", 'R', 'U', 'F', 'F'].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '当需要将前、左、右三个棱块做逆时针循环移动时使用。',
      },
      {
        name: '三棱顺时针循环 (Edge U Perm CW)',
        notation: "F2 U' L R' F2 L' R U' F2",
        moves: ['F', 'F', "U'", 'L', "R'", 'F', 'F', "L'", 'R', "U'", 'F', 'F'].map(parseMoveString).filter(Boolean) as MoveType[],
        description: '对称公式，用于顺时针旋转三个棱块。',
      },
    ],
    tips: [
      '如果有四个面都缺棱块（没有面是完全还原的），在任意方向做一次上述公式，就会变成有一个面还原的状态。',
      '恭喜！做完最后一步，魔方就完美还原了！',
    ],
  },
];

export const getStepTargetState = (stepId: number, customColors = DEFAULT_COLORS): Cubie[] => {
  const cubies: Cubie[] = [];
  let id = 0;
  const grey = '#27272a'; // Unsolved indicator

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const colors: Cubie['colors'] = {};

        const isSolvedFace = (face: 'U' | 'D' | 'R' | 'L' | 'F' | 'B'): boolean => {
          if (x === 0 && y === 0 && z === 0) return false;
          // Centers are always solved
          if (face === 'U' && x === 0 && y === 1 && z === 0) return true;
          if (face === 'D' && x === 0 && y === -1 && z === 0) return true;
          if (face === 'R' && x === 1 && y === 0 && z === 0) return true;
          if (face === 'L' && x === -1 && y === 0 && z === 0) return true;
          if (face === 'F' && x === 0 && y === 0 && z === 1) return true;
          if (face === 'B' && x === 0 && y === 0 && z === -1) return true;

          if (stepId === 7) return true;

          // Step 1: Bottom Cross
          if (stepId === 1) {
            const isBottomEdge = y === -1 && (
              (x === 0 && z === 1) ||
              (x === 1 && z === 0) ||
              (x === 0 && z === -1) ||
              (x === -1 && z === 0)
            );
            if (isBottomEdge) {
              if (face === 'D') return true;
              if (face === 'F' && z === 1) return true;
              if (face === 'R' && x === 1) return true;
              if (face === 'B' && z === -1) return true;
              if (face === 'L' && x === -1) return true;
            }
            return false;
          }

          // Step 2: First Layer (Bottom layer fully solved)
          if (stepId === 2) {
            if (y === -1) return true;
            return false;
          }

          // Step 3: First Two Layers (Bottom and Middle layers fully solved)
          if (stepId === 3) {
            if (y === -1 || y === 0) return true;
            return false;
          }

          // Step 4: Yellow Cross
          if (stepId === 4) {
            if (y === -1 || y === 0) return true;
            if (y === 1) {
              const isCross = (x === 0 && z === 0) || (x === 0 && z === 1) || (x === 1 && z === 0) || (x === 0 && z === -1) || (x === -1 && z === 0);
              if (isCross && face === 'U') return true;
            }
            return false;
          }

          // Step 5: Yellow Face
          if (stepId === 5) {
            if (y === -1 || y === 0) return true;
            if (y === 1 && face === 'U') return true;
            return false;
          }

          // Step 6: Top Corners Permuted
          if (stepId === 6) {
            if (y === -1 || y === 0) return true;
            if (y === 1) {
              if (face === 'U') return true;
              const isCorner = Math.abs(x) === 1 && Math.abs(z) === 1;
              if (isCorner) return true;
            }
            return false;
          }

          return false;
        };

        if (y === 1) colors.U = isSolvedFace('U') ? customColors.U : grey;
        if (y === -1) colors.D = isSolvedFace('D') ? customColors.D : grey;
        if (x === 1) colors.R = isSolvedFace('R') ? customColors.R : grey;
        if (x === -1) colors.L = isSolvedFace('L') ? customColors.L : grey;
        if (z === 1) colors.F = isSolvedFace('F') ? customColors.F : grey;
        if (z === -1) colors.B = isSolvedFace('B') ? customColors.B : grey;

        cubies.push({
          id,
          currentPos: { x, y, z },
          colors,
        });
        id++;
      }
    }
  }

  return cubies;
};

export const solveStepInstantly = (
  cubies: Cubie[],
  stepId: number,
  customColors = DEFAULT_COLORS
): Cubie[] => {
  const solvedCubies: Cubie[] = [];
  
  const getSolvedCubie = (x: number, y: number, z: number): Cubie => {
    const colors: Cubie['colors'] = {};
    if (y === 1) colors.U = customColors.U;
    if (y === -1) colors.D = customColors.D;
    if (x === 1) colors.R = customColors.R;
    if (x === -1) colors.L = customColors.L;
    if (z === 1) colors.F = customColors.F;
    if (z === -1) colors.B = customColors.B;
    
    const originalId = (x + 1) * 9 + (y + 1) * 3 + (z + 1);
    return {
      id: originalId,
      currentPos: { x, y, z },
      colors,
    };
  };

  const shouldBeSolved = (x: number, y: number, z: number): boolean => {
    // Centers are always solved
    if (x === 0 && y === 0 && z === 0) return false;
    if (x === 0 && y === 1 && z === 0) return true;
    if (x === 0 && y === -1 && z === 0) return true;
    if (x === 1 && y === 0 && z === 0) return true;
    if (x === -1 && y === 0 && z === 0) return true;
    if (x === 0 && y === 0 && z === 1) return true;
    if (x === 0 && y === 0 && z === -1) return true;

    if (stepId === 7) return true;

    // Step 1: Bottom Cross
    if (stepId === 1) {
      return y === -1 && (x === 0 || z === 0);
    }

    // Step 2: Bottom Layer Solved
    if (stepId === 2) {
      return y === -1;
    }

    // Step 3: First Two Layers Solved
    if (stepId === 3) {
      return y === -1 || y === 0;
    }

    // Step 4: First Two Layers + Top Yellow Cross
    if (stepId === 4) {
      if (y === -1 || y === 0) return true;
      // Top edges
      return y === 1 && (x === 0 || z === 0);
    }

    // Step 5: First Two Layers + Top Yellow Face
    if (stepId === 5) {
      return true;
    }

    // Step 6: Top Corners Permuted
    if (stepId === 6) {
      return true;
    }

    return false;
  };

  // Build the 27 cubies array
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (shouldBeSolved(x, y, z)) {
          solvedCubies.push(getSolvedCubie(x, y, z));
        } else {
          // Find the current cubie that is physically at this position
          const currentCubie = cubies.find(
            (c) => c.currentPos.x === x && c.currentPos.y === y && c.currentPos.z === z
          );
          if (currentCubie) {
            solvedCubies.push(currentCubie);
          } else {
            // Fallback
            solvedCubies.push(getSolvedCubie(x, y, z));
          }
        }
      }
    }
  }

  return solvedCubies;
};

export const isStepSolved = (
  cubies: Cubie[],
  stepId: number,
  customColors = DEFAULT_COLORS
): boolean => {
  // Step 1: Bottom Cross
  if (stepId === 1) {
    const bottomEdges = [
      { x: 0, y: -1, z: 1, colorField: 'F', targetColor: customColors.F },
      { x: 1, y: -1, z: 0, colorField: 'R', targetColor: customColors.R },
      { x: 0, y: -1, z: -1, colorField: 'B', targetColor: customColors.B },
      { x: -1, y: -1, z: 0, colorField: 'L', targetColor: customColors.L },
    ];
    for (const edge of bottomEdges) {
      const cubie = cubies.find(
        (c) => c.currentPos.x === edge.x && c.currentPos.y === -1 && c.currentPos.z === edge.z
      );
      if (!cubie) return false;
      if (cubie.colors.D !== customColors.D) return false;
      if (cubie.colors[edge.colorField as FaceType] !== edge.targetColor) return false;
    }
    return true;
  }

  // Step 2: Bottom Layer Solved
  if (stepId === 2) {
    for (const cubie of cubies) {
      if (cubie.currentPos.y === -1) {
        if (cubie.colors.D && cubie.colors.D !== customColors.D) return false;
        if (cubie.currentPos.x === 1 && cubie.colors.R && cubie.colors.R !== customColors.R) return false;
        if (cubie.currentPos.x === -1 && cubie.colors.L && cubie.colors.L !== customColors.L) return false;
        if (cubie.currentPos.z === 1 && cubie.colors.F && cubie.colors.F !== customColors.F) return false;
        if (cubie.currentPos.z === -1 && cubie.colors.B && cubie.colors.B !== customColors.B) return false;
      }
    }
    return true;
  }

  // Step 3: First Two Layers Solved
  if (stepId === 3) {
    for (const cubie of cubies) {
      if (cubie.currentPos.y === -1 || cubie.currentPos.y === 0) {
        if (cubie.colors.D && cubie.colors.D !== customColors.D) return false;
        if (cubie.currentPos.x === 1 && cubie.colors.R && cubie.colors.R !== customColors.R) return false;
        if (cubie.currentPos.x === -1 && cubie.colors.L && cubie.colors.L !== customColors.L) return false;
        if (cubie.currentPos.z === 1 && cubie.colors.F && cubie.colors.F !== customColors.F) return false;
        if (cubie.currentPos.z === -1 && cubie.colors.B && cubie.colors.B !== customColors.B) return false;
      }
    }
    return true;
  }

  // Step 4: First Two Layers Solved + Top Yellow Cross
  if (stepId === 4) {
    if (!isStepSolved(cubies, 3, customColors)) return false;
    const topEdges = [
      { x: 0, z: 1 }, { x: 1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: 0 }
    ];
    for (const edge of topEdges) {
      const cubie = cubies.find(
        (c) => c.currentPos.x === edge.x && c.currentPos.y === 1 && c.currentPos.z === edge.z
      );
      if (!cubie || cubie.colors.U !== customColors.U) return false;
    }
    return true;
  }

  // Step 5: First Two Layers Solved + Top Yellow Face
  if (stepId === 5) {
    if (!isStepSolved(cubies, 3, customColors)) return false;
    for (const cubie of cubies) {
      if (cubie.currentPos.y === 1) {
        if (cubie.colors.U && cubie.colors.U !== customColors.U) return false;
      }
    }
    return true;
  }

  // Step 6: Top Corners Permuted
  if (stepId === 6) {
    if (!isStepSolved(cubies, 5, customColors)) return false;
    const topCorners = [
      { x: 1, z: 1 }, { x: -1, z: 1 }, { x: 1, z: -1 }, { x: -1, z: -1 }
    ];
    for (const corner of topCorners) {
      const cubie = cubies.find(
        (c) => c.currentPos.x === corner.x && c.currentPos.y === 1 && c.currentPos.z === corner.z
      );
      if (!cubie) return false;
      if (cubie.colors.R && cubie.colors.R !== customColors.R) return false;
      if (cubie.colors.L && cubie.colors.L !== customColors.L) return false;
      if (cubie.colors.F && cubie.colors.F !== customColors.F) return false;
      if (cubie.colors.B && cubie.colors.B !== customColors.B) return false;
    }
    return true;
  }

  // Step 7: Entire cube solved
  if (stepId === 7) {
    return checkSolved(cubies);
  }

  return false;
};

interface TransitionStep {
  name: string;
  moves: MoveType[];
}

const applyMoves = (state: Cubie[], moves: MoveType[]): Cubie[] => {
  let s = state;
  for (const m of moves) {
    s = applyMove(s, m);
  }
  return s;
};

const findEdgeCubie = (state: Cubie[], colorA: string, colorB: string): Cubie => {
  return state.find((c) => {
    const vals = Object.values(c.colors).filter((v) => v !== undefined);
    return vals.length === 2 && vals.includes(colorA) && vals.includes(colorB);
  })!;
};

const findCornerCubie = (state: Cubie[], colorA: string, colorB: string, colorC: string): Cubie => {
  return state.find((c) => {
    const vals = Object.values(c.colors).filter((v) => v !== undefined);
    return vals.length === 3 && vals.includes(colorA) && vals.includes(colorB) && vals.includes(colorC);
  })!;
};

const solveSubGoal = (
  initialState: Cubie[],
  isSolved: (s: Cubie[]) => boolean,
  maxDepth: number,
  allowedMoves: MoveType[]
): MoveType[] | null => {
  if (isSolved(initialState)) return [];

  const queue: { state: Cubie[]; path: MoveType[] }[] = [];
  queue.push({ state: initialState, path: [] });

  let head = 0;
  while (head < queue.length) {
    const { state, path } = queue[head++];
    if (path.length >= maxDepth) continue;

    for (const move of allowedMoves) {
      if (path.length > 0) {
        const lastMove = path[path.length - 1];
        if (lastMove.face === move.face) {
          continue;
        }
      }

      const nextState = applyMove(state, move);
      if (isSolved(nextState)) {
        return [...path, move];
      }
      queue.push({ state: nextState, path: [...path, move] });
    }
  }
  return null;
};

const solveMacroBFS = (
  initialState: Cubie[],
  isSolved: (s: Cubie[]) => boolean,
  transitions: TransitionStep[],
  maxDepth: number
): MoveType[] | null => {
  if (isSolved(initialState)) return [];

  const queue: { state: Cubie[]; path: MoveType[]; transitionCount: number }[] = [];
  queue.push({ state: initialState, path: [], transitionCount: 0 });

  let head = 0;
  while (head < queue.length) {
    const { state, path, transitionCount } = queue[head++];
    if (transitionCount >= maxDepth) continue;

    for (const t of transitions) {
      let nextState = state;
      for (const m of t.moves) {
        nextState = applyMove(nextState, m);
      }

      const nextPath = [...path, ...t.moves];
      if (isSolved(nextState)) {
        return nextPath;
      }

      queue.push({
        state: nextState,
        path: nextPath,
        transitionCount: transitionCount + 1,
      });
    }
  }
  return null;
};

const getStep3Transitions = (): TransitionStep[] => {
  const transitions: TransitionStep[] = [
    { name: 'U', moves: [{ face: 'U', direction: 1 }] },
    { name: "U'", moves: [{ face: 'U', direction: -1 }] },
    { name: 'U2', moves: [{ face: 'U', direction: 2 }] },
  ];

  const faces: FaceType[] = ['F', 'R', 'B', 'L'];
  const leftOf: Record<FaceType, FaceType> = { F: 'L', R: 'F', B: 'R', L: 'B', U: 'L', D: 'L' };
  const rightOf: Record<FaceType, FaceType> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'R', D: 'R' };

  for (const f of faces) {
    const L = leftOf[f];
    const R = rightOf[f];
    const rNotations = ['U', R, 'U', R + "'", "U'", f + "'", "U'", f];
    transitions.push({
      name: `${f}-Right`,
      moves: rNotations.map(parseMoveString).filter(Boolean) as MoveType[],
    });
    const lNotations = ["U'", L + "'", "U'", L, 'U', f, 'U', f + "'"];
    transitions.push({
      name: `${f}-Left`,
      moves: lNotations.map(parseMoveString).filter(Boolean) as MoveType[],
    });
  }

  return transitions;
};

const getStep4Transitions = (): TransitionStep[] => {
  const transitions: TransitionStep[] = [
    { name: 'U', moves: [{ face: 'U', direction: 1 }] },
    { name: "U'", moves: [{ face: 'U', direction: -1 }] },
    { name: 'U2', moves: [{ face: 'U', direction: 2 }] },
  ];

  const faces: FaceType[] = ['F', 'R', 'B', 'L'];
  const rightOf: Record<FaceType, FaceType> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'R', D: 'R' };

  for (const f of faces) {
    const R = rightOf[f];
    const notations = [f, R, 'U', R + "'", "U'", f + "'"];
    transitions.push({
      name: `Cross-${f}`,
      moves: notations.map(parseMoveString).filter(Boolean) as MoveType[],
    });
  }

  return transitions;
};

const getStep5Transitions = (): TransitionStep[] => {
  const transitions: TransitionStep[] = [
    { name: 'U', moves: [{ face: 'U', direction: 1 }] },
    { name: "U'", moves: [{ face: 'U', direction: -1 }] },
    { name: 'U2', moves: [{ face: 'U', direction: 2 }] },
  ];

  const faces: FaceType[] = ['F', 'R', 'B', 'L'];
  const rightOf: Record<FaceType, FaceType> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'R', D: 'R' };

  for (const f of faces) {
    const R = rightOf[f];
    const sune = [R, 'U', R + "'", 'U', R, 'U', 'U', R + "'"];
    transitions.push({
      name: `Sune-${f}`,
      moves: sune.map(parseMoveString).filter(Boolean) as MoveType[],
    });

    const antiSune = [R + "'", "U'", R, "U'", R + "'", 'U', 'U', R];
    transitions.push({
      name: `AntiSune-${f}`,
      moves: antiSune.map(parseMoveString).filter(Boolean) as MoveType[],
    });
  }

  return transitions;
};

const getStep6Transitions = (): TransitionStep[] => {
  const transitions: TransitionStep[] = [
    { name: 'U', moves: [{ face: 'U', direction: 1 }] },
    { name: "U'", moves: [{ face: 'U', direction: -1 }] },
    { name: 'U2', moves: [{ face: 'U', direction: 2 }] },
  ];

  const faces: FaceType[] = ['F', 'R', 'B', 'L'];
  const rightOf: Record<FaceType, FaceType> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'R', D: 'R' };

  for (const f of faces) {
    const R = rightOf[f];
    // T-Perm: R U R' U' R' F R2 U' R' U' R U R' F'
    const swap = [R, 'U', R + "'", "U'", R + "'", f, R, R, "U'", R + "'", "U'", R, 'U', R + "'", f + "'"];
    transitions.push({
      name: `Swap-${f}`,
      moves: swap.map(parseMoveString).filter(Boolean) as MoveType[],
    });
  }

  return transitions;
};

const getStep7Transitions = (): TransitionStep[] => {
  const transitions: TransitionStep[] = [
    { name: 'U', moves: [{ face: 'U', direction: 1 }] },
    { name: "U'", moves: [{ face: 'U', direction: -1 }] },
    { name: 'U2', moves: [{ face: 'U', direction: 2 }] },
  ];

  const faces: FaceType[] = ['F', 'R', 'B', 'L'];
  const leftOf: Record<FaceType, FaceType> = { F: 'L', R: 'F', B: 'R', L: 'B', U: 'L', D: 'L' };
  const rightOf: Record<FaceType, FaceType> = { F: 'R', R: 'B', B: 'L', L: 'F', U: 'R', D: 'R' };

  for (const f of faces) {
    const L = leftOf[f];
    const R = rightOf[f];
    const ccw = [f, f, 'U', L, R + "'", f, f, L + "'", R, 'U', f, f];
    transitions.push({
      name: `CCW-${f}`,
      moves: ccw.map(parseMoveString).filter(Boolean) as MoveType[],
    });

    const cw = [f, f, "U'", L, R + "'", f, f, L + "'", R, "U'", f, f];
    transitions.push({
      name: `CW-${f}`,
      moves: cw.map(parseMoveString).filter(Boolean) as MoveType[],
    });
  }

  return transitions;
};

export const solveStepBFS = (
  cubies: Cubie[],
  stepId: number,
  customColors = DEFAULT_COLORS
): MoveType[] | null => {
  if (isStepSolved(cubies, stepId, customColors)) {
    return [];
  }

  if (stepId === 1) {
    let state = cubies;
    const allMoves: MoveType[] = [];
    const targets = [
      { face: 'F', color: customColors.F, x: 0, z: 1 },
      { face: 'R', color: customColors.R, x: 1, z: 0 },
      { face: 'B', color: customColors.B, x: 0, z: -1 },
      { face: 'L', color: customColors.L, x: -1, z: 0 },
    ];

    const isEdgeSolvedCheck = (s: Cubie[], idx: number): boolean => {
      const target = targets[idx];
      const c = findEdgeCubie(s, customColors.D, target.color);
      return c.currentPos.x === target.x &&
             c.currentPos.y === -1 &&
             c.currentPos.z === target.z &&
             c.colors.D === customColors.D &&
             c.colors[target.face as FaceType] === target.color;
    };

    const arePreviousEdgesSolved = (s: Cubie[], count: number): boolean => {
      for (let idx = 0; idx < count; idx++) {
        if (!isEdgeSolvedCheck(s, idx)) return false;
      }
      return true;
    };

    const allowedMoves: MoveType[] = [];
    const faces: FaceType[] = ['U', 'D', 'R', 'L', 'F', 'B'];
    for (const f of faces) {
      allowedMoves.push({ face: f, direction: 1 });
      allowedMoves.push({ face: f, direction: -1 });
      allowedMoves.push({ face: f, direction: 2 });
    }

    for (let idx = 0; idx < 4; idx++) {
      if (isEdgeSolvedCheck(state, idx)) continue;

      const targetCubie = findEdgeCubie(state, customColors.D, targets[idx].color);
      if (targetCubie.currentPos.y !== 1) {
        const movesToU = solveSubGoal(
          state,
          (s) => findEdgeCubie(s, customColors.D, targets[idx].color).currentPos.y === 1 && arePreviousEdgesSolved(s, idx),
          3,
          allowedMoves
        );
        if (movesToU) {
          allMoves.push(...movesToU);
          state = applyMoves(state, movesToU);
        } else {
          return null;
        }
      }

      const movesToSolve = solveSubGoal(
        state,
        (s) => isEdgeSolvedCheck(s, idx) && arePreviousEdgesSolved(s, idx),
        4,
        allowedMoves
      );
      if (movesToSolve) {
        allMoves.push(...movesToSolve);
        state = applyMoves(state, movesToSolve);
      } else {
        return null;
      }
    }
    return allMoves;
  }

  if (stepId === 2) {
    if (!isStepSolved(cubies, 1, customColors)) return null;

    let state = cubies;
    const allMoves: MoveType[] = [];
    const targets = [
      { face1: 'R', color1: customColors.R, face2: 'F', color2: customColors.F, x: 1, z: 1 },
      { face1: 'R', color1: customColors.R, face2: 'B', color2: customColors.B, x: 1, z: -1 },
      { face1: 'L', color1: customColors.L, face2: 'B', color2: customColors.B, x: -1, z: -1 },
      { face1: 'L', color1: customColors.L, face2: 'F', color2: customColors.F, x: -1, z: 1 },
    ];

    const isCornerSolvedCheck = (s: Cubie[], idx: number): boolean => {
      const target = targets[idx];
      const c = findCornerCubie(s, customColors.D, target.color1, target.color2);
      return c.currentPos.x === target.x &&
             c.currentPos.y === -1 &&
             c.currentPos.z === target.z &&
             c.colors.D === customColors.D &&
             c.colors[target.face1 as FaceType] === target.color1 &&
             c.colors[target.face2 as FaceType] === target.color2;
    };

    const arePreviousCornersSolved = (s: Cubie[], count: number): boolean => {
      for (let idx = 0; idx < count; idx++) {
        if (!isCornerSolvedCheck(s, idx)) return false;
      }
      return true;
    };

    const isCrossSolved = (s: Cubie[]): boolean => {
      return isStepSolved(s, 1, customColors);
    };

    for (let idx = 0; idx < 4; idx++) {
      if (isCornerSolvedCheck(state, idx)) continue;

      const allowedMovesToU: MoveType[] = [];
      const facesToU: FaceType[] = ['U', 'R', 'L', 'F', 'B'];
      for (const f of facesToU) {
        allowedMovesToU.push({ face: f, direction: 1 });
        allowedMovesToU.push({ face: f, direction: -1 });
        allowedMovesToU.push({ face: f, direction: 2 });
      }

      const adjacentFaces = [
        ['F', 'R'],
        ['B', 'R'],
        ['B', 'L'],
        ['F', 'L'],
      ][idx];
      const facesForCorner = [...adjacentFaces, 'U'] as FaceType[];
      const allowedMovesForCorner: MoveType[] = [];
      for (const f of facesForCorner) {
        allowedMovesForCorner.push({ face: f, direction: 1 });
        allowedMovesForCorner.push({ face: f, direction: -1 });
        allowedMovesForCorner.push({ face: f, direction: 2 });
      }

      let targetCubie = findCornerCubie(state, customColors.D, targets[idx].color1, targets[idx].color2);
      if (targetCubie.currentPos.y !== 1) {
        const movesToU = solveSubGoal(
          state,
          (s) => findCornerCubie(s, customColors.D, targets[idx].color1, targets[idx].color2).currentPos.y === 1 &&
                 isCrossSolved(s) &&
                 arePreviousCornersSolved(s, idx),
          3,
          allowedMovesToU
        );
        if (movesToU) {
          allMoves.push(...movesToU);
          state = applyMoves(state, movesToU);
        } else {
          return null;
        }
      }

      targetCubie = findCornerCubie(state, customColors.D, targets[idx].color1, targets[idx].color2);
      if (targetCubie.colors.U === customColors.D) {
        const movesToOrient = solveSubGoal(
          state,
          (s) => {
            const c = findCornerCubie(s, customColors.D, targets[idx].color1, targets[idx].color2);
            return c.colors.U !== customColors.D &&
                   c.currentPos.y === 1 &&
                   isCrossSolved(s) &&
                   arePreviousCornersSolved(s, idx);
          },
          3,
          allowedMovesForCorner
        );
        if (movesToOrient) {
          allMoves.push(...movesToOrient);
          state = applyMoves(state, movesToOrient);
        } else {
          return null;
        }
      }

      const movesToSolve = solveSubGoal(
        state,
        (s) => isCornerSolvedCheck(s, idx) && isCrossSolved(s) && arePreviousCornersSolved(s, idx),
        4,
        allowedMovesForCorner
      );
      if (movesToSolve) {
        allMoves.push(...movesToSolve);
        state = applyMoves(state, movesToSolve);
      } else {
        return null;
      }
    }
    return allMoves;
  }

  if (stepId === 3) {
    if (!isStepSolved(cubies, 2, customColors)) return null;

    let state = cubies;
    const allMoves: MoveType[] = [];
    const targets = [
      { face1: 'F', color1: customColors.F, face2: 'R', color2: customColors.R, x: 1, z: 1 },
      { face1: 'R', color1: customColors.R, face2: 'B', color2: customColors.B, x: 1, z: -1 },
      { face1: 'B', color1: customColors.B, face2: 'L', color2: customColors.L, x: -1, z: -1 },
      { face1: 'L', color1: customColors.L, face2: 'F', color2: customColors.F, x: -1, z: 1 },
    ];

    const isMiddleSolvedCheck = (s: Cubie[], idx: number): boolean => {
      const target = targets[idx];
      const c = findEdgeCubie(s, target.color1, target.color2);
      return c.currentPos.x === target.x &&
             c.currentPos.y === 0 &&
             c.currentPos.z === target.z &&
             c.colors[target.face1 as FaceType] === target.color1 &&
             c.colors[target.face2 as FaceType] === target.color2;
    };

    const arePreviousMiddleSolved = (s: Cubie[], count: number): boolean => {
      for (let idx = 0; idx < count; idx++) {
        if (!isMiddleSolvedCheck(s, idx)) return false;
      }
      return true;
    };

    const isBottomLayerSolved = (s: Cubie[]): boolean => {
      return isStepSolved(s, 2, customColors);
    };

    const transitions = getStep3Transitions();

    for (let idx = 0; idx < 4; idx++) {
      if (isMiddleSolvedCheck(state, idx)) continue;

      const path = solveMacroBFS(
        state,
        (s) => isMiddleSolvedCheck(s, idx) && isBottomLayerSolved(s) && arePreviousMiddleSolved(s, idx),
        transitions,
        3
      );
      if (path) {
        allMoves.push(...path);
        state = applyMoves(state, path);
      } else {
        return null;
      }
    }
    return allMoves;
  }

  if (stepId === 4) {
    if (!isStepSolved(cubies, 3, customColors)) return null;
    return solveMacroBFS(cubies, (s) => isStepSolved(s, 4, customColors), getStep4Transitions(), 4);
  }

  if (stepId === 5) {
    if (!isStepSolved(cubies, 4, customColors)) return null;
    return solveMacroBFS(cubies, (s) => isStepSolved(s, 5, customColors), getStep5Transitions(), 3);
  }

  if (stepId === 6) {
    if (!isStepSolved(cubies, 5, customColors)) return null;
    return solveMacroBFS(cubies, (s) => isStepSolved(s, 6, customColors), getStep6Transitions(), 3);
  }

  if (stepId === 7) {
    if (!isStepSolved(cubies, 6, customColors)) return null;
    return solveMacroBFS(cubies, (s) => isStepSolved(s, 7, customColors), getStep7Transitions(), 3);
  }

  return null;
};

