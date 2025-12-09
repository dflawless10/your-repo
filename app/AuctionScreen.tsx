import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { GoatFlip } from '@/components/GoatAnimator/goatFlip';

const AuctionScreen = () => {
  const [triggerFlip, setTriggerFlip] = useState(false);

  return (
    <View style={styles.container}>
      <GoatFlip
        trigger={triggerFlip}
        onComplete={() => setTriggerFlip(false)}
      />
      <Button title="Test Button" onPress={() => console.log('Pressed')} />

      <Button title="Place Bid" onPress={() => setTriggerFlip(true)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuctionScreen;
