import { PieceType, FancyPiece } from "./utilities";

type selectionStateType = "selected" | "unselected" | "highlighted";

export default function Square({
  piece,
  idx,
  selectionState,
  onClick,
}: {
  piece: PieceType | undefined;
  idx: number;
  selectionState: selectionStateType;
  onClick: any;
}) {
  const className = getClassName(idx, selectionState);
  return (
    <button className={className} onClick={onClick}>
      {/* {idx} */}
      {piece && FancyPiece[piece]}
    </button>
  );
}

function getClassName(idx: number, selectionState: selectionStateType) {
  let className =
    "chess size-10 rounded-none text-black text-4xl border-indigo-500 hover:border-2";
  const defaultColorClass =
    (idx + Math.trunc(idx / 8)) % 2 === 0 ? "bg-white" : "bg-slate-400"; // Implements the checkerboard pattern
  let colorClass;
  switch (selectionState) {
    case "selected":
      colorClass = "bg-yellow-200";
      break;
    case "highlighted":
      colorClass = "bg-green-300";
      break;
    default:
      colorClass = defaultColorClass;
      break;
  }
  className = className + " " + colorClass;
  return className;
}
