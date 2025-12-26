import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  allowCustom?: boolean;
  onAddCustom?: (customValue: string, label: string) => void;
  fieldName?: string; // For storing custom options
};

export default function AutocompleteInput({ label, value, onValueChange, options, placeholder, allowCustom = true, onAddCustom, fieldName }: Props) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customOptions, setCustomOptions] = useState<Option[]>([]);

  // Load custom options from AsyncStorage on mount
  useEffect(() => {
    if (fieldName) {
      loadCustomOptions();
    }
  }, [fieldName]);

  const loadCustomOptions = async () => {
    try {
      const storageKey = `custom_watch_options_${fieldName}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomOptions(parsed);
      }
    } catch (error) {
      console.error('Error loading custom options:', error);
    }
  };

  const saveCustomOption = async (option: Option) => {
    try {
      if (!fieldName) return;

      const storageKey = `custom_watch_options_${fieldName}`;
      const newCustomOptions = [...customOptions, option];
      setCustomOptions(newCustomOptions);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newCustomOptions));
    } catch (error) {
      console.error('Error saving custom option:', error);
    }
  };

  // Merge original options with custom saved options
  const allOptions = [...options, ...customOptions];

  // Find the label for the current value
  const displayValue = allOptions.find(opt => opt.value === value)?.label || value || '';

  // Filter options based on search
  const filteredOptions = allOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // Check if search text matches existing option exactly
  const exactMatch = allOptions.find(opt =>
    opt.label.toLowerCase() === searchText.toLowerCase()
  );

  // Show "Add custom" option if enabled and no exact match
  const showAddCustom = allowCustom && searchText.trim() && !exactMatch && filteredOptions.length === 0;

  const handleSelect = (option: Option) => {
    onValueChange(option.value);
    setSearchText('');
    setIsOpen(false);
  };

  const handleAddCustom = async () => {
    const customValue = searchText.toLowerCase().replace(/\s+/g, '');
    const customLabel = searchText.trim();
    const newOption = { label: customLabel, value: customValue };

    // Save to AsyncStorage
    await saveCustomOption(newOption);

    // Add to local state immediately
    onValueChange(customValue);

    // Notify parent to add to backend
    if (onAddCustom) {
      onAddCustom(customValue, customLabel);
    }

    setSearchText('');
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchText('');
  };

  const handleBlur = () => {
    // If typing custom text and allowCustom is true, accept it
    if (allowCustom && searchText.trim() && !exactMatch) {
      handleAddCustom();
    }
    // Delay to allow click on dropdown
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder || `Select ${label.toLowerCase()}`}
          value={isOpen ? searchText : displayValue}
          onChangeText={setSearchText}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <View style={styles.arrowButtons}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelectedIndex(i => Math.max(i - 1, 0))}
          >
            <Ionicons name="chevron-up" size={16} color="#4A5568" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelectedIndex(i => Math.min(i + 1, filteredOptions.length - 1))}
          >
            <Ionicons name="chevron-down" size={16} color="#4A5568" />
          </TouchableOpacity>
        </View>
      </View>

      {isOpen && (filteredOptions.length > 0 || showAddCustom) && (
        <ScrollView style={styles.dropdown} nestedScrollEnabled>
          {filteredOptions.slice(0, 6).map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option)}
              style={[
                styles.dropdownItem,
                index === selectedIndex && styles.highlightedItem,
                option.value === value && styles.selectedItem
              ]}
            >
              <Text
                style={[
                  styles.dropdownText,
                  option.value === value && styles.selectedText
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {option.label}
              </Text>
              {option.value === value && (
                <Ionicons name="checkmark" size={20} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}

          {showAddCustom && (
            <TouchableOpacity
              onPress={handleAddCustom}
              style={[styles.dropdownItem, styles.addCustomItem]}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
              <Text style={styles.addCustomText}>
                Add "{searchText}"
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A0DAD', // BidGoat purple
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0D4F7', // Light purple border
    padding: 12,
    paddingRight: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#1A202C',
    shadowColor: '#6A0DAD',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  arrowButtons: {
    position: 'absolute',
    right: 1,
    top: 1,
    bottom: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: '#E0D4F7',
    backgroundColor: '#F9F5FF', // Very light purple
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    width: 36,
  },
  arrowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    maxHeight: 220,
    borderWidth: 2,
    borderColor: '#6A0DAD',
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: '#fff',
    shadowColor: '#6A0DAD',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7FF',
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    marginRight: 8,
  },
  highlightedItem: {
    backgroundColor: '#F9F5FF', // Light purple highlight
  },
  selectedItem: {
    backgroundColor: '#FFF0EB', // Light orange
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  selectedText: {
    color: '#FF6B35', // BidGoat orange
    fontWeight: '700',
  },
  addCustomItem: {
    backgroundColor: '#FFF5F2',
    borderTopWidth: 2,
    borderTopColor: '#FF6B35',
    paddingVertical: 16,
  },
  addCustomText: {
    fontSize: 15,
    color: '#FF6B35', // BidGoat orange
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
});
