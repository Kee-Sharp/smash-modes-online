import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, child, get, remove } from 'firebase/database';
import App from './App';
import { useRef } from 'react';

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
  const [available, setAvailable] = useState([]);
  const unsubscribeRef = useRef(null);

  const setupDatabase = () => {
    get(dbRef).then(snapshot => {
      const { available, allFighters } = snapshot.val();
      if (!available) set(child(dbRef, 'available'), allFighters);
    });
    const unsubscribe = onValue(child(dbRef, 'available'), snapshot => {
      const data = snapshot.val();
      console.log(data);
      setAvailable(data ?? []);
    });
    unsubscribeRef.current = unsubscribe;
  };

  const handleSelection = selectedNames => {
    const newAvailable = available.filter(
      fighter => !selectedNames.includes(fighter.name)
    );
    set(child(dbRef, 'available'), newAvailable);
  };

  const cleanup = () => {
    unsubscribeRef.current();
    remove(child(dbRef, 'available'));
  };

  return (
    <App
      available={available}
      setupDatabase={setupDatabase}
      onSelectNames={handleSelection}
      onClose={cleanup}
    />
  );
};

export default FirebaseWrapper;
