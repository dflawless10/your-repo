import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOnboarding = () => {
  const [seenWelcome, setSeenWelcome] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('seenWelcome').then((val) => {
      if (val === 'true') setSeenWelcome(true);
    });
  }, []);

  const update = async (val: boolean) => {
    await AsyncStorage.setItem('seenWelcome', val.toString());
    setSeenWelcome(val);
  };

  return { seenWelcome, setSeenWelcome: update };
};
