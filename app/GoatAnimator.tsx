// BidScreen.tsx

// GoatAnimator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type GoatAnimatorProps = {
  trigger: boolean;
};

const GoatAnimator: React.FC<GoatAnimatorProps> = ({ trigger }) => {
  return (
    <View style={styles.goatContainer}>
      {trigger && <Text style={styles.goatText}>🐐 GOAT MODE ACTIVATED!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  goatContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
  },
  goatText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default GoatAnimator;

