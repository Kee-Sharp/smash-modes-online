import { initializeApp } from 'firebase/app';
import {
  child,
  get,
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
} from 'firebase/database';
import React, { useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import App from './App';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

const FirebaseWrapper = () => {
  const [roomId, setRoomId] = useState('');
  const [idError, setIdError] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [roomState, setRoomState] = useState({});
  const [roomOptions, setRoomOptions] = useState(null);
  const [images, setImages] = useState({});
  const unsubscribeRef = useRef(null);
  const clientId = generateClientId();

  const createRoom = async () => {
    const allFightersSnapshot = await get(child(dbRef, 'allFighters'));
    const allFighters = allFightersSnapshot.val();
    const newRoomKey = push(child(dbRef, 'rooms'), {
      state: {
        p1: { wins: 0, picks: [], name: 'p1' },
        p2: { wins: 0, picks: [], name: 'p2' },
        /** 0-setup mercy and names, 1-picking chars, 2-after game, 3-game over */
        gameMode: 0,
        turn: 'p1',
        winner: '',
        p1Pick: 'none',
        p2Pick: 'none',
        totalBattles: 0,
        available: allFighters,
      },
    }).key;
    setRoomId(newRoomKey);
    joinRoom(newRoomKey);
  };

  const setupRoom = options => {
    set(child(dbRef, `rooms/${roomId}/options`), options);
  };

  const joinRoom = async key => {
    const roomRef = child(dbRef, `rooms/${key}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();
    if (!room) {
      setIdError(true);
      return;
    }
    set(child(roomRef, `clients/${clientId}`), '');
    // set initial values even though they will be updated by the listener immediately
    const { state, options } = room;
    setRoomState(state);
    setRoomOptions(options);
    // load images for each fighter
    const allFightersSnapshot = await get(child(dbRef, 'allFighters'));
    const allFighters = allFightersSnapshot.val();
    const imageModules = await Promise.all(
      allFighters.map(fighter =>
        Promise.all([
          import(`../public/vertical/${fighter.file}.png`),
          import(`../public/horizontal/${fighter.file}.png`),
        ])
      )
    );
    setImages(
      imageModules.reduce(
        (acc, [vertical, horizontal], index) => ({
          ...acc,
          [allFighters[index].name]: {
            vertical: vertical.default,
            horizontal: horizontal.default,
          },
        }),
        {}
      )
    );
    const unsubscribe = onValue(roomRef, snapshot => {
      const data = snapshot.val();
      console.log(data);
      setRoomState(data?.state ?? {});
      setRoomOptions(data?.options ?? {});
    });
    unsubscribeRef.current = unsubscribe;
    setHasJoinedRoom(true);
  };

  const handleChangeRoomState = partialState => {
    const roomStateRef = child(dbRef, `rooms/${roomId}/state`);
    runTransaction(roomStateRef, previousState => {
      if (!previousState) return null;
      return { ...previousState, ...partialState };
    });
  };

  const cleanup = async () => {
    setRoomId('');
    setHasJoinedRoom(false);
    unsubscribeRef.current();
    const clientsRef = child(dbRef, `rooms/${roomId}/clients`);
    await remove(child(clientsRef, clientId));
    const clientsSnapshot = await get(clientsRef);
    const clients = clientsSnapshot.val();
    if (!clients) remove(child(dbRef, `rooms/${roomId}`));
  };

  return hasJoinedRoom ? (
    <App
      roomId={roomId}
      roomState={roomState}
      roomOptions={roomOptions}
      images={images}
      setupRoom={setupRoom}
      onChangeRoomState={handleChangeRoomState}
      onClose={cleanup}
    />
  ) : (
    <div className="background">
      <div className="foreground">
        <h2>Smash Modes Online</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button onClick={createRoom}>Create Room</Button>
          </div>
          <p style={{ margin: 10, fontWeight: 500 }}>or</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <input
              className={idError ? 'error' : ''}
              value={roomId}
              onChange={e => {
                setRoomId(e.target.value);
                setIdError(false);
              }}
              placeholder="Enter room id"
            />
            <Button
              onClick={() => joinRoom(roomId)}
              disabled={!roomId}
              style={{ borderBottomLeftRadius: 0, borderTopLeftRadius: 0 }}
            >
              Join Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// code from Chat-GPT
const generateClientId = () => {
  // Check if the client ID is already stored in sessionStorage
  const clientId = sessionStorage.getItem('clientId');
  if (clientId) return clientId;
  // Generate a new client ID
  const newClientId = 'client_' + Math.random().toString(36).substring(2, 15);
  // Store the client ID in sessionStorage
  sessionStorage.setItem('clientId', newClientId);
  return newClientId;
};

export default FirebaseWrapper;
