import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ImageValidationResult } from '@/hooks/useImageValidation';
import { useTheme } from '@/app/theme/ThemeContext';

type Props = {
  validation: ImageValidationResult;
  visible?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
  onDismiss?: () => void;
};

export default function ImageValidationFeedback({
  validation,
  visible = true,
  autoDismiss = true,
  dismissAfter = 5000,
  onDismiss
}: Readonly<Props>) {

  console.log("🐐 [IVF] Render start — visible:", visible);

  const { theme, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = React.useState(true);

  const { isValid, errors, warnings, checks } = validation;

  // Log validation changes
  useEffect(() => {
    console.log("🐐 [IVF] Validation updated:", {
      isValid,
      errors,
      warnings,
      checks
    });
  }, [validation]);

  // Log visibility changes
  useEffect(() => {
    console.log("🐐 [IVF] Visibility changed:", visible);
  }, [visible]);

  useEffect(() => {
    console.log("🐐 [IVF] useEffect triggered — visible:", visible, "isValid:", isValid);

    if (!visible) {
      console.log("🐐 [IVF] Component hidden — removing from render");
      setShouldRender(false);
      return;
    }

    console.log("🐐 [IVF] Component visible — resetting fade + showing");
    setShouldRender(true);
    fadeAnim.setValue(1);

    if (autoDismiss && isValid) {
      console.log(`🐐 [IVF] Auto-dismiss scheduled in ${dismissAfter}ms`);

      const timer = setTimeout(() => {
        console.log("🐐 [IVF] Auto-dismiss triggered — starting fade-out");

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          console.log("🐐 [IVF] Fade-out complete — removing component");
          setShouldRender(false);
          if (onDismiss) {
            console.log("🐐 [IVF] onDismiss callback fired");
            onDismiss();
          }
        });
      }, dismissAfter);

      return () => {
        console.log("🐐 [IVF] Cleanup — clearing auto-dismiss timer");
        clearTimeout(timer);
      };
    }
  }, [visible, isValid, autoDismiss, dismissAfter]);

  if (!visible) {
    console.log("🐐 [IVF] Not visible — returning null");
    return null;
  }

  if (!shouldRender) {
    console.log("🐐 [IVF] shouldRender=false — returning null");
    return null;
  }

  console.log("🐐 [IVF] Rendering component");

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff',
          borderColor: theme === 'dark' ? '#3C3C3E' : '#ddd'
        }
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>📸 Image Validation</Text>

      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          isValid
            ? { backgroundColor: theme === 'dark' ? '#1C3D2E' : '#d4edda' }
            : { backgroundColor: theme === 'dark' ? '#3D1C1C' : '#f8d7da' }
        ]}
      >
        <Text style={[styles.statusText, { color: colors.textPrimary }]}>
          {isValid ? '✅ Ready to Upload' : '❌ Issues Found'}
        </Text>
      </View>

      {/* Validation Checks */}
      <View style={styles.checksSection}>
        <CheckItem label="File Type" passed={checks.fileType.passed} message={checks.fileType.message} theme={theme} colors={colors} />
        <CheckItem label="Dimensions" passed={checks.dimensions.passed} message={checks.dimensions.message} theme={theme} colors={colors} />
        <CheckItem label="Aspect Ratio" passed={checks.aspectRatio.passed} message={checks.aspectRatio.message} theme={theme} colors={colors} />
        <CheckItem label="File Size" passed={checks.fileSize.passed} message={checks.fileSize.message} theme={theme} colors={colors} />
      </View>

      {/* Errors */}
      {errors.length > 0 && (
        <View style={[styles.messagesSection, { borderTopColor: theme === 'dark' ? '#3C3C3E' : '#eee' }]}>
          <Text style={[styles.messagesTitle, { color: colors.textPrimary }]}>⚠️ Errors:</Text>
          {errors.map((error, idx) => (
            <Text key={idx} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={[styles.messagesSection, { borderTopColor: theme === 'dark' ? '#3C3C3E' : '#eee' }]}>
          <Text style={[styles.messagesTitle, { color: colors.textPrimary }]}>⚡ Warnings:</Text>
          {warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}

      {/* Success */}
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

function CheckItem({ label, passed, message, theme, colors }: any) {
  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkIcon}>{passed ? '✅' : '❌'}</Text>
      <View style={styles.checkContent}>
        <Text style={[styles.checkLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text
          style={[
            styles.checkMessage,
            { color: theme === 'dark' ? '#999' : '#666' },
            !passed && styles.checkMessageError
          ]}
        >
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
    marginBottom: 12,
  },
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    marginBottom: 2,
  },
  checkMessage: {
    fontSize: 13,
  },
  checkMessageError: {
    color: '#dc3545',
  },
  messagesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  messagesTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
