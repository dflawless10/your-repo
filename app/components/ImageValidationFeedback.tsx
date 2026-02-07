import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ImageValidationResult } from '@/hooks/useImageValidation';
import { useTheme } from '@/app/theme/ThemeContext';

type Props = {
  validation: ImageValidationResult;
  visible?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
  onDismiss?: () => void;
};

export default function ImageValidationFeedback({
  validation,
  visible = true,
  autoDismiss = true,
  dismissAfter = 5000,
  onDismiss
}: Readonly<Props>) {
  const { theme, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = React.useState(true);
  const { isValid, errors, warnings, checks } = validation;

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return;
    }

    // Reset when component becomes visible
    setShouldRender(true);
    fadeAnim.setValue(1);

    if (autoDismiss && isValid) {
      // Only auto-dismiss if validation passed
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShouldRender(false); // Remove from DOM after animation
          if (onDismiss) onDismiss();
        });
      }, dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [visible, isValid, autoDismiss, dismissAfter]);

  if (!visible || !shouldRender) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff',
        borderColor: theme === 'dark' ? '#3C3C3E' : '#ddd'
      }
    ]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>📸 Image Validation</Text>

      {/* Status Summary */}
      <View style={[
        styles.statusBanner,
        isValid
          ? { backgroundColor: theme === 'dark' ? '#1C3D2E' : '#d4edda' }
          : { backgroundColor: theme === 'dark' ? '#3D1C1C' : '#f8d7da' }
      ]}>
        <Text style={[styles.statusText, { color: colors.textPrimary }]}>
          {isValid ? '✅ Ready to Upload' : '❌ Issues Found'}
        </Text>
      </View>

      {/* Validation Checks */}
      <View style={styles.checksSection}>
        <CheckItem
          label="File Type"
          passed={checks.fileType.passed}
          message={checks.fileType.message}
          theme={theme}
          colors={colors}
        />
        <CheckItem
          label="Dimensions"
          passed={checks.dimensions.passed}
          message={checks.dimensions.message}
          theme={theme}
          colors={colors}
        />
        <CheckItem
          label="Aspect Ratio"
          passed={checks.aspectRatio.passed}
          message={checks.aspectRatio.message}
          theme={theme}
          colors={colors}
        />
        <CheckItem
          label="File Size"
          passed={checks.fileSize.passed}
          message={checks.fileSize.message}
          theme={theme}
          colors={colors}
        />
      </View>

      {/* Errors */}
      {errors.length > 0 && (
        <View style={[styles.messagesSection, { borderTopColor: theme === 'dark' ? '#3C3C3E' : '#eee' }]}>
          <Text style={[styles.messagesTitle, { color: colors.textPrimary }]}>⚠️ Errors:</Text>
          {errors.map((error, idx) => (
            <Text key={idx} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={[styles.messagesSection, { borderTopColor: theme === 'dark' ? '#3C3C3E' : '#eee' }]}>
          <Text style={[styles.messagesTitle, { color: colors.textPrimary }]}>⚡ Warnings:</Text>
          {warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      {/* Success Message */}
      {isValid && errors.length === 0 && warnings.length === 0 && (
        <View style={[styles.successSection, { backgroundColor: theme === 'dark' ? '#1C3D2E' : '#d4edda' }]}>
          <Text style={[styles.successText, { color: theme === 'dark' ? '#86EFAC' : '#155724' }]}>
            🎉 Image looks great! Ready to list.
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function CheckItem({
  label,
  passed,
  message,
  theme,
  colors
}: {
  label: string;
  passed: boolean;
  message: string;
  theme: 'light' | 'dark';
  colors: any;
}) {
  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkIcon}>{passed ? '✅' : '❌'}</Text>
      <View style={styles.checkContent}>
        <Text style={[styles.checkLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[
          styles.checkMessage,
          { color: theme === 'dark' ? '#999' : '#666' },
          !passed && styles.checkMessageError
        ]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusValid: {
    backgroundColor: '#d4edda',
  },
  statusInvalid: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  checksSection: {
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  checkContent: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  checkMessage: {
    fontSize: 13,
    color: '#666',
  },
  checkMessageError: {
    color: '#dc3545',
  },
  messagesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#ff8c00',
    marginBottom: 4,
  },
  successSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
    fontWeight: '600',
  },
});
