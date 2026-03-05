import { GridConfig, GameState, Player } from '../shared/types';

export class GomokuEngine {
  state: GameState;
  private readonly BOARD_SIZE = 15;

  constructor(config: GridConfig, playerCount: number = 2) {
    this.state = this.createInitialState(config, playerCount);
  }

  private createInitialState(config: GridConfig, playerCount: number): GameState {
    return {
      gameType: 'gomoku',
      config,
      playerCount,
      currentPlayer: 1,
      winner: null,
      gomoku: {
        board: Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(null)),
      }
    };
  }

  public applyMove(move: { r: number, c: number }, player: Player): boolean {
    if (this.state.winner) return false;
    if (player !== this.state.currentPlayer) return false;
    if (!this.state.gomoku) return false;

    const { r, c } = move;
    if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) return false;
    if (this.state.gomoku.board[r][c] !== null) return false;

    this.state.gomoku.board[r][c] = player;

    if (this.checkWin(r, c)) {
      this.state.winner = player;
    } else if (this.checkDraw()) {
      this.state.winner = 'draw';
    } else {
      this.state.currentPlayer = (this.state.currentPlayer % this.state.playerCount) + 1;
    }

    return true;
  }

  private checkWin(r: number, c: number): boolean {
    if (!this.state.gomoku) return false;
    const board = this.state.gomoku.board;
    const player = board[r][c];
    if (!player) return false;

    const directions = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal down-right
      [1, -1]  // Diagonal down-left
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // Check in one direction
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < this.BOARD_SIZE && nc >= 0 && nc < this.BOARD_SIZE && board[nr][nc] === player) {
          count++;
        } else {
          break;
        }
      }
      
      // Check in the opposite direction
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr >= 0 && nr < this.BOARD_SIZE && nc >= 0 && nc < this.BOARD_SIZE && board[nr][nc] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) return true;
    }

    return false;
  }

  private checkDraw(): boolean {
    if (!this.state.gomoku) return false;
    return this.state.gomoku.board.every(row => row.every(cell => cell !== null));
  }
}
