import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,

} from 'react-native';
import { Image } from 'expo-image'; // 👈 use expo-image for reliable local file rendering
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  imageUrl: string;
  brand: string;
  model: string;
  price: string;
  year?: string;
  isNew?: boolean;
  // All watch specifications
  watchSpecs?: {
    caseMaterial?: string;
    bandMaterial?: string;
    movementType?: string;
    rarity?: string;
    waterResistance?: string;
    condition?: string;
    countryOfOrigin?: string;
    warranty?: string;
    claspType?: string;
    watchSize?: string;
    gender?: string;
    bandSize?: string;
    bandLength?: string;
    bandLink?: string;
    bandStyle?: string;
    bandSizeInches?: string;
    lugWidth?: string;
    buckleWidth?: string;
    lugToLugLength?: string;
    caseShape?: string;
    caseThickness?: string;
    bezelType?: string;
    bezelStyle?: string;
    bezelWeight?: string;
    bezelMaterial?: string;
    aftermarketBezel?: boolean;
    originalBezel?: boolean;
    dialStyle?: string;
    dialColor?: string;
    dialMaterial?: string;
    dialHourMarkers?: string;
    dialType?: string;
    aftermarketDial?: boolean;
    originalDial?: boolean;
    hasOriginalPackaging?: boolean;
    hasDiamonds?: boolean;
    skeletalBack?: boolean;
    flipSkeletalBack?: boolean;
    fullSkeletalWatch?: boolean;
    selectedFeatures?: string[];
  };
};

const WatchListingCard = ({
  imageUrl,
  brand,
  model,
  price,
  year,
  isNew,
  watchSpecs,
}: Props) => {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission required to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ works with your installed version
  quality: 1,
});


    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setImageUris(uris);
      console.log('Picked image URIs:', uris);
    }
  };

  useEffect(() => {
    console.log('Current imageUris state:', imageUris);
  }, [imageUris]);

  const handleListWatch = () => {
    const primaryImage = imageUris.length > 0 ? imageUris[0] : imageUrl;
    const allImages = imageUris.length > 0 ? imageUris.join(',') : imageUrl;

    // Serialize watch specs to JSON string
    const specsParam = watchSpecs ? encodeURIComponent(JSON.stringify(watchSpecs)) : '';

    router.push(
      `/watch-listing?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(
        model
      )}&price=${encodeURIComponent(price)}&year=${encodeURIComponent(
        year || ''
      )}&isNew=${encodeURIComponent(isNew ? 'true' : 'false')}&imageUrl=${encodeURIComponent(
        primaryImage
      )}&images=${encodeURIComponent(allImages)}&watchSpecs=${specsParam}`
    );
  };

  return (
    <View style={{ padding: 16, marginTop: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
        Your Watch Preview
      </Text>

      <View style={styles.card}>
        {/* Top Section: Specs */}
        <View style={styles.specSection}>
          <Text style={styles.shapeIcons}>⌚</Text>
          <Text style={styles.title}>⌚ {brand} {model}</Text>
          {year && <Text style={styles.specs}>📅 Year: {year}</Text>}
          {isNew !== undefined && (
            <Text style={styles.specs}>🏷️ Condition: {isNew ? 'New' : 'Used'}</Text>
          )}
          <Text style={styles.price}>💰 ${price}</Text>
        </View>

        {/* Middle Section: Images */}
        {imageUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
  source={{ uri }}
  style={styles.image}
  contentFit="cover"
  onError={(error) => {
    console.log('Image failed to load:', error);
  }}
/>

              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera-outline" size={60} color="#CBD5E0" />
            <Text style={styles.placeholderText}>No photo uploaded yet</Text>
          </View>
        )}

        {/* Bottom Section: Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>📷 Upload Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleListWatch}>
            <Text style={styles.buttonText}>📦 List Watch</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  specSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  imageScrollView: {
    marginBottom: 16,
  },
  imageWrapper: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  specs: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginVertical: 2,
  },
  price: {
    fontSize: 24,
    color: '#0077cc',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  shapeIcons: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WatchListingCard;
