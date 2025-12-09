import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingContextType = {
  seenWelcome: boolean;
  setSeenWelcome: (val: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};

type Props = {
  children: ReactNode;
};

export const OnboardingProvider: React.FC<Props> = ({ children }) => {
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

  return (
    <OnboardingContext.Provider value={{ seenWelcome, setSeenWelcome: update }}>
      {children}
    </OnboardingContext.Provider>
  );
};


export default OnboardingContext;