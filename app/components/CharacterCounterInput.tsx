import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TextStyle } from 'react-native';
import { moderateContent, ModerationResult, validateContentQuick } from '../utils/contentModeration';
import { useTheme } from '@/app/theme/ThemeContext';

interface CharacterCounterInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  minLength: number;
  maxLength: number;
  label?: string;
  helpText?: string;
  showHelpWhenInvalid?: boolean;
  enableModeration?: boolean; // Enable content moderation
}

export const CharacterCounterInput: React.FC<CharacterCounterInputProps> = ({
  value,
  onChangeText,
  minLength,
  maxLength,
  label,
  helpText,
  showHelpWhenInvalid = true,
  enableModeration = true,
  ...textInputProps
}) => {
  const { theme, colors } = useTheme();
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  // Run content moderation when value changes (debounced)
  useEffect(() => {
    if (!enableModeration || value.length < 10) {
      setModerationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = moderateContent(value, label || 'Content');
      setModerationResult(result);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [value, enableModeration, label]);

  // Helper function to get character counter color
  const getCounterColor = () => {
    // If moderation failed, show red
    if (moderationResult && !moderationResult.isValid) return '#DC2626';

    if (value.length < minLength) return '#DC2626'; // Red - below minimum
    if (value.length > maxLength * 0.9) return '#F59E0B'; // Orange - approaching max
    return '#059669'; // Green - good range
  };

  // Helper function to get input border style
  const getInputStyle = (): TextStyle => {
    // If moderation failed, show error border
    if (moderationResult && !moderationResult.isValid) {
      return styles.inputError;
    }

    if (value.length > 0 && value.length < minLength) {
      return styles.inputError;
    }
    if (value.length >= minLength && value.length <= maxLength) {
      return styles.inputSuccess;
    }
    return {};
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}

      <TextInput
        {...textInputProps}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
        style={[
          styles.input,
          { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: colors.textPrimary, borderColor: theme === 'dark' ? '#3C3C3E' : '#DDD' },
          textInputProps.style,
          { marginBottom: 4 },
          getInputStyle(),
        ]}
      />

      <View style={styles.counterRow}>
        <Text style={[styles.charCounter, { color: getCounterColor(), fontWeight: (value.length < minLength || value.length > maxLength * 0.9) ? '700' : '500' }]}>
          {value.length} / {maxLength} characters
        </Text>
        {value.length > 0 && value.length < minLength && (
          <Text style={styles.warningText}>
            (min. {minLength} required - need {minLength - value.length} more)
          </Text>
        )}
        {value.length >= minLength && (
          <Text style={styles.successText}>✓</Text>
        )}
      </View>

      {/* Content moderation warnings */}
      {moderationResult && !moderationResult.isValid && (
        <View style={styles.moderationWarning}>
          <Text style={styles.moderationTitle}>⚠️ Content Policy Violation</Text>
          {moderationResult.violations.map((violation, index) => (
            <Text key={index} style={styles.moderationText}>
              • {violation.message}
            </Text>
          ))}
        </View>
      )}

      {showHelpWhenInvalid && helpText && value.length < minLength && !moderationResult?.violations.length && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 14,
    color: '#2d3748',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  charCounter: {
    fontSize: 12,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  successText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  moderationWarning: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  moderationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 6,
  },
  moderationText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
    marginTop: 2,
  },
});

// Export validation helper with moderation
export const validateCharacterCount = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string,
  enableModeration: boolean = true
): { isValid: boolean; errorMessage?: string; shouldBlockSubmission?: boolean } => {
  // First check character count
  if (value.length < minLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName} must be at least ${minLength} characters. Current: ${value.length} characters.\n\nNeed ${minLength - value.length} more characters.`,
      shouldBlockSubmission: true,
    };
  }
  if (value.length > maxLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName} must be less than ${maxLength} characters. Current: ${value.length} characters.`,
      shouldBlockSubmission: true,
    };
  }

  // Then check content moderation using the enhanced validateContentQuick
  if (enableModeration) {
    const contentCheck = validateContentQuick(value, fieldName);
    if (!contentCheck.isValid) {
      return {
        isValid: false,
        errorMessage: contentCheck.errorMessage,
        shouldBlockSubmission: contentCheck.shouldBlockSubmission,
      };
    }
  }

  return { isValid: true, shouldBlockSubmission: false };
};

// Export constants
export const CHARACTER_LIMITS = {
  NAME_MIN: 10,
  NAME_MAX: 80,
  DESCRIPTION_MIN: 100,
  DESCRIPTION_MAX: 1500,
};
