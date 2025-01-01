import { Piece } from "../Piece";
import { disp, Position } from "../Position";
import {
  DIAG,
  flipColor,
  isNumericChar,
  isPieceChar,
  KNIGHT_LS,
  ORTHO,
  PieceType,
  playerColor,
  STAR,
} from "../utilities";

export default class BoardModel {
  board: Array<Piece | undefined>;
  enPassantPos: Position | undefined;
  activePlayer: playerColor;
  castlingRights: {
    white: {
      queenSide: boolean;
      kingSide: boolean;
    };
    black: {
      queenSide: boolean;
      kingSide: boolean;
    };
  };

  constructor(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    fen = "r3k2r/8/8/8/8/8/8/R3K2R";
    this.board = Array(64);
    this.readFen(fen);
    this.activePlayer = "white";
    this.castlingRights = {
      white: {
        queenSide: true,
        kingSide: true,
      },
      black: {
        queenSide: true,
        kingSide: true,
      },
    };
  }

  readFen(fen: string) {
    this.board = Array(64);
    const arr = fen.split("");
    let i = 0;
    let j = 0;
    let ch = arr.shift();
    while (ch) {
      if (isNumericChar(ch)) {
        i += Number(ch);
      } else if (isPieceChar(ch)) {
        this.board[i + j * 8] = new Piece(ch as PieceType);
        i += 1;
      } else if (ch == "/") {
        i = 0;
        j += 1;
      }
      ch = arr.shift();
    }
  }

  get flat() {
    return this.board.map((p) => (p ? p.type : undefined));
  }

  at(idx: number) {
    return this.board[idx];
  }

  atPos(pos: Position) {
    return this.board[pos.x + pos.y * 8];
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
    this.board[dest_idx] = piece;
  }

  // private placeAtPos(piece: Piece | undefined, pos: Position) {
  //   this.board[pos.x + pos.y * 8] = piece;
  // }

  private get copy() {
    const copy = new BoardModel();
    copy.board = this.board.slice();
    copy.enPassantPos = this.enPassantPos;
    return copy;
  }

  move(mover_idx: number, dest_idx: number) {
    const piece = this.at(mover_idx);
    if (piece === undefined) {
      return;
    }
    // enpassant
    else if (
      piece.rank === "p" &&
      this.enPassantPos &&
      dest_idx === this.enPassantPos.toIdx
    ) {
      const forwardDir = piece.color == "white" ? -1 : 1;
      this._place(undefined, this.enPassantPos.add([0, -forwardDir]).toIdx);
    }
    // castle
    const didCastle =
      piece.rank === "k" && Math.abs((mover_idx % 8) - (dest_idx % 8)) > 1;
    if (didCastle) {
      const side = dest_idx - mover_idx > 0 ? "kingSide" : "queenSide";
      const dir = side === "kingSide" ? 1 : -1;
      const rookIdx = new Position(
        side === "queenSide" ? 0 : 7,
        piece.color === "black" ? 0 : 7
      ).toIdx;
      const rookDest = Position.fromIdx(dest_idx).add([-dir, 0]).toIdx;
      this.move(rookIdx, rookDest);
    }
    this._place(piece, dest_idx);
    this._place(undefined, mover_idx);
  }

  play(mover_idx: number, dest_idx: number) {
    const piece = this.at(mover_idx);
    const pos = Position.fromIdx(mover_idx);
    if (piece === undefined) {
      console.error("Trying to move an empty piece");
      return;
    } else if (piece.color !== this.activePlayer) {
      console.error("It's not your turn.");
      return;
    }
    this.move(mover_idx, dest_idx); // move must go before en passant memo

    // en passant memo
    {
      const startingRow = piece.color == "white" ? 6 : 1;
      const forwardDir = piece.color == "white" ? -1 : 1;
      const posInFront = pos.add([0, forwardDir]);
      const posIn2Front = pos.add([0, 2 * forwardDir]);
      if (
        piece.rank === "p" &&
        pos.y === startingRow &&
        dest_idx === posIn2Front.toIdx
      ) {
        this.enPassantPos = posInFront;
      } else {
        this.enPassantPos = undefined;
      }
    }

    // castle memo
    if (piece.rank === "k") {
      this.castlingRights[piece.color].kingSide = false;
      this.castlingRights[piece.color].queenSide = false;
    }
    if (
      piece.rank === "r" &&
      mover_idx === (piece.color === "black" ? 0 : 7) * 8
    ) {
      this.castlingRights[piece.color].queenSide = false;
    }
    if (
      piece.rank === "r" &&
      mover_idx === 7 + (piece.color === "black" ? 0 : 7) * 8
    ) {
      this.castlingRights[piece.color].kingSide = false;
    }

    this.activePlayer = flipColor(this.activePlayer);
  }

  // private forward(pos: Position, d: number) {
  //   const piece = this.atPos(pos);
  //   if (piece === undefined) return;
  //   const forwardDir = piece.color == "white" ? -1 : 1;
  //   return pos.add([0, d * forwardDir]);
  // }

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
    if (activePiece === undefined || activePiece.color !== this.activePlayer) {
      return [];
    }
    const myColor = activePiece.color;
    const squaresToCheck = this.validSquaresWithoutCheckingForChecks(idx);
    const newValidSquares: Array<number> = [];
    for (const destIdx of squaresToCheck) {
      const tempGame = this.copy;
      tempGame.move(idx, destIdx);
      if (!tempGame.underCheck(myColor)) {
        newValidSquares.push(destIdx);
      }
    }

    // Castle Logic
    if (activePiece.rank === "k") {
      const pos = Position.fromIdx(idx);
      if (this.canCastle(myColor, "queenSide")) {
        newValidSquares.push(pos.add([-2, 0]).toIdx);
      }
      if (this.canCastle(myColor, "kingSide")) {
        newValidSquares.push(pos.add([2, 0]).toIdx);
      }
    }

    return newValidSquares;
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

      case "k":
        // castle
        if (this.canCastle(myColor, "queenSide")) {
          arr.push(pos.add([-2, 0]));
        }
        if (this.canCastle(myColor, "kingSide")) {
          arr.push(pos.add([2, 0]));
        }
        arr = this.controlledSquares(idx);
        break;
      default:
        arr = this.controlledSquares(idx);
    }
    arr = arr.filter((pos) => this.atPos(pos)?.color !== myColor);
    return arr.map((pos) => pos.toIdx);
  }

  // where(pieceType: PieceType) {
  //   for (let i = 0; i < 64; i++) {
  //     const piece = this.at(i);
  //     if (piece && piece.type == pieceType) {
  //       return i;
  //     }
  //   }
  //   return undefined;
  // }

  findKing(color: playerColor) {
    for (let i = 0; i < 64; i++) {
      const piece = this.at(i);
      if (piece && piece.color === color && piece.rank === "k") {
        return i;
      }
    }
    throw new Error("No king found");
  }

  underCheck(color: playerColor) {
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

  safe(idx: number, color: playerColor) {
    for (let i = 0; i < 64; i++) {
      const piece = this.at(i);
      if (
        piece &&
        piece.color === flipColor(color) &&
        this.controlledSquares(i)
          .map((x) => x.toIdx)
          .includes(idx)
      ) {
        return false;
      }
    }
    return true;
  }

  canCastle(color: playerColor, side: "queenSide" | "kingSide") {
    const kingIdx = this.findKing(color);

    const disps: Array<disp> =
      side === "queenSide"
        ? [
            [-3, 0],
            [-2, 0],
            [-1, 0],
          ]
        : [
            [1, 0],
            [2, 0],
          ];

    if (this.castlingRights[color][side] === false) {
      return false;
    }
    const pos = Position.fromIdx(kingIdx);
    return disps
      .map((disp) => pos.add(disp).toIdx)
      .every((p) => this.at(p) === undefined && this.safe(p, color));
  }
}
