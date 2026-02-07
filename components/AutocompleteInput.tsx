import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/app/theme/ThemeContext';

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
  editable?: boolean; // For select-only dropdowns
};

export default function AutocompleteInput({ label, value, onValueChange, options, placeholder, allowCustom = true, onAddCustom, fieldName, editable = true }: Props) {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
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

  const themedStyles = {
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: isDark ? '#BB86FC' : '#6A0DAD',
      marginBottom: 6,
    },
    input: {
      borderWidth: 2,
      borderColor: isDark ? '#3D3D3D' : '#E0D4F7',
      padding: 12,
      paddingRight: 40,
      borderRadius: 10,
      backgroundColor: isDark ? '#1C1C1E' : 'white',
      fontSize: 16,
      color: isDark ? '#f0f0f0' : '#1A202C',
      shadowColor: isDark ? '#000' : '#6A0DAD',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    arrowButtons: {
      position: 'absolute' as const,
      right: 1,
      top: 1,
      bottom: 1,
      flexDirection: 'column' as const,
      justifyContent: 'center' as const,
      borderLeftWidth: 2,
      borderLeftColor: isDark ? '#3D3D3D' : '#E0D4F7',
      backgroundColor: isDark ? '#2C2C2E' : '#F9F5FF',
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      width: 36,
    },
    dropdown: {
      maxHeight: 220,
      borderWidth: 2,
      borderColor: isDark ? '#BB86FC' : '#6A0DAD',
      borderRadius: 10,
      marginTop: 4,
      backgroundColor: isDark ? '#1C1C1E' : '#fff',
      shadowColor: isDark ? '#000' : '#6A0DAD',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2C2C2E' : '#F0E7FF',
    },
    dropdownText: {
      flex: 1,
      fontSize: 15,
      color: isDark ? '#f0f0f0' : '#2D3748',
      marginRight: 8,
    },
    highlightedItem: {
      backgroundColor: isDark ? '#2C2C2E' : '#F9F5FF',
    },
    selectedItem: {
      backgroundColor: isDark ? '#1F1F1F' : '#FFF0EB',
      borderLeftWidth: 3,
      borderLeftColor: '#FF6B35',
    },
    selectedText: {
      color: '#FF6B35',
      fontWeight: '700' as const,
    },
    addCustomItem: {
      backgroundColor: isDark ? '#1F1F1F' : '#FFF5F2',
      borderTopWidth: 2,
      borderTopColor: '#FF6B35',
      paddingVertical: 16,
    },
    addCustomText: {
      fontSize: 15,
      color: '#FF6B35',
      fontWeight: '700' as const,
      marginLeft: 8,
      flex: 1,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={themedStyles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={themedStyles.input}
          placeholder={placeholder || `Select ${label.toLowerCase()}`}
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={isOpen ? (editable ? searchText : '') : displayValue}
          onChangeText={editable ? setSearchText : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          showSoftInputOnFocus={editable}
        />

        <View style={themedStyles.arrowButtons}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelectedIndex(i => Math.max(i - 1, 0))}
          >
            <Ionicons name="chevron-up" size={16} color={isDark ? '#BB86FC' : '#4A5568'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelectedIndex(i => Math.min(i + 1, filteredOptions.length - 1))}
          >
            <Ionicons name="chevron-down" size={16} color={isDark ? '#BB86FC' : '#4A5568'} />
          </TouchableOpacity>
        </View>
      </View>

      {isOpen && (filteredOptions.length > 0 || showAddCustom) && (
        <ScrollView style={themedStyles.dropdown} nestedScrollEnabled>
          {filteredOptions.slice(0, 6).map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option)}
              style={[
                themedStyles.dropdownItem,
                index === selectedIndex && themedStyles.highlightedItem,
                option.value === value && themedStyles.selectedItem
              ]}
            >
              <Text
                style={[
                  themedStyles.dropdownText,
                  option.value === value && themedStyles.selectedText
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
              style={[themedStyles.dropdownItem, themedStyles.addCustomItem]}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
              <Text style={themedStyles.addCustomText}>
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
