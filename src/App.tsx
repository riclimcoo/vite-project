import { useState } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import "./App.css";
import { Board } from "./Board";
import { Center } from "./Center";
import { boardModel } from "./BoardModel";

function App() {
  const [activeSquare, setActiveSquare] = useState<number | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Array<number>>(
    []
  );

  return (
    <div
      onClick={() => {
        setActiveSquare(null);
        setHighlightedSquares([]);
      }}
    >
      <Center>
        <Board
          boardModel={boardModel}
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
