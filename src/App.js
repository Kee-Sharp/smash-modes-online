import React from 'react';
import { FighterBox } from './FighterBox.js';
import { Button } from 'react-bootstrap';
import './App.css';
import { Setup } from './Setup.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }
  initialState = () => ({
    p1: { wins: 0, picks: [], name: 'p1' },
    p2: { wins: 0, picks: [], name: 'p2' },
    /** 0-setup mercy and names, 1-picking chars, 2-after game, 3-game over */
    gameMode: this.props.roomOptions ? 1 : 0,
    turn: 'p1',
    winner: '',
    p1Pick: 'none',
    p2Pick: 'none',
    totalBattles: 0,
    images: {},
  });
  componentDidUpdate() {
    if (this.state.gameMode === 0 && this.props.roomOptions)
      this.setState({ gameMode: 1 });
    // we only want to do this once
    if (Object.keys(this.state.images).length) return;
    Promise.all(
      this.props.available.map(fighter =>
        import(`../public/vertical/${fighter.file}.png`)
      )
    ).then(imageModules => {
      this.setState({
        images: imageModules.reduce(
          (acc, m, index) => ({
            ...acc,
            [this.props.available[index].name]: m.default,
          }),
          {}
        ),
      });
    });
  }
  startGame = (maxBattles, name1, name2, mercy) => {
    this.props.setupRoom({
      maxBattles,
      maxWins: mercy ? Math.floor(maxBattles / 2) + 1 : maxBattles,
    });
    this.setState({
      p1: { ...this.state.p1, name: name1 },
      p2: { ...this.state.p2, name: name2 },
      turn: name1,
      gameMode: 1,
    });
  };
  fighterClick = () => {
    const { p1, p2, turn, p1Pick, p2Pick } = this.state;
    if (turn === p1.name) {
      this.setState({ turn: p2.name });
    } else if (p2Pick !== 'none') {
      this.props.onSelectNames([p1Pick, p2Pick]);
      this.setState({
        p1: { ...p1, picks: [...p1.picks, p1Pick] },
        p2: { ...p2, picks: [...p2.picks, p2Pick] },
        turn: p1.name,
        gameMode: 2,
      });
    }
  };
  setPick = name => {
    const { turn, p1, p1Pick } = this.state;
    if (turn === p1.name) {
      this.setState({ p1Pick: name });
    } else if (name !== p1Pick) {
      this.setState({ p2Pick: name });
    } else {
      this.setState({ p2Pick: 'none' });
    }
  };
  setWinner = val => {
    if (!this.props.roomOptions) return;
    const { p1, p2, totalBattles } = this.state;
    const { maxBattles, maxWins } = this.props.roomOptions;
    var p1Wins = p1.wins;
    var p2Wins = p2.wins;
    if (val === p1.name) {
      p1Wins += 1;
    } else {
      p2Wins += 1;
    }
    this.setState({ p1: { ...p1, wins: p1Wins }, p2: { ...p2, wins: p2Wins } });
    if (p1Wins >= maxWins) {
      this.setState({ winner: p1.name, gameMode: 3 });
    } else if (p2Wins >= maxWins) {
      this.setState({ winner: p2.name, gameMode: 3 });
    } else if (totalBattles + 1 >= maxBattles) {
      this.setState({
        winner: p1Wins >= p2Wins ? p1.name : p2.name,
        gameMode: 3,
      });
    } else {
      this.setState({
        gameMode: 1,
        p1Pick: 'none',
        p2Pick: 'none',
        totalBattles: totalBattles + 1,
      });
    }
  };
  handleClose = () => {
    this.props.onClose();
  };

  render() {
    const { fighterClick, setWinner, setPick, startGame, handleClose } = this;
    const { available, roomOptions = {} } = this.props;
    const { p1, p2, turn, gameMode, winner, p1Pick, p2Pick, totalBattles, images } =
      this.state;
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
                {p1Pick !== 'none' && <img src={images[p1Pick] ?? null} alt={p1Pick} />}
                <div className="perfect-center">{p1Pick !== 'none' && p1Pick}</div>
                <div className="win-circle perfect-center">{p1.wins}</div>
              </div>
              <div className="player-box blue">
                {p2Pick !== 'none' && <img src={images[p2Pick] ?? null} alt={p2Pick} />}
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
              <h6>Room Id: {this.props.roomId}</h6>
              <Button onClick={handleClose}>Leave Room</Button>
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
                <img src={images[name]} key={i} alt={name} style={{ borderRadius: 10 }} />
              </div>
            ))}
          </div>
          <Button style={{ position: 'fixed', bottom: 60 }} onClick={handleClose}>
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
  }
}

export default App;
