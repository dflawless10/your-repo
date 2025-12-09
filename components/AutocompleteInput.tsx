import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
};

export default function AutocompleteInput({ label, value, onValueChange, options, placeholder, allowCustom = true, onAddCustom }: Props) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Find the label for the current value
  const displayValue = options.find(opt => opt.value === value)?.label || value || '';

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // Check if search text matches existing option exactly
  const exactMatch = options.find(opt =>
    opt.label.toLowerCase() === searchText.toLowerCase()
  );

  // Show "Add custom" option if enabled and no exact match
  const showAddCustom = allowCustom && searchText.trim() && !exactMatch && filteredOptions.length === 0;

  const handleSelect = (option: Option) => {
    onValueChange(option.value);
    setSearchText('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const customValue = searchText.toLowerCase().replace(/\s+/g, '');
    const customLabel = searchText.trim();

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
              <Text style={[
                styles.dropdownText,
                option.value === value && styles.selectedText
              ]}>
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
    color: '#4A5568',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    paddingRight: 40,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#1A202C',
  },
  arrowButtons: {
    position: 'absolute',
    right: 1,
    top: 1,
    bottom: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    backgroundColor: '#F7FAFC',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    width: 32,
  },
  arrowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  dropdownText: {
    fontSize: 15,
    color: '#2D3748',
  },
  highlightedItem: {
    backgroundColor: '#EDF2F7',
  },
  selectedItem: {
    backgroundColor: '#FFF5F2',
  },
  selectedText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  addCustomItem: {
    backgroundColor: '#F7FAFC',
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  addCustomText: {
    fontSize: 15,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
});
