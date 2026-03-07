import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";

interface EvidenceViewerProps {
  photos: string[];
  visible: boolean;
  onClose: () => void;
  startIndex?: number;
}


export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  photos,
  visible,
  onClose,
  startIndex = 0,
}) => {

  const uri = photos[startIndex];

  return (
    <Modal visible={visible} animationType="fade">
      <View style={styles.container}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          onError={() => console.log("IMAGE FAILED:", uri)}
          onLoad={() => console.log("IMAGE LOADED:", uri)}
        />

        <TouchableOpacity style={styles.closeButtonText} onPress={onClose}>
          <View style={styles.closeDot} />
        </TouchableOpacity>
      </View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButtonText: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    textDecorationStyle: "solid",
    color: "#000",
  },

  closeDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    color: "#000",

  },
});
