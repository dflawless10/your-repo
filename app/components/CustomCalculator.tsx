import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomCalculatorProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onValueChange: (value: string) => void;
  type: 'price' | 'weight';
  title?: string;
}

export default function CustomCalculator({
  visible,
  onClose,
  value,
  onValueChange,
  type,
  title,
}: CustomCalculatorProps) {
  const handleNumberPress = (num: string) => {
    if (type === 'price') {
      // Remove formatting to work with raw numbers
      const rawValue = value.replace(/[$,]/g, '');
      const newValue = rawValue + num;

      // Format as currency
      const numericValue = parseFloat(newValue) / 100;
      const formatted = numericValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      onValueChange(formatted);
    } else {
      // Weight - simple decimal
      const newValue = value + num;
      onValueChange(newValue);
    }
  };

  const handleDecimal = () => {
    if (type === 'weight' && !value.includes('.')) {
      onValueChange(value + '.');
    }
  };

  const handleBackspace = () => {
    if (type === 'price') {
      const rawValue = value.replace(/[$,]/g, '');
      if (rawValue.length > 0) {
        const newValue = rawValue.slice(0, -1) || '0';
        const numericValue = parseFloat(newValue) / 100;
        const formatted = numericValue.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        onValueChange(formatted);
      }
    } else {
      onValueChange(value.slice(0, -1) || '0');
    }
  };

  const handleClear = () => {
    onValueChange(type === 'price' ? '$0.00' : '0');
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.calculatorContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title || (type === 'price' ? 'Enter Price' : 'Enter Weight')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={28} color="#242c40" />
            </TouchableOpacity>
          </View>

          {/* Display */}
          <View style={styles.display}>
            <Text style={styles.displayValue}>{value}</Text>
          </View>

          {/* Number Pad */}
          <View style={styles.numberPad}>
            {/* Row 1 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('7')}>
                <Text style={styles.buttonText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('8')}>
                <Text style={styles.buttonText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('9')}>
                <Text style={styles.buttonText}>9</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('4')}>
                <Text style={styles.buttonText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('5')}>
                <Text style={styles.buttonText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('6')}>
                <Text style={styles.buttonText}>6</Text>
              </TouchableOpacity>
            </View>

            {/* Row 3 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('1')}>
                <Text style={styles.buttonText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('2')}>
                <Text style={styles.buttonText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('3')}>
                <Text style={styles.buttonText}>3</Text>
              </TouchableOpacity>
            </View>

            {/* Row 4 */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.button, type === 'price' && styles.buttonDisabled]}
                onPress={handleDecimal}
                disabled={type === 'price'}
              >
                <Text style={[styles.buttonText, type === 'price' && styles.buttonTextDisabled]}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('0')}>
                <Text style={styles.buttonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonBackspace} onPress={handleBackspace}>
                <Ionicons name="backspace-outline" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calculatorContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#242c40',
  },
  display: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#F7FAFC',
    alignItems: 'flex-end',
  },
  displayValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#242c40',
  },
  numberPad: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#242c40',
  },
  buttonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  buttonTextDisabled: {
    color: '#CBD5E0',
  },
  buttonBackspace: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#718096',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
