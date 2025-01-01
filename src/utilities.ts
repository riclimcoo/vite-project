import { disp } from "./Position";

export type PieceType = keyof typeof FancyPiece;

export enum FancyPiece {
  "K" = "♔",
  "Q" = "♕",
  "R" = "♖",
  "B" = "♗",
  "N" = "♘",
  "P" = "♙",
  // "_" = " ",
  "k" = "♚",
  "q" = "♛",
  "r" = "♜",
  "b" = "♝",
  "n" = "♞",
  "p" = "♟",
}

export type playerColor = "black" | "white";

export function isNumericChar(c: string) {
  return typeof c === "string" && c.length === 1 && c >= "0" && c <= "9";
}
export function isPieceChar(ch: string) {
  return ["p", "q", "n", "r", "b", "k", "P", "Q", "N", "R", "B", "K"].includes(
    ch
  );
}
export function quot(x: number, y: number) {
  return Math.trunc(x / y);
}

export function flipColor(color: playerColor) {
  return color === "white" ? "black" : "white";
}

export type rank = "p" | "q" | "k" | "n" | "b" | "r";

export const ORTHO = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as Array<disp>;

export const DIAG = [
  [-1, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
] as Array<disp>;

export const STAR = ORTHO.concat(DIAG);

export const KNIGHT_LS = [
  [2, 1],
  [-2, 1],
  [2, -1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
] as Array<disp>;
