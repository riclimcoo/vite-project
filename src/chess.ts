import { Piece } from "./Piece";
import { disp, Position } from "./Position";
import {
  DIAG,
  isNumericChar,
  isPieceChar,
  KNIGHT_LS,
  ORTHO,
  PieceType,
  quot,
  STAR,
} from "./utilities";

export default class BoardModel {
  board: Array<Array<Piece | undefined>>;
  constructor() {
    this.board = [...Array(8)].map(() => Array(8));
    this.readFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  }

  readFen(fen: string) {
    this.board = [...Array(8)].map(() => Array(8));
    let arr = fen.split("");
    let i = 0;
    let j = 0;
    let ch = arr.shift();
    while (ch) {
      if (isNumericChar(ch)) {
        i += Number(ch);
      } else if (isPieceChar(ch)) {
        this.board[i][j] = new Piece(ch as PieceType);
        i += 1;
      } else if (ch == "/") {
        i = 0;
        j += 1;
      }
      ch = arr.shift();
    }
  }

  get flat() {
    let myReturn: Array<PieceType> = Array(64);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let piece = this.board[i][j];
        myReturn[i + j * 8] = piece ? piece.type : "_";
      }
    }
    return myReturn;
  }

  at(idx: number) {
    return this.board[idx % 8][quot(idx, 8)];
  }

  posAt(pos: Position) {
    return this.board[pos.x][pos.y];
  }

  _seek(pos: Position, disp: disp) {
    let candidatePos = pos.add(disp);
    let candidateArr = [];
    const piece = this.posAt(pos);
    if (piece == undefined) {
      return [];
    }
    const myColor = piece.color;
    const theirColor = piece.color === "white" ? "black" : "white";
    while (
      candidatePos.isValid &&
      this.posAt(candidatePos)?.color !== myColor
    ) {
      candidateArr.push(candidatePos);
      if (this.posAt(candidatePos)?.color == theirColor) {
        break;
      }
      candidatePos = candidatePos.add(disp);
    }
    return candidateArr;
  }

  _multi_seek(pos: Position, disps: Array<disp>) {
    return disps.map((disp) => this._seek(pos, disp as disp)).flat();
  }

  _place(piece: Piece | undefined, dest_idx: number) {
    this.board[dest_idx % 8][quot(dest_idx, 8)] = piece;
  }

  move(mover_idx: number, dest_idx: number) {
    const piece = this.at(mover_idx);
    this._place(piece, dest_idx);
    this._place(undefined, mover_idx);
  }

  validSquares(idx: number) {
    const activePiece = this.at(idx);
    if (activePiece === undefined) {
      return [];
    }
    const pos = Position.fromIdx(idx);
    const myColor = activePiece.color;
    const theirColor = activePiece.color === "white" ? "black" : "white";

    let arr: Array<Position> = [];
    switch (activePiece.rank) {
      case "p":
        const forwardDir = activePiece.color == "white" ? -1 : 1;
        const startingRow = activePiece.color == "white" ? 6 : 1;

        let posInFront = pos.add([0, forwardDir]);

        if (this.posAt(posInFront) === undefined) {
          arr.push(posInFront);
          let posInFront2 = posInFront.add([0, forwardDir]);
          if (pos.y === startingRow && this.posAt(posInFront2) === undefined) {
            arr.push(posInFront2);
          }
        }

        let capturePos = [
          [1, forwardDir],
          [-1, forwardDir],
        ]
          .map((disp) => pos.add(disp as disp))
          .filter((p) => p.isValid && this.posAt(p)?.color === theirColor);

        arr = arr.concat(capturePos);
        break;

      case "n":
        arr = KNIGHT_LS.map((disp) => pos.add(disp));
        break;

      case "k":
        arr = STAR.map((disp) => pos.add(disp));
        break;

      case "r":
        arr = this._multi_seek(pos, ORTHO);
        break;

      case "b":
        arr = this._multi_seek(pos, DIAG);
        break;

      case "q":
        arr = this._multi_seek(pos, STAR);
        break;
    }
    arr = arr.filter((pos) => pos.isValid);
    arr = arr.filter((pos) => this.posAt(pos)?.color !== myColor);
    return arr.map((pos) => pos.flat);
  }
}

export const boardModel = new BoardModel();
