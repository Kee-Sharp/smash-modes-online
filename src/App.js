import React, { useEffect, useState } from 'react';
import { FighterBox } from './FighterBox.js';
import { Button } from 'react-bootstrap';
import './App.css';
import { Setup } from './Setup.js';

const App = props => {
  const [state, set] = useState({
    p1: { wins: 0, picks: [], name: 'p1' },
    p2: { wins: 0, picks: [], name: 'p2' },
    /** 0-setup mercy and names, 1-picking chars, 2-after game, 3-game over */
    gameMode: props.roomOptions ? 1 : 0,
    turn: 'p1',
    winner: '',
    p1Pick: 'none',
    p2Pick: 'none',
    totalBattles: 0,
  });
  const setState = partialState => set(prevState => ({ ...prevState, ...partialState }));
  const { available, roomOptions = {}, images, onClose } = props;
  const { p1, p2, gameMode, turn, winner, p1Pick, p2Pick, totalBattles } = state;

  useEffect(() => {
    // If you've joined a room and someone else sets up the options
    if (gameMode === 0 && props.roomOptions) {
      setState({ gameMode: 1 });
    }
  }, [props.roomOptions, gameMode]);

  const startGame = (maxBattles, name1, name2, mercy) => {
    props.setupRoom({
      maxBattles,
      maxWins: mercy ? Math.floor(maxBattles / 2) + 1 : maxBattles,
    });
    setState({
      p1: { ...p1, name: name1 },
      p2: { ...p2, name: name2 },
      turn: name1,
      gameMode: 1,
    });
  };
  const fighterClick = () => {
    if (turn === p1.name) {
      setState({ turn: p2.name });
    } else if (p2Pick !== 'none') {
      props.onSelectNames([p1Pick, p2Pick]);
      setState({
        p1: { ...p1, picks: [...p1.picks, p1Pick] },
        p2: { ...p2, picks: [...p2.picks, p2Pick] },
        turn: p1.name,
        gameMode: 2,
      });
    }
  };
  const setPick = name => {
    if (turn === p1.name) {
      setState({ p1Pick: name });
    } else if (name !== p1Pick) {
      setState({ p2Pick: name });
    } else {
      setState({ p2Pick: 'none' });
    }
  };
  const setWinner = val => {
    if (!props.roomOptions) return;
    const { maxBattles, maxWins } = props.roomOptions;
    var p1Wins = p1.wins;
    var p2Wins = p2.wins;
    if (val === p1.name) {
      p1Wins += 1;
    } else {
      p2Wins += 1;
    }
    setState({ p1: { ...p1, wins: p1Wins }, p2: { ...p2, wins: p2Wins } });
    if (p1Wins >= maxWins) {
      setState({ winner: p1.name, gameMode: 3 });
    } else if (p2Wins >= maxWins) {
      setState({ winner: p2.name, gameMode: 3 });
    } else if (totalBattles + 1 >= maxBattles) {
      setState({
        winner: p1Wins >= p2Wins ? p1.name : p2.name,
        gameMode: 3,
      });
    } else {
      setState({
        gameMode: 1,
        p1Pick: 'none',
        p2Pick: 'none',
        totalBattles: totalBattles + 1,
      });
    }
  };

  if (gameMode === 0) {
    return <Setup fighterLength={available.length} startGame={startGame} />;
  } else if (gameMode === 1) {
    if (turn) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <p>{`${roomOptions.maxBattles - totalBattles} battles left`}</p>
          <FighterBox
            available={available}
            images={images}
            fighterClick={fighterClick}
            setPick={setPick}
          />
          <p>{`Choose ${turn}'s char`}</p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: 500,
            }}
          >
            <div className="player-box">
              {p1Pick !== 'none' && (
                <img src={images[p1Pick].vertical ?? null} alt={p1Pick} />
              )}
              <div className="perfect-center">{p1Pick !== 'none' && p1Pick}</div>
              <div className="win-circle perfect-center">{p1.wins}</div>
            </div>
            <div className="player-box blue">
              {p2Pick !== 'none' && (
                <img src={images[p2Pick].vertical ?? null} alt={p2Pick} />
              )}
              <div className="perfect-center">{p2Pick !== 'none' && p2Pick}</div>
              <div className="win-circle perfect-center">{p2.wins}</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h6>Room Id: {props.roomId}</h6>
            <Button onClick={onClose}>Leave Room</Button>
          </div>
        </div>
      );
    }
  } else if (gameMode === 2) {
    return (
      <div className="centered-column">
        <p>Who Won?</p>
        <div>
          <Button variant="outline-secondary" onClick={() => setWinner(p1.name)}>
            {p1.name}
          </Button>
          <Button variant="outline-secondary" onClick={() => setWinner(p2.name)}>
            {p2.name}
          </Button>
        </div>
      </div>
    );
  }
  if (gameMode === 3) {
    const winRoster = winner === p1.name ? p1.picks : p2.picks;
    const left = ((winRoster.length - 1) * 90 + 126) / 2;
    return (
      <div className="centered-column">
        <p>{`${winner} wins!`}</p>
        <div style={{ position: 'relative', left: -left }}>
          {winRoster.reverse().map((name, i) => (
            <div
              className="winningImage"
              style={{
                border: '1px solid black',
                borderRadius: 10,
                background: 'lightgoldenrodyellow',
                position: 'absolute',
                left: i * 90,
                top: i * 10,
                zIndex: -i,
              }}
              key={i}
            >
              <img
                src={images[name].vertical}
                key={i}
                alt={name}
                style={{ borderRadius: 10 }}
              />
            </div>
          ))}
        </div>
        <Button style={{ position: 'fixed', bottom: 60 }} onClick={onClose}>
          Start Over
        </Button>
        <div style={{ position: 'fixed', right: 75, top: 50, display: 'flex' }}>
          <div className="centered-column" style={{ marginRight: 15 }}>
            <div className="win-circle perfect-center">{p1.wins}</div>
            <p>{p1.name}</p>
          </div>
          <div className="centered-column">
            <div className="win-circle perfect-center">{p2.wins}</div>
            <p>{p2.name}</p>
          </div>
        </div>
      </div>
    );
  }
};

export default App;
