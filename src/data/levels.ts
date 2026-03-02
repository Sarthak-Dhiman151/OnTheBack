import { GridConfig } from '../shared/types';

export type { GridConfig };

export const GRIDS: GridConfig[] = [
  {
    id: 'small',
    name: '3x3 (Quick)',
    rows: 3,
    cols: 3,
  },
  {
    id: 'medium',
    name: '5x5 (Classic)',
    rows: 5,
    cols: 5,
  },
  {
    id: 'large',
    name: '7x7 (Long)',
    rows: 7,
    cols: 7,
  }
];
