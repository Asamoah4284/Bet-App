import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

/**
 * Moolre MoMo checkout WebView — same redirect detection pattern as As-market.
 */
export function MoolrePayment({
  isVisible,
  authorizationUrl,
  callbackUrl,
  paymentReference,
  onCancel,
  onSuccess,
}) {
  const theme = useTheme();
  const successFiredRef = useRef(false);
  const [confirming, setConfirming] = useState(false);

  const extractRef = useCallback(
    (url) => {
      try {
        const urlObj = new URL(url);
        return (
          urlObj.searchParams.get('reference') ||
          urlObj.searchParams.get('externalref') ||
          urlObj.searchParams.get('ref') ||
          paymentReference
        );
      } catch {
        const match = url.match(/[?&](?:reference|externalref|ref)=([^&]+)/i);
        return (match && match[1]) || paymentReference;
      }
    },
    [paymentReference]
  );

  const isSuccessUrl = useCallback(
    (url) => {
      if (!url) return false;
      const lower = url.toLowerCase();

      if (callbackUrl) {
        const callbackBase = callbackUrl.split('?')[0].split('#')[0].toLowerCase();
        if (lower.includes(callbackBase)) return true;
      }

      return (
        lower.includes('payment-success') ||
        lower.includes('/success') ||
        lower.includes('?success=') ||
        lower.includes('&success=true') ||
        lower.startsWith('quibet://payment-success')
      );
    },
    [callbackUrl]
  );

  const handlePaymentDetected = useCallback(
    (url) => {
      if (successFiredRef.current) return;
      successFiredRef.current = true;
      const ref = extractRef(url);
      setConfirming(true);
      onSuccess({ reference: ref, externalref: ref });
    },
    [extractRef, onSuccess]
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request) => {
      const { url } = request;
      if (isSuccessUrl(url)) {
        handlePaymentDetected(url);
        return false;
      }
      return true;
    },
    [isSuccessUrl, handlePaymentDetected]
  );

  const handleNavigationStateChange = useCallback(
    (navState) => {
      const { url } = navState;
      if (isSuccessUrl(url)) {
        handlePaymentDetected(url);
      }
    },
    [isSuccessUrl, handlePaymentDetected]
  );

  const handleCancel = () => {
    successFiredRef.current = false;
    setConfirming(false);
    onCancel();
  };

  if (!authorizationUrl) return null;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable
            onPress={handleCancel}
            disabled={confirming}
            style={[styles.closeButton, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons
              name="close"
              size={22}
              color={confirming ? theme.colors.textSecondary : theme.colors.text}
            />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {confirming ? 'Confirming payment…' : 'Complete Payment'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Secure payment via Moolre MoMo
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <WebView
          source={{ uri: authorizationUrl }}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webview}
        />

        {confirming ? (
          <View style={styles.confirmingOverlay}>
            <View style={[styles.confirmingCard, { backgroundColor: theme.colors.surface }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.confirmingTitle, { color: theme.colors.text }]}>
                Confirming your payment
              </Text>
              <Text style={[styles.confirmingSubtitle, { color: theme.colors.textSecondary }]}>
                Please wait while we verify your transaction…
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
  confirmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 246, 249, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmingCard: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 14,
    borderRadius: 16,
    paddingVertical: 24,
  },
  confirmingTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
