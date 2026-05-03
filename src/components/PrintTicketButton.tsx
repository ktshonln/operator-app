import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';
import { usePrintTicket } from '../hooks/usePrintTicket';
import { PrintSizeSelector } from './PrintSizeSelector';
import { PrintPreviewWebView } from './PrintPreviewWebView';

interface PrintTicketButtonProps {
  ticketId: string;
  style?: any;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export const PrintTicketButton: React.FC<PrintTicketButtonProps> = ({
  ticketId,
  style,
  variant = 'primary',
  size = 'medium',
}) => {
  const {
    isLoading,
    showSizeSelector,
    showPreview,
    currentHtml,
    initiatePrint,
    handleSizeConfirm,
    handleSizeCancel,
    changePrintSize,
    getSavedPrintSize,
    closePreview,
    handlePrint,
  } = usePrintTicket();

  const [hasSavedSize, setHasSavedSize] = useState(false);

  useEffect(() => {
    checkSavedSize();
  }, []);

  const checkSavedSize = async () => {
    const savedSize = await getSavedPrintSize();
    setHasSavedSize(!!savedSize);
  };

  const handlePrintPress = () => {
    initiatePrint(ticketId);
  };

  const getButtonStyle = () => {
    return [
      styles.button,
      variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
      size === 'small' && styles.buttonSmall,
      size === 'large' && styles.buttonLarge,
      isLoading && styles.buttonDisabled,
    ].filter(Boolean);
  };

  const getTextColor = () => {
    if (isLoading) return COLORS.textMuted;
    return variant === 'primary' ? COLORS.white : COLORS.brand;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handlePrintPress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={getTextColor()} />
          ) : (
            <Icon name="printer" size={getIconSize()} color={getTextColor()} />
          )}
          <Typography
            variant={size === 'small' ? 'caption' : 'body'}
            color={getTextColor()}
            style={[styles.buttonText, size === 'small' && styles.buttonTextSmall]}
          >
            {isLoading ? 'Preparing...' : 'Print Ticket'}
          </Typography>
        </TouchableOpacity>
        
        {hasSavedSize && !isLoading && (
          <TouchableOpacity
            style={styles.changeSizeButton}
            onPress={changePrintSize}
          >
            <Typography variant="caption" color={COLORS.brand} style={styles.changeSizeText}>
              Change size
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <PrintSizeSelector
        visible={showSizeSelector}
        onClose={handleSizeCancel}
        onConfirm={handleSizeConfirm}
      />

      <PrintPreviewWebView
        visible={showPreview}
        html={currentHtml}
        onClose={closePreview}
        onPrint={handlePrint}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: COLORS.brand,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  changeSizeButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeSizeText: {
    textDecorationLine: 'underline',
    fontSize: 12,
  },
});