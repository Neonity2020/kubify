export type FaceType = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';

export interface Cubie {
  id: number;
  currentPos: { x: number; y: number; z: number }; // -1, 0, 1
  // Face colors (e.g., '#ffffff')
  colors: {
    U?: string;
    D?: string;
    R?: string;
    L?: string;
    F?: string;
    B?: string;
  };
}

export type MoveType = {
  face: FaceType;
  direction: 1 | -1 | 2; // 1 = CW, -1 = CCW, 2 = Double turn
};

export const DEFAULT_COLORS = {
  U: '#ffd500', // Yellow
  D: '#ffffff', // White
  R: '#d50000', // Red
  L: '#ff5800', // Orange
  F: '#0051ba', // Blue
  B: '#009b48', // Green
};

// Initialize the 27 cubies
export const initializeCube = (customColors = DEFAULT_COLORS): Cubie[] => {
  const cubies: Cubie[] = [];
  let id = 0;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const colors: Cubie['colors'] = {};

        if (y === 1) colors.U = customColors.U;
        if (y === -1) colors.D = customColors.D;
        if (x === 1) colors.R = customColors.R;
        if (x === -1) colors.L = customColors.L;
        if (z === 1) colors.F = customColors.F;
        if (z === -1) colors.B = customColors.B;

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

// Apply a single clockwise rotation (90 deg) around a face to coordinates and colors of a cubie
const rotateClockwise = (cubie: Cubie, face: FaceType): Cubie => {
  const newPos = { ...cubie.currentPos };
  const newColors = { ...cubie.colors };

  switch (face) {
    case 'R': {
      // Coordinate transform: (x, y, z) -> (x, z, -y)
      newPos.y = cubie.currentPos.z;
      newPos.z = -cubie.currentPos.y;
      // Face color rotation: B gets U, D gets B, F gets D, U gets F
      newColors.B = cubie.colors.U;
      newColors.D = cubie.colors.B;
      newColors.F = cubie.colors.D;
      newColors.U = cubie.colors.F;
      break;
    }
    case 'L': {
      // Coordinate transform: (x, y, z) -> (x, -z, y)
      newPos.y = -cubie.currentPos.z;
      newPos.z = cubie.currentPos.y;
      // Face color rotation: F gets U, D gets F, B gets D, U gets B
      newColors.F = cubie.colors.U;
      newColors.D = cubie.colors.F;
      newColors.B = cubie.colors.D;
      newColors.U = cubie.colors.B;
      break;
    }
    case 'U': {
      // Coordinate transform: (x, y, z) -> (-z, y, x)
      newPos.x = -cubie.currentPos.z;
      newPos.z = cubie.currentPos.x;
      // Face color rotation: R gets B, F gets R, L gets F, B gets L
      newColors.R = cubie.colors.B;
      newColors.F = cubie.colors.R;
      newColors.L = cubie.colors.F;
      newColors.B = cubie.colors.L;
      break;
    }
    case 'D': {
      // Coordinate transform: (x, y, z) -> (z, y, -x)
      newPos.x = cubie.currentPos.z;
      newPos.z = -cubie.currentPos.x;
      // Face color rotation: R gets F, B gets R, L gets B, F gets L
      newColors.R = cubie.colors.F;
      newColors.B = cubie.colors.R;
      newColors.L = cubie.colors.B;
      newColors.F = cubie.colors.L;
      break;
    }
    case 'F': {
      // Coordinate transform: (x, y, z) -> (y, -x, z)
      newPos.x = cubie.currentPos.y;
      newPos.y = -cubie.currentPos.x;
      // Face color rotation: R gets U, D gets R, L gets D, U gets L
      newColors.R = cubie.colors.U;
      newColors.D = cubie.colors.R;
      newColors.L = cubie.colors.D;
      newColors.U = cubie.colors.L;
      break;
    }
    case 'B': {
      // Coordinate transform: (x, y, z) -> (-y, x, z)
      newPos.x = -cubie.currentPos.y;
      newPos.y = cubie.currentPos.x;
      // Face color rotation: L gets U, D gets L, R gets D, U gets R
      newColors.L = cubie.colors.U;
      newColors.D = cubie.colors.L;
      newColors.R = cubie.colors.D;
      newColors.U = cubie.colors.R;
      break;
    }
  }

  return {
    ...cubie,
    currentPos: newPos,
    colors: newColors,
  };
};

// Check if a cubie belongs to a given face slice
export const isCubieInFace = (cubie: Cubie, face: FaceType): boolean => {
  switch (face) {
    case 'U': return cubie.currentPos.y === 1;
    case 'D': return cubie.currentPos.y === -1;
    case 'R': return cubie.currentPos.x === 1;
    case 'L': return cubie.currentPos.x === -1;
    case 'F': return cubie.currentPos.z === 1;
    case 'B': return cubie.currentPos.z === -1;
  }
};

// Apply a move (face rotation) to the cube state
export const applyMove = (cubies: Cubie[], move: MoveType): Cubie[] => {
  const { face, direction } = move;
  
  // A CCW move (-1) is equivalent to 3 CW moves.
  // A Double move (2) is equivalent to 2 CW moves.
  const iterations = direction === 1 ? 1 : direction === 2 ? 2 : 3;

  return cubies.map((cubie) => {
    if (!isCubieInFace(cubie, face)) {
      return cubie;
    }

    let updated = cubie;
    for (let i = 0; i < iterations; i++) {
      updated = rotateClockwise(updated, face);
    }
    return updated;
  });
};

// Check if the cube is fully solved
export const checkSolved = (cubies: Cubie[]): boolean => {
  const faces: FaceType[] = ['U', 'D', 'R', 'L', 'F', 'B'];

  for (const face of faces) {
    const faceColors: string[] = [];
    
    for (const cubie of cubies) {
      if (isCubieInFace(cubie, face)) {
        const color = cubie.colors[face];
        if (color) {
          faceColors.push(color);
        }
      }
    }

    // A face must have exactly 9 stickers of the exact same color
    if (faceColors.length !== 9) return false;
    const firstColor = faceColors[0];
    if (!faceColors.every((c) => c === firstColor)) return false;
  }

  return true;
};

// Generate WCA-style random scramble sequence
export const generateScramble = (length = 20): MoveType[] => {
  const faces: FaceType[] = ['U', 'D', 'R', 'L', 'F', 'B'];
  const directions: (1 | -1 | 2)[] = [1, -1, 2];
  const scramble: MoveType[] = [];

  let lastFace: FaceType | null = null;

  for (let i = 0; i < length; i++) {
    let availableFaces = faces.filter((f) => f !== lastFace);
    
    // Also avoid immediately repeating axes if possible, e.g. R L R is okay, but R R is bad
    // If we have at least 2 moves, check if the face before the last one is the same axis
    if (scramble.length >= 2) {
      const prevPrevFace = scramble[scramble.length - 2].face;
      const prevFace = scramble[scramble.length - 1].face;
      
      // Pairs of opposite faces: (U,D), (R,L), (F,B)
      const isOpposite = (f1: FaceType, f2: FaceType) => {
        return (
          (f1 === 'U' && f2 === 'D') || (f1 === 'D' && f2 === 'U') ||
          (f1 === 'R' && f2 === 'L') || (f1 === 'L' && f2 === 'R') ||
          (f1 === 'F' && f2 === 'B') || (f1 === 'B' && f2 === 'F')
        );
      };

      if (isOpposite(prevFace, prevPrevFace)) {
        // If we just did U D, we shouldn't do U next, as that would sandwich D between two U turns.
        availableFaces = availableFaces.filter((f) => f !== prevPrevFace);
      }
    }

    const face = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    scramble.push({ face, direction });
    lastFace = face;
  }

  return scramble;
};

// Convert move object to standard notation (e.g. R, U', F2)
export const moveToString = (move: MoveType): string => {
  if (move.direction === 1) return move.face;
  if (move.direction === -1) return `${move.face}'`;
  return `${move.face}2`;
};

// Parse standard notation string back to move object
export const parseMoveString = (moveStr: string): MoveType | null => {
  const cleanStr = moveStr.trim();
  if (cleanStr.length === 0) return null;

  const faceStr = cleanStr[0].toUpperCase();
  const face = faceStr as FaceType;
  if (!['U', 'D', 'R', 'L', 'F', 'B'].includes(face)) return null;

  let direction: 1 | -1 | 2 = 1;
  if (cleanStr.includes("'")) {
    direction = -1;
  } else if (cleanStr.includes('2')) {
    direction = 2;
  }

  return { face, direction };
};

export const getRelativeSector = (rotateY: number): number => {
  // Normalize Y to [0, 360)
  const normalizedY = ((rotateY % 360) + 360) % 360;
  return Math.floor(normalizedY / 90) % 4;
};

export const mapRelativeToPhysical = (face: FaceType, rotateY: number): FaceType => {
  if (face === 'U' || face === 'D') return face;
  
  const sector = getRelativeSector(rotateY);
  
  // Mapping relative direction to physical cube face
  const mappings: Record<number, Record<string, FaceType>> = {
    0: { F: 'F', R: 'R', B: 'B', L: 'L' },
    1: { F: 'L', R: 'F', B: 'R', L: 'B' },
    2: { F: 'B', R: 'L', B: 'F', L: 'R' },
    3: { F: 'R', R: 'B', B: 'L', L: 'F' },
  };
  
  return mappings[sector][face] || face;
};

export const mapPhysicalToRelative = (face: FaceType, rotateY: number): FaceType => {
  if (face === 'U' || face === 'D') return face;
  
  const sector = getRelativeSector(rotateY);
  
  // Mapping physical cube face back to relative screen perspective label
  const mappings: Record<number, Record<string, FaceType>> = {
    0: { F: 'F', R: 'R', B: 'B', L: 'L' },
    1: { L: 'F', F: 'R', R: 'B', B: 'L' },
    2: { B: 'F', L: 'R', F: 'B', R: 'L' },
    3: { R: 'F', B: 'R', L: 'B', F: 'L' },
  };
  
  return mappings[sector][face] || face;
};

export const mapPhysicalPosToRelative = (
  pos: { x: number; y: number; z: number },
  rotateY: number
): { x: number; y: number; z: number } => {
  const sector = getRelativeSector(rotateY);
  switch (sector) {
    case 0:
      return { x: pos.x, y: pos.y, z: pos.z };
    case 1:
      return { x: pos.z, y: pos.y, z: -pos.x };
    case 2:
      return { x: -pos.x, y: pos.y, z: -pos.z };
    case 3:
      return { x: -pos.z, y: pos.y, z: pos.x };
    default:
      return { x: pos.x, y: pos.y, z: pos.z };
  }
};


