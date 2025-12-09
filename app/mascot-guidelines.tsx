import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Collapsible } from '@/components/Collapsible';
import { useNavigation } from '@react-navigation/native';
import {router} from "expo-router";

export default function MascotGuidelinesScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Upload Guidelines 🐐</ThemedText>
      <ThemedText type="subtitle">
        Before listing your item, make sure your media meets BidGoat’s sparkle-powered standards.
      </ThemedText>

      <Collapsible title="Image Requirements">
        <ThemedText>
          Accepted formats: <ThemedText type="defaultSemiBold">.png</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">.jpg</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">.jpeg</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>So your goat doesn’t get pixelated in the pasture.</Text>

        <ThemedText>
          Max file size: <ThemedText type="defaultSemiBold">5MB</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>We love sparkle, not lag.</Text>

        <ThemedText>
          Recommended dimensions:
          {'\n'}• Item thumbnails: <ThemedText type="defaultSemiBold">280×140px</ThemedText>
          {'\n'}• Mascot overlays: <ThemedText type="defaultSemiBold">120×120px</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Sized for clarity, scaled for delight.</Text>

        <ThemedText>
          Include <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> variants for high-density screens.
        </ThemedText>
        <Text style={styles.caption}>Because goats deserve Retina too.</Text>

        <ThemedText>
          Transparent backgrounds are required for overlays.
        </ThemedText>
        <Text style={styles.caption}>Let your mascot float like a sparkle ghost.</Text>

        <Image source={require('../assets/goat-wink.png')} style={styles.image} />
      </Collapsible>

      <Collapsible title="Video Requirements">
        <ThemedText>
          Accepted formats: <ThemedText type="defaultSemiBold">.mp4</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">.webm</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Smooth motion for smooth bidding.</Text>

        <ThemedText>
          Max duration: <ThemedText type="defaultSemiBold">15 seconds</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Just enough time for a goat wink and a sparkle swirl.</Text>

        <ThemedText>
          Max file size: <ThemedText type="defaultSemiBold">10MB</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Keep it snappy, keep it sparkly.</Text>

        <ThemedText>
          Use for bid celebrations, mascot intros, or item highlights.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Sound Requirements">
        <ThemedText>
          Accepted formats: <ThemedText type="defaultSemiBold">.wav</ThemedText>,{' '}
          <ThemedText type="defaultSemiBold">.mp3</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Let your goat bleat in stereo.</Text>

        <ThemedText>
          Max file size: <ThemedText type="defaultSemiBold">1MB</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>Enough room for a chime, not a concert.</Text>

        <ThemedText>
          Use goat bleats, sparkle chimes, or barnyard ambience to enhance your listing.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Naming Conventions">
        <ThemedText>
          Use <ThemedText type="defaultSemiBold">kebab-case</ThemedText> for filenames.
        </ThemedText>
        <ThemedText>
          Examples:
          {'\n'}• <ThemedText type="defaultSemiBold">goat-wink.png</ThemedText>
          {'\n'}• <ThemedText type="defaultSemiBold">sparkle-trail.wav</ThemedText>
          {'\n'}• <ThemedText type="defaultSemiBold">mascot-intro.mp4</ThemedText>
        </ThemedText>
        <Text style={styles.caption}>No spaces, no camelCase — just pure kebab clarity.</Text>
      </Collapsible>

      <Collapsible title="Tips for Sparkle-Ready Listings">
        <ThemedText>
          • Keep backgrounds clean and transparent for overlays.
          {'\n'}• Use SVGs for animated mascots.
          {'\n'}• Sync sound effects with bid confirmations or onboarding.
          {'\n'}• Test your media on both light and dark mode.
        </ThemedText>
        <Text style={styles.caption}>Your listing should shine in every barnyard lighting condition.</Text>
      </Collapsible>

      <Image source={require('../assets/goat-stamp.png')} style={styles.image} />
      <Text style={styles.caption}>Listings that pass all checks earn the Goat of Approval 🐐✨</Text>

     <TouchableOpacity
  style={styles.validateButton}
  onPress={() => router.push("/upload")}
>
  <Text style={styles.validateText}>Test Your Media</Text>
</TouchableOpacity>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginVertical: 12,
  },
  validateButton: {
    marginTop: 24,
    backgroundColor: '#4630EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  validateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
});
