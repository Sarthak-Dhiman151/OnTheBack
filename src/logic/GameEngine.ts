import { GridConfig, GameState, Line, Player } from '../shared/types';

export class GameEngine {
  state: GameState;

  constructor(config: GridConfig, playerCount: number = 2) {
    this.state = this.createInitialState(config, playerCount);
  }

  private createInitialState(config: GridConfig, playerCount: number): GameState {
    const scores: Record<number, number> = {};
    for (let i = 1; i <= playerCount; i++) {
      scores[i] = 0;
    }

    return {
      gameType: 'dots-and-boxes',
      config,
      playerCount,
      currentPlayer: 1,
      winner: null,
      dotsAndBoxes: {
        horizontalLines: Array(config.rows).fill(null).map(() => Array(config.cols - 1).fill(false)),
        verticalLines: Array(config.rows - 1).fill(null).map(() => Array(config.cols).fill(false)),
        boxes: Array(config.rows - 1).fill(null).map(() => Array(config.cols - 1).fill(null)),
        scores,
      }
    };
  }

  public applyMove(move: any, player: Player): boolean {
    const line = move as Line;
    // Validate move
    if (this.state.winner) return false;
    if (player !== this.state.currentPlayer) return false;
    if (!this.state.dotsAndBoxes) return false;

    const { r, c, type } = line;
    
    // Check bounds and if already taken
    if (type === 'horizontal') {
      if (this.state.dotsAndBoxes.horizontalLines[r][c]) return false;
      this.state.dotsAndBoxes.horizontalLines[r][c] = true;
    } else {
      if (this.state.dotsAndBoxes.verticalLines[r][c]) return false;
      this.state.dotsAndBoxes.verticalLines[r][c] = true;
    }

    // Check for completed boxes
    let boxCompleted = false;
    const { rows, cols } = this.state.config;

    if (type === 'horizontal') {
      // Check Box Above: row r-1, col c
      if (r > 0) {
        if (
          this.state.dotsAndBoxes.horizontalLines[r-1][c] && 
          this.state.dotsAndBoxes.verticalLines[r-1][c] && 
          this.state.dotsAndBoxes.verticalLines[r-1][c+1]
        ) {
          this.state.dotsAndBoxes.boxes[r-1][c] = player;
          boxCompleted = true;
        }
      }
      // Check Box Below: row r, col c
      if (r < rows - 1) {
        if (
          this.state.dotsAndBoxes.horizontalLines[r+1][c] && 
          this.state.dotsAndBoxes.verticalLines[r][c] && 
          this.state.dotsAndBoxes.verticalLines[r][c+1]
        ) {
          this.state.dotsAndBoxes.boxes[r][c] = player;
          boxCompleted = true;
        }
      }
    } else {
      // Check Box Left: row r, col c-1
      if (c > 0) {
        if (
          this.state.dotsAndBoxes.verticalLines[r][c-1] && 
          this.state.dotsAndBoxes.horizontalLines[r][c-1] && 
          this.state.dotsAndBoxes.horizontalLines[r+1][c-1]
        ) {
          this.state.dotsAndBoxes.boxes[r][c-1] = player;
          boxCompleted = true;
        }
      }
      // Check Box Right: row r, col c
      if (c < cols - 1) {
        if (
          this.state.dotsAndBoxes.verticalLines[r][c+1] && 
          this.state.dotsAndBoxes.horizontalLines[r][c] && 
          this.state.dotsAndBoxes.horizontalLines[r+1][c]
        ) {
          this.state.dotsAndBoxes.boxes[r][c] = player;
          boxCompleted = true;
        }
      }
    }

    // Update Scores
    if (boxCompleted) {
      const newScores = { ...this.state.dotsAndBoxes.scores };
      
      // Reset scores to 0 and recalculate from boxes
      for (let i = 1; i <= this.state.playerCount; i++) {
          newScores[i] = 0;
      }
      
      this.state.dotsAndBoxes.boxes.forEach(row => row.forEach(owner => {
        if (owner) newScores[owner]++;
      }));
      
      this.state.dotsAndBoxes.scores = newScores;

      // Check Win
      const totalBoxes = (rows - 1) * (cols - 1);
      const totalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      
      if (totalScore === totalBoxes) {
        // Find player with max score
        let maxScore = -1;
        let winners: number[] = [];
        
        for (let i = 1; i <= this.state.playerCount; i++) {
            const score = newScores[i];
            if (score > maxScore) {
                maxScore = score;
                winners = [i];
            } else if (score === maxScore) {
                winners.push(i);
            }
        }
        
        if (winners.length > 1) {
            this.state.winner = 'draw';
        } else {
            this.state.winner = winners[0];
        }
      }
      // Player keeps turn
    } else {
      // Cycle player
      this.state.currentPlayer = (this.state.currentPlayer % this.state.playerCount) + 1;
    }

    return true;
  }
}
