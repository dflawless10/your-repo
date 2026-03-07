import React, {useRef, useState} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image, Animated,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import GlobalFooter from "@/app/components/GlobalFooter";
import { EvidenceViewer } from "@/app/components/EvidenceViewer";

interface EvidenceGridProps { photos: string[]; onOpen: (index: number) => void; }

interface ReasonPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reason: string) => void;
}
export const EvidenceGrid: React.FC<EvidenceGridProps> = ({ photos, onOpen }) => { if (!photos || photos.length === 0) return null;

  function OpenUpDisputeScreen(){
    const { orderId, itemName } = useLocalSearchParams();
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [reasonPickerVisible, setReasonPickerVisible] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [goatIndex, setGoatIndex] = useState<number | null>(null);
    const goatAnim = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShowGoat = (index: number) => {
    setGoatIndex(index);
    goatAnim.setValue(0);

    Animated.sequence([
      Animated.timing(goatAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(goatAnim, {
        toValue: 0,
        duration: 180,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGoatIndex(null);
    });
  };



    // --- picker function (must be an async function inside the component)
    const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images ?? ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        allowsEditing: false,
      });
      console.log("ImagePicker result:", result);
      if (!result.canceled) {
        const newPhotos = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...newPhotos]);
      }
    } catch (err) {
      console.warn("pickImages error:", err);
    }
  };


    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 10 }}>
            Open a Dispute
          </Text>

          <Text style={{ fontSize: 16, color: "#555", marginBottom: 20 }}>
            Order #{orderId} — {itemName}
          </Text>

          {/* Reason */}
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Reason</Text>
          <TouchableOpacity
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#DDD",
              borderRadius: 8,
              marginBottom: 20,
            }}
            onPress={() => setReasonPickerVisible(true)}
          >
            <Text style={{ color: reason ? "#000" : "#999" }}>
              {reason || "Select a reason"}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>
            Describe the issue
          </Text>
          <TextInput
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Explain what happened..."
            style={{
              height: 120,
              borderWidth: 1,
              borderColor: "#DDD",
              borderRadius: 8,
              padding: 12,
              textAlignVertical: "top",
              marginBottom: 20,
            }}
          />

          {/* Photos */}
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>
            Evidence Photos
          </Text>

          <EvidenceGrid
            photos={photos}
            onOpen={(index) => {
              setViewerIndex(index);
              setViewerVisible(true);
            }}
          />

          {/* Debug image: temporary — remove after testing */}
          {photos.length > 0 && (
            <Image
              source={{ uri: photos[0] }}
              style={{
                width: 300,
                height: 300,
                resizeMode: "cover",
                marginBottom: 20,

              }}
            />
          )}

          <TouchableOpacity
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#DDD",
              borderRadius: 8,
              marginBottom: 20,
              alignItems: "center",
            }}
            onPress={pickImages} // call the async function here
          >
            <Text style={{ color: "#6A0DAD", fontWeight: "600" }}>
              Upload Photos
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={{
              backgroundColor: "#6A0DAD",
              padding: 16,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 10,
            }}
            onPress={() => {
              // hook up backend later
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              Submit Dispute
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <GlobalFooter />

        {viewerVisible && (
          <EvidenceViewer
            photos={photos}
            startIndex={viewerIndex}
            onClose={() => setViewerVisible(false)}
            visible={true}
          />
        )}

        <ReasonPickerModal
          visible={reasonPickerVisible}
          onClose={() => setReasonPickerVisible(false)}
          onSelect={(r) => {
            setReason(r);
            setReasonPickerVisible(false);
          }}
        />
      </View>
    );
  }

  const ReasonPickerModal: React.FC<ReasonPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  if (!visible) return null;

  const reasons = [
    "Counterfeit / Fake",
    "Not as described",
    "Item damaged",
    "Wrong item received",
    "Missing parts",
    "Seller not responding",
    "Other",
  ];

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFF",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 20 }}>
        Select a Reason
      </Text>

      {reasons.map((r, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            onSelect(r);
            onClose();
          }}
          style={{
            paddingVertical: 14,
            borderBottomWidth: index === reasons.length - 1 ? 0 : 1,
            borderColor: "#EEE",
          }}
        >
          <Text style={{ fontSize: 16 }}>{r}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={onClose}
        style={{
          marginTop: 20,
          padding: 14,
          backgroundColor: "#EEE",
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "600" }}>Cancel</Text>

      </TouchableOpacity>

      <GlobalFooter />
      )
    </View>

  );
  }}

