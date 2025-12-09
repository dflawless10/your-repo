import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MascotOverlay from '../app/components/MascotOverlay';
import SparkleTrail from '../app/sparkletrail/SparkleTrail';
import type { MascotMood } from '@/types/goatmoods';
import {useRouter} from "expo-router";

export default function JewelryBoxScreen() {
  const [showModal, setShowModal] = useState(true);
  const [mascotMood, setMascotMood] = useState<MascotMood | null>(null);
  const [mascotMessage, setMascotMessage] = useState('');
  const navigation = useNavigation();
  const router = useRouter();

  const handleChoice = async (choice: string) => {
  await AsyncStorage.setItem('userPreference', choice);
  setShowModal(false);

  switch (choice) {
    case 'buy':
      setMascotMood('Excited');
      setMascotMessage('Let’s find your sparkle!');
      router.push('/buy');
      break;
    case 'sell':
      setMascotMood('Majestic');
      setMascotMessage('Your gems await their next chapter.');
      router.push('/sell');
      break;
    case 'browse':
      setMascotMood('Curious');
      setMascotMessage('Auction winds are stirring...');
      router.push('/browse');
      break;
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧰 Jewelry Box</Text>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.prompt}>
              What brings you to the Goatbox today, traveler of treasure?
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleChoice('buy')}
            >
              <Text style={styles.buttonText}>💍 Buy Bling</Text>
              <Text style={styles.mascotWhisper}>“Seeking sparkle, are we?”</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleChoice('sell')}
            >
              <Text style={styles.buttonText}>💎 Sell Gems</Text>
              <Text style={styles.mascotWhisper}>“Time to trade your trove!”</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleChoice('browse')}
            >
              <Text style={styles.buttonText}>🔍 Browse & Bid</Text>
              <Text style={styles.mascotWhisper}>
                “Let the auction winds guide you.”
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {mascotMood && (
        <>
          <SparkleTrail mood={mascotMood} milestoneLevel={1} />
          <MascotOverlay
        mood="Shimmer" // ✅ Must match MascotMood union
        message="Sparkle on, seller!"
        position="bottom"
        visible={true}
      />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    marginHorizontal: 40,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  mascotWhisper: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
});

