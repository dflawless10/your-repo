import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = Math.max(end - now, 0);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const isUrgent = parseInt(timeLeft.split(':')[0]) === 0;

  return (
    <Text style={{ fontSize: 20, marginBottom: 12, color: isUrgent ? 'red' : 'black' }}>
      ⏱️ Time Left: {timeLeft}
    </Text>
  );
}
