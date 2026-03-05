export type GameType = 'dots-and-boxes' | 'tic-tac-toe' | 'gomoku';

export interface GridConfig {
  id: string;
  name: string;
  rows: number;
  cols: number;
  gameType?: GameType;
}

export type Player = number;
export type LineType = 'horizontal' | 'vertical';

export interface Line {
  r: number;
  c: number;
  type: LineType;
}

export interface DotsAndBoxesState {
  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  boxes: (Player | null)[][];
  scores: Record<number, number>;
}

export interface TicTacToeState {
  board: (Player | null)[][];
}

export interface GomokuState {
  board: (Player | null)[][];
}

export interface GameState {
  gameType: GameType;
  config: GridConfig;
  playerCount: number;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  dotsAndBoxes?: DotsAndBoxesState;
  ticTacToe?: TicTacToeState;
  gomoku?: GomokuState;
}

export interface ServerMessage {
  type: 'WELCOME' | 'GAME_START' | 'GAME_UPDATE' | 'PLAYER_LEFT' | 'ERROR';
  payload?: any;
}

export interface ClientMessage {
  type: 'JOIN' | 'CREATE' | 'MOVE' | 'RESTART';
  payload?: any;
}
