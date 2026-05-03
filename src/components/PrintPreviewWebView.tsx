import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';

interface PrintPreviewWebViewProps {
  visible: boolean;
  html: string;
  onClose: () => void;
  onPrint?: () => void;
}

export const PrintPreviewWebView: React.FC<PrintPreviewWebViewProps> = ({
  visible,
  html,
  onClose,
  onPrint,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="x" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            Print Preview
          </Typography>
          {onPrint && (
            <TouchableOpacity onPress={onPrint} style={styles.printButton}>
              <Icon name="printer" size={20} color={COLORS.white} />
              <Typography variant="body" color={COLORS.white} style={styles.printButtonText}>
                Print
              </Typography>
            </TouchableOpacity>
          )}
        </View>
        
        <WebView
          source={{ html }}
          style={styles.webview}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          onError={(error) => {
            console.error('WebView error:', error);
          }}
          onLoadEnd={() => {
            console.log('WebView loaded successfully');
          }}
        />
        
        <View style={styles.footer}>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.footerText}>
            This is a preview of how the ticket will look when printed. In a real app, this would integrate with native printing APIs.
          </Typography>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  printButtonText: {
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  footer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});