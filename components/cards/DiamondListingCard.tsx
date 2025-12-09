import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView, Alert,

} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


type Props = {
  imageUrl: string;
  shape: string;
  carat: string;
  color: string;
  clarity: string;
  certified: string;
  price: string;
};




const DiamondListingCard = ({
  imageUrl,
  shape,
  carat,
  color,
  clarity,
  certified,
  price,
}: Props) => {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const router = useRouter();
  const [coverIndex, setCoverIndex] = useState(0);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission required to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleListDiamond = () => {
  const primaryImage = imageUris.length > 0 ? imageUris[coverIndex] : imageUrl;


  router.push({
    pathname: '/diamond-listing',
    params: {
      shape,
      carat,
      color,
      clarity,
      certified,
      price,
      imageUrl: primaryImage,
    },
  });
};


  return (
  <ScrollView contentContainerStyle={styles.scrollContainer}>
    <Text style={styles.previewHeader}>Your Diamond Preview</Text>
    <View style={styles.card}>
        <View style={styles.specSection}>
          <Text style={styles.shapeIcons}>💎</Text>
          <Text style={styles.title}>{carat}ct {shape}</Text>
          <Text style={styles.specs}>🧬 Color: {color} | ✨ Clarity: {clarity}</Text>
          <Text style={styles.specs}>📜 Certified: {certified === 'Yes' ? 'GIA Verified' : 'Uncertified Magic'}</Text>
          <Text style={styles.price}>💰 ${price}</Text>
        </View>


        {imageUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
           {imageUris.map((uri, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        <TouchableOpacity
  style={[
    styles.coverToggle,
    coverIndex === index && styles.coverToggleActive,
  ]}
  onPress={() => {
    setCoverIndex(index);
    Alert.alert('Cover Image Set', `Image ${index + 1} is now your cover.`);
  }}
>
  <Text style={styles.coverToggleText}>
    {coverIndex === index ? '✅ Cover Image' : 'Set as Cover'}
  </Text>
          <TouchableOpacity style={styles.addMoreButton} onPress={pickImage}>
  <Text style={styles.addMoreText}>➕ Add More</Text>
</TouchableOpacity>

</TouchableOpacity>

      </View>
     ))}
<TouchableOpacity
  style={styles.fullscreenButton}
  onPress={() =>
    router.push({
      pathname: '/FullImageScreen',
      params: {
        mediaArray: JSON.stringify(imageUris),
        index: coverIndex.toString(),
      },
    })
  }
>
  <Text style={styles.fullscreenText}>🔍 View Fullscreen</Text>
</TouchableOpacity>

          </ScrollView>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera-outline" size={60} color="#CBD5E0" />
            <Text style={styles.placeholderText}>No photo uploaded yet</Text>
          </View>
        )}
       <View style={{ height: 12 }} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>📷 Upload Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleListDiamond}>
            <Text style={styles.buttonText}>📦 List Diamond</Text>
          </TouchableOpacity>
        </View>
    </View>
  </ScrollView>
    )
};

const styles = StyleSheet.create({
  specSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  carouselLabel: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2D3748',
  marginBottom: 8,
  textAlign: 'center',
},
addMoreButton: {
  alignSelf: 'center',
  backgroundColor: '#EDF2F7',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 8,
},
addMoreText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2D3748',
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
  fullscreenButton: {
  marginTop: 12,
  alignSelf: 'center',
  backgroundColor: '#EDF2F7',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
},
fullscreenText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2D3748',
},

  coverToggle: {
  position: 'absolute',
  bottom: 8,
  left: 8,
  backgroundColor: '#ffffffcc',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 6,
},
coverToggleActive: {
  backgroundColor: '#0077cc',
},
coverToggleText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#2c3e50',
},

  placeholderText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
  },
  scrollContainer: {
  padding: 16,
  paddingBottom: 40,
},
previewHeader: {
  fontSize: 22,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 12,
},

  card: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  borderRadius: 24,
  backgroundColor: '#ffffff',
  padding: 24,
  marginVertical: 24,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
  minHeight: 520, // ⬆️ gives room for multiple images
},

 imageScrollView: {
  marginBottom: 16,
  height: 240, // ⬆️ taller scroll area
},
imageWrapper: {
  width: 220,
  height: 220,
  borderRadius: 16,
  backgroundColor: '#e0e0e0',
  marginRight: 12,
  overflow: 'hidden',
  position: 'relative',
},
image: {
  width: '100%',
  height: '100%',
  borderRadius: 16,
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

export default DiamondListingCard;
