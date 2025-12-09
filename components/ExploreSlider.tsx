import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { categories } from '@/constants/categories';

type SlideProps = {
  label: string;
  id: string;
  onPress: () => void;
};

const Slide: React.FC<SlideProps> = ({ label, id, onPress }) => {
  return (
    <TouchableOpacity style={styles.slide} onPress={onPress}>
      <Text style={styles.slideText}>{label}</Text>
    </TouchableOpacity>
  );
};

const MemoizedSlide = React.memo(Slide);

const ExploreSlider: React.FC = () => {
  const router = useRouter();

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.slider}
      renderItem={({ item }) => (
        <MemoizedSlide
      label={item.label}
      id={item.key}
      onPress={() =>
        router.push({
          pathname: '/explore/[category]',
          params: { category: item.key },
        })
      }
    />
      )}
    />
  );
};

const styles = StyleSheet.create({
  slider: {
    flexDirection: 'row',
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  slide: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  slideText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ExploreSlider;
