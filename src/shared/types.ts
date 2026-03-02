export interface GridConfig {
  id: string;
  name: string;
  rows: number;
  cols: number;
}

export type Player = number;
export type LineType = 'horizontal' | 'vertical';

export interface Line {
  r: number;
  c: number;
  type: LineType;
}

export interface GameState {
  config: GridConfig;
  playerCount: number;
  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  boxes: (Player | null)[][];
  currentPlayer: Player;
  scores: Record<number, number>;
  winner: Player | 'draw' | null;
}

export interface ServerMessage {
  type: 'WELCOME' | 'GAME_START' | 'GAME_UPDATE' | 'PLAYER_LEFT' | 'ERROR';
  payload?: any;
}

export interface ClientMessage {
  type: 'JOIN' | 'CREATE' | 'MOVE' | 'RESTART';
  payload?: any;
}
