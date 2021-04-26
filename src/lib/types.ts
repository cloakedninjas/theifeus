export interface Treasure {
  name: string;
  description: string;
  noise: number;
  value: number;
  heart?: boolean;
}

export const DIR_VECTOR = {
  n: {
    x: 0,
    y: -1
  },
  e: {
    x: 1,
    y: 0
  },
  s: {
    x: 0,
    y: 1
  },
  w: {
    x: -1,
    y: 0
  }
};

export const INTERACTIVE = {
  cursor: 'pointer'
};
