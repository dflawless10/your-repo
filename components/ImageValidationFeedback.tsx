import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImageValidationResult } from '@/hooks/useImageValidation';

type Props = {
  validation: ImageValidationResult;
  visible?: boolean;
};

export default function ImageValidationFeedback({ validation, visible = true }: Readonly<Props>) {
  if (!visible) return null;

  const { isValid, errors, warnings, checks } = validation;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Image Validation</Text>

      {/* Status Summary */}
      <View style={[styles.statusBanner, isValid ? styles.statusValid : styles.statusInvalid]}>
        <Text style={styles.statusText}>
          {isValid ? '✅ Ready to Upload' : '❌ Issues Found'}
        </Text>
      </View>

      {/* Validation Checks */}
      <View style={styles.checksSection}>
        <CheckItem
          label="File Type"
          passed={checks.fileType.passed}
          message={checks.fileType.message}
        />
        <CheckItem
          label="Dimensions"
          passed={checks.dimensions.passed}
          message={checks.dimensions.message}
        />
        <CheckItem
          label="Aspect Ratio"
          passed={checks.aspectRatio.passed}
          message={checks.aspectRatio.message}
        />
        <CheckItem
          label="File Size"
          passed={checks.fileSize.passed}
          message={checks.fileSize.message}
        />
      </View>

      {/* Errors */}
      {errors.length > 0 && (
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>⚠️ Errors:</Text>
          {errors.map((error, idx) => (
            <Text key={idx} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>⚡ Warnings:</Text>
          {warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      {/* Success Message */}
      {isValid && errors.length === 0 && warnings.length === 0 && (
        <View style={styles.successSection}>
          <Text style={styles.successText}>🎉 Image looks great! Ready to list.</Text>
        </View>
      )}
    </View>
  );
}

function CheckItem({ label, passed, message }: { label: string; passed: boolean; message: string }) {
  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkIcon}>{passed ? '✅' : '❌'}</Text>
      <View style={styles.checkContent}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={[styles.checkMessage, !passed && styles.checkMessageError]}>
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
