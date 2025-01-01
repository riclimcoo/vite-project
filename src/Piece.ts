import { PieceType, rank } from "./utilities";

export class Piece {
  type: PieceType;
  constructor(type: PieceType) {
    this.type = type;
  }
  get rank() {
    return this.type.toLowerCase() as rank;
  }
  get color() {
    return this.type[0] === this.type[0].toUpperCase() ? "white" : "black";
  }
  get enemyColor() {
    return this.type[0] === this.type[0].toUpperCase() ? "black" : "white";
  }
}
