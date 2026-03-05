import { GridConfig, GameState, Player } from '../shared/types';

export class TicTacToeEngine {
  state: GameState;

  constructor(config: GridConfig, playerCount: number = 2) {
    this.state = this.createInitialState(config, playerCount);
  }

  private createInitialState(config: GridConfig, playerCount: number): GameState {
    return {
      gameType: 'tic-tac-toe',
      config,
      playerCount,
      currentPlayer: 1,
      winner: null,
      ticTacToe: {
        board: Array(3).fill(null).map(() => Array(3).fill(null)),
      }
    };
  }

  public applyMove(move: { r: number, c: number }, player: Player): boolean {
    if (this.state.winner) return false;
    if (player !== this.state.currentPlayer) return false;
    if (!this.state.ticTacToe) return false;

    const { r, c } = move;
    if (r < 0 || r >= 3 || c < 0 || c >= 3) return false;
    if (this.state.ticTacToe.board[r][c] !== null) return false;

    this.state.ticTacToe.board[r][c] = player;

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
    if (!this.state.ticTacToe) return false;
    const board = this.state.ticTacToe.board;
    const player = board[r][c];

    // Check row
    if (board[r].every(cell => cell === player)) return true;

    // Check column
    if (board.every(row => row[c] === player)) return true;

    // Check diagonals
    if (r === c) {
      if (board.every((row, i) => row[i] === player)) return true;
    }
    if (r + c === 2) {
      if (board.every((row, i) => row[2 - i] === player)) return true;
    }

    return false;
  }

  private checkDraw(): boolean {
    if (!this.state.ticTacToe) return false;
    return this.state.ticTacToe.board.every(row => row.every(cell => cell !== null));
  }
}
