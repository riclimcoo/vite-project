import { quot } from "./utilities";

export class Position {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add([a, b]: [a: number, b: number]) {
    return new Position(this.x + a, this.y + b);
  }

  scale(z: number) {
    return new Position(z * this.x, z * this.y);
  }

  eq(other: Position | undefined) {
    return other !== undefined && this.x === other.x && this.y === other.y;
  }

  get toIdx() {
    return this.x + this.y * 8;
  }

  get isValid() {
    return this.x >= 0 && this.x < 8 && this.y >= 0 && this.y < 8;
  }

  static fromIdx(idx: number) {
    return new Position(idx % 8, quot(idx, 8));
  }
}
export type disp = [x: number, y: number];
