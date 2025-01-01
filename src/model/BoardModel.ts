import { Piece } from "../Piece";
import { disp, Position } from "../Position";
import {
  DIAG,
  isNumericChar,
  isPieceChar,
  KNIGHT_LS,
  ORTHO,
  PieceType,
  quot,
  STAR,
} from "../utilities";

export default class BoardModel {
  board: Array<Array<Piece | undefined>>;
  enPassantPos: Position | undefined;
  constructor() {
    this.board = [...Array(8)].map(() => Array(8));
    this.readFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  }

  readFen(fen: string) {
    this.board = [...Array(8)].map(() => Array(8));
    const arr = fen.split("");
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
    const myReturn: Array<PieceType | undefined> = Array(64);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = this.board[i][j];
        myReturn[i + j * 8] = piece ? piece.type : undefined;
      }
    }
    return myReturn;
  }

  at(idx: number) {
    return this.board[idx % 8][quot(idx, 8)];
  }

  atPos(pos: Position) {
    return this.board[pos.x][pos.y];
  }

  private seek(pos: Position, disp: disp) {
    let candidatePos = pos.add(disp);
    const candidateArr = [];
    const piece = this.atPos(pos);
    if (piece == undefined) {
      return [];
    }
    const myColor = piece.color;
    const theirColor = piece.color === "white" ? "black" : "white";
    while (
      candidatePos.isValid &&
      this.atPos(candidatePos)?.color !== myColor
    ) {
      candidateArr.push(candidatePos);
      if (this.atPos(candidatePos)?.color == theirColor) {
        break;
      }
      candidatePos = candidatePos.add(disp);
    }
    return candidateArr;
  }

  private seekFromDispArr(pos: Position, disps: Array<disp>) {
    return disps.map((disp) => this.seek(pos, disp as disp)).flat();
  }

  private sweepFromDispArr(pos: Position, dispArr: Array<disp>) {
    return dispArr.map((disp) => pos.add(disp)).filter((p) => p.isValid);
  }

  _place(piece: Piece | undefined, dest_idx: number) {
    this.board[dest_idx % 8][quot(dest_idx, 8)] = piece;
  }

  private placeAtPos(piece: Piece | undefined, pos: Position) {
    this.board[pos.x][pos.y] = piece;
  }

  private get boardCopy() {
    return this.board.map((inner) => inner.slice());
  }

  move(mover_idx: number, dest_idx: number) {
    const piece = this.at(mover_idx);
    this._place(piece, dest_idx);
    this._place(undefined, mover_idx);
  }

  play(mover_idx: number, dest_idx: number) {
    const piece = this.at(mover_idx);
    if (piece === undefined) {
      return;
    }
    const pos = Position.fromIdx(mover_idx);
    const startingRow = piece.color == "white" ? 6 : 1;
    const forwardDir = piece.color == "white" ? -1 : 1;
    const posInFront = pos.add([0, forwardDir]);
    const posIn2Front = pos.add([0, 2 * forwardDir]);

    // enpassant
    if (
      piece.rank === "p" &&
      this.enPassantPos &&
      dest_idx === this.enPassantPos.toIdx
    ) {
      this._place(undefined, this.enPassantPos.add([0, -forwardDir]).toIdx);
    }
    if (
      piece.rank === "p" &&
      pos.y === startingRow &&
      dest_idx === posIn2Front.toIdx
    ) {
      this.enPassantPos = posInFront;
    } else {
      this.enPassantPos = undefined;
    }
    this.move(mover_idx, dest_idx);
    console.log(this.underCheck("black"));
  }

  _forward(pos: Position, d: number) {
    const piece = this.atPos(pos);
    if (piece === undefined) return;
    const forwardDir = piece.color == "white" ? -1 : 1;
    return pos.add([0, d * forwardDir]);
  }

  controlledSquares(idx: number) {
    const activePiece = this.at(idx);
    if (activePiece === undefined) {
      return [];
    }
    const pos = Position.fromIdx(idx);
    const forwardDir = activePiece.color == "white" ? -1 : 1;
    const PAWN_V = [
      [1, forwardDir],
      [-1, forwardDir],
    ] as Array<disp>;

    switch (activePiece.rank) {
      case "p":
        return this.sweepFromDispArr(pos, PAWN_V);

      case "n":
        return this.sweepFromDispArr(pos, KNIGHT_LS);

      case "k":
        return this.sweepFromDispArr(pos, STAR);

      case "r":
        return this.seekFromDispArr(pos, ORTHO);

      case "b":
        return this.seekFromDispArr(pos, DIAG);

      case "q":
        return this.seekFromDispArr(pos, STAR);
    }
  }

  validSquares(idx: number) {
    const activePiece = this.at(idx);
    if (activePiece === undefined) {
      return [];
    }
    const squaresToCheck = this.validSquaresWithoutCheckingForChecks(idx);
    const prevBoard = this.boardCopy;
    const newValidSquares: Array<number> = [];
    // for (const destIdx of squaresToCheck) {
    //   this.move(idx, destIdx);
    //   if (!this.underCheck(activePiece.color)) {
    //     newValidSquares.push(destIdx);
    //   }
    //   this.board = prevBoard;
    // }
    return squaresToCheck;
  }

  validSquaresWithoutCheckingForChecks(idx: number) {
    const activePiece = this.at(idx);
    if (activePiece === undefined) {
      return [];
    }
    const pos = Position.fromIdx(idx);
    const myColor = activePiece.color;
    const theirColor = activePiece.color === "white" ? "black" : "white";
    const forwardDir = activePiece.color == "white" ? -1 : 1;
    const startingRow = activePiece.color == "white" ? 6 : 1;
    const posInFront = pos.add([0, forwardDir]);
    const posInFront2 = posInFront.add([0, forwardDir]);
    const pawnCapturePos = [
      [1, forwardDir],
      [-1, forwardDir],
    ]
      .map((disp) => pos.add(disp as disp))
      .filter(
        (p) =>
          p.isValid &&
          (this.atPos(p)?.color === theirColor || // capture enemy
            (p.eq(this.enPassantPos) && this.atPos(p) === undefined)) // en passant
      );

    let arr: Array<Position> = [];
    switch (activePiece.rank) {
      case "p":
        if (this.atPos(posInFront) === undefined) {
          arr.push(posInFront);
          if (pos.y === startingRow && this.atPos(posInFront2) === undefined) {
            arr.push(posInFront2);
          }
        }
        arr = arr.concat(pawnCapturePos);
        break;

      default:
        arr = this.controlledSquares(idx);
    }
    arr = arr.filter((pos) => this.atPos(pos)?.color !== myColor);
    return arr.map((pos) => pos.toIdx);
  }

  underCheck(color: "black" | "white") {
    let kingIdx;
    for (let i = 0; i < 64; i++) {
      const piece = this.at(i);
      if (piece && piece.color === color && piece.rank === "k") {
        kingIdx = i;
        break;
      }
    }
    if (kingIdx === undefined) {
      console.error("King not found.");
      return false;
    }
    for (let i = 0; i < 64; i++) {
      const piece = this.at(i);
      if (
        piece &&
        piece.color !== color &&
        this.controlledSquares(i)
          .map((x) => x.toIdx)
          .includes(kingIdx)
      ) {
        return true;
      }
    }
    return false;
  }
}
