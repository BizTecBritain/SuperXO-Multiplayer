import { useState, createContext, useContext, useRef } from 'react';
import axios from 'axios';

const yourSymbolContext = createContext();
const theirSymbolContext = createContext();

function Square({ value, onSquareClick, styleColour }) {
  return (
    <button className="square" onClick={onSquareClick} style={{border: styleColour}}>{value}</button>
  );
}

function Board({ youAreNext, squares, onPlay, allowed, number, gameOver, boardChange }) {
  const yourSymbol = useContext(yourSymbolContext);

  function handleClick(i) {
    if (calculateWinner(squares) || squares[i] || (allowed != number && allowed != 10) || gameOver || !youAreNext) {
      return;
    }
    const nextSquares = squares.slice();
    nextSquares[i] = yourSymbol;
    if (calculateWinner(nextSquares)) {
      boardChange(number, yourSymbol);
    }
    onPlay(nextSquares, number, i);
  }

  const winner = calculateWinner(squares);
  const style = ((allowed != number && allowed != 10) || !youAreNext || gameOver) ? "1px solid #999" : "1px solid #f00";

  return (
    <div className="small-board">
      <div className="winner-text">{winner}</div>
        <div className="box-frame">
          <div className="board-row">
            <Square value={squares[0]} onSquareClick={() => handleClick(0)} styleColour={style} />
            <Square value={squares[1]} onSquareClick={() => handleClick(1)} styleColour={style} />
            <Square value={squares[2]} onSquareClick={() => handleClick(2)} styleColour={style} />
          </div>
          <div className="board-row">
            <Square value={squares[3]} onSquareClick={() => handleClick(3)} styleColour={style} />
            <Square value={squares[4]} onSquareClick={() => handleClick(4)} styleColour={style} />
            <Square value={squares[5]} onSquareClick={() => handleClick(5)} styleColour={style} />
          </div>
          <div className="board-row">
            <Square value={squares[6]} onSquareClick={() => handleClick(6)} styleColour={style} />
            <Square value={squares[7]} onSquareClick={() => handleClick(7)} styleColour={style} />
            <Square value={squares[8]} onSquareClick={() => handleClick(8)} styleColour={style} />
          </div>
        </div>
    </div>
  );
}

function Game({ roomID, connID, yourTurn }) {
  const [currentSquares, setCurrentSquares] = useState(Array(81).fill(null));
  const [overallBoard, setOverallBoard] = useState(Array(9).fill(null));
  const [allowedBox, setAllowedBox] = useState(10);
  const [youAreNext, setYouAreNext] = useState(yourTurn);
  const initializedRef = useRef(false);

  const yourSymbol = useContext(yourSymbolContext);
  const theirSymbol = useContext(theirSymbolContext);

  function overallBoardChange(number, symbol) {
    const nextOverallBoard = overallBoard.slice();
    nextOverallBoard[number] = symbol;
    setOverallBoard(nextOverallBoard);
  }

  const poll = function() {
    axios.get(`https://superxo.glitch.me/get_move`, {timeout: 20000})
      .then(response => {
        if (response.data.game == roomID) {
          setCurrentSquares(response.data.newMove);
          setYouAreNext(true);
          if (calculateWinner(response.data.newMove.slice(response.data.updateArea * 9, response.data.updateArea * 9 + 9))) {
            overallBoardChange(response.data.updateArea, theirSymbol);
          }
          setAllowedBox(response.data.allowedBox);
        } else {
          poll();
        }
      })
      .catch(_error => {
        poll();
      });
  };

  if (!initializedRef.current && !yourTurn) {
    initializedRef.current = true;
    poll();
  }

  function handlePlay(smallBoardSquares, number, position) {
    const nextSquares = currentSquares.slice();
    Array.prototype.splice.apply(nextSquares, [number * 9, smallBoardSquares.length].concat(smallBoardSquares));
    setCurrentSquares(nextSquares);
    setYouAreNext(false);
    setAllowedBox(overallBoard[position] ? 10 : position);
    axios.post(`https://superxo.glitch.me/add_move/${roomID}`, {headers: { "Content-Type": "application/json" }, params: {position: nextSquares, uid: connID, updateArea: number, allowedBox: overallBoard[position] ? 10 : position}})
      .then(_response => {
        poll();
      })
      .catch(error => {
        alert("This shouldn\'t happen: " + error.response.data.message);
      });
  }

  const winner = calculateWinner(overallBoard);
  let status;
  let gameOver = false;
  if (winner) {
    status = 'Winner: ' + winner;
    gameOver = true;
  } else {
    status = 'Next player: ' + (youAreNext ? yourSymbol : theirSymbol);
  }

  return (
    <div className="game">
      <div className="game-board">
        <div className="status">{status}</div>
        <div className="mini-board">
          <Board youAreNext={youAreNext} squares={currentSquares.slice(0, 9)} onPlay={handlePlay} allowed={allowedBox} number={0} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(27, 36)} onPlay={handlePlay} allowed={allowedBox} number={3} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(54, 63)} onPlay={handlePlay} allowed={allowedBox} number={6} gameOver={gameOver} boardChange={overallBoardChange} />
        </div>
        <div className="mini-board">
          <Board youAreNext={youAreNext} squares={currentSquares.slice(9, 18)} onPlay={handlePlay} allowed={allowedBox} number={1} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(36, 45)} onPlay={handlePlay} allowed={allowedBox} number={4} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(63, 72)} onPlay={handlePlay} allowed={allowedBox} number={7} gameOver={gameOver} boardChange={overallBoardChange} />
        </div>
        <div className="mini-board">
          <Board youAreNext={youAreNext} squares={currentSquares.slice(18, 27)} onPlay={handlePlay} allowed={allowedBox} number={2} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(45, 54)} onPlay={handlePlay} allowed={allowedBox} number={5} gameOver={gameOver} boardChange={overallBoardChange} />
          <Board youAreNext={youAreNext} squares={currentSquares.slice(72, 81)} onPlay={handlePlay} allowed={allowedBox} number={8} gameOver={gameOver} boardChange={overallBoardChange} />
        </div>
      </div>
    </div>
  );
}

export default function Website() {
  const [connected, setConnected] = useState(0);
  const [createRoom, setCreateRoom] = useState("");
  const [joinRoom, setJoinRoom] = useState("");
  const [connID, setConnID] = useState(null);

  const poll = function() {
    axios.get(`https://superxo.glitch.me/game_start`, {timeout: 20000})
      .then(response => {
        if (response.data.game == createRoom) {
          setConnected(2);
        } else {
          poll();
        }
      })
      .catch(_error => {
        poll();
      });
  };

  const createNewRoom = (event) => {
    event.preventDefault();
    if (createRoom == "") {
      return;
    }
    alert(`The room you created was: ${createRoom}`);
    axios.get(`https://superxo.glitch.me/create_game/${createRoom}`)
      .then(response => {
        setConnID(response.data);
        setConnected(1);
        alert("Connecting to room. Please wait.");
        poll();
      })
      .catch(error => {
        alert(error.response.data.message);
      });
  }

  const joinNewRoom = (event) => {
    event.preventDefault();
    if (joinRoom == "") {
      return;
    }
    axios.get(`https://superxo.glitch.me/join_game/${joinRoom}`)
      .then(response => {
        setConnID(response.data);
        setConnected(2);
        alert("Connecting to room. Please wait.");
      })
      .catch(error => {
        alert(error.response.data.message);
      });
  }

  if (connected == 2) {
    return (
      <yourSymbolContext.Provider value={joinRoom == "" ? 'X' : 'O'}>
        <theirSymbolContext.Provider value={joinRoom == "" ? 'O' : 'X'}>
          <Game connID={connID} roomID={joinRoom == "" ? createRoom : joinRoom} yourTurn={joinRoom == ""} />
        </theirSymbolContext.Provider>
      </yourSymbolContext.Provider>
    );
  } else if (connected == 1) {
    return (
      <h1>Connecting...</h1>
    );
  } else {
    return (
      <>
        <form onSubmit={createNewRoom}>
          <input type="text" value={createRoom} onChange={(e) => setCreateRoom(e.target.value)}/>
          <input type="submit" value="Create Room" />
        </form>
        <form onSubmit={joinNewRoom}>
          <input type="text" value={joinRoom} onChange={(e) => setJoinRoom(e.target.value)}/>
          <input type="submit" value="Join Room" />
        </form>
      </>
    );
  }
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}