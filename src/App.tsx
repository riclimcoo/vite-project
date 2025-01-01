import { useRef, useState } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import "./App.css";
import { Board } from "./Board";
import { Center } from "./Center";
import BoardModel from "./model/BoardModel";

function App() {
  const [activeSquare, setActiveSquare] = useState<number | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Array<number>>(
    []
  );
  const boardModel = useRef<BoardModel | null>(null);
  if (boardModel.current === null) {
    boardModel.current = new BoardModel();
  }

  return (
    <div
      onClick={() => {
        setActiveSquare(null);
        setHighlightedSquares([]);
      }}
    >
      <Center>
        <Board
          boardModel={boardModel.current}
          activeSquare={activeSquare}
          setActiveSquare={setActiveSquare}
          highlightedSquares={highlightedSquares}
          setHighlightedSquares={setHighlightedSquares}
        />
      </Center>
    </div>
  );
}

export default App;
