import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';
import { PrintSize, PrintSizeOption } from '../types/ticket';

interface PrintSizeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (size: PrintSize, remember: boolean) => void;
}

const { height: screenHeight } = Dimensions.get('window');

const PRINT_SIZE_OPTIONS: PrintSizeOption[] = [
  {
    id: '58mm',
    label: 'Small POS / Mobile Terminal',
    description: '58mm thermal paper',
    preview: '📱',
  },
  {
    id: '80mm',
    label: 'Standard POS / Receipt Printer',
    description: '80mm thermal paper',
    preview: '🖨️',
  },
  {
    id: 'a4',
    label: 'Office Printer / Save as PDF',
    description: 'A4 paper size',
    preview: '📄',
  },
];

export const PrintSizeSelector: React.FC<PrintSizeSelectorProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [selectedSize, setSelectedSize] = useState<PrintSize | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    if (selectedSize) {
      onConfirm(selectedSize, rememberChoice);
      setSelectedSize(null);
      setRememberChoice(false);
    }
  };

  const handleClose = () => {
    setSelectedSize(null);
    setRememberChoice(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modal,
                {
                  opacity: opacityAnim,
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.header}>
                <Typography variant="h3" style={styles.title}>
                  Select Print Size
                </Typography>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Icon name="x" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
                  Choose the paper size for your printer
                </Typography>

                <View style={styles.optionsContainer}>
                  {PRINT_SIZE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.option,
                        selectedSize === option.id && styles.optionSelected,
                      ]}
                      onPress={() => setSelectedSize(option.id)}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionLeft}>
                          <View style={styles.previewContainer}>
                            <Typography variant="h2" style={styles.preview}>
                              {option.preview}
                            </Typography>
                          </View>
                          <View style={styles.optionText}>
                            <Typography variant="body" style={styles.optionLabel}>
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color={COLORS.textSecondary}>
                              {option.description}
                            </Typography>
                          </View>
                        </View>
                        <View style={styles.radioContainer}>
                          <View
                            style={[
                              styles.radio,
                              selectedSize === option.id && styles.radioSelected,
                            ]}
                          >
                            {selectedSize === option.id && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberChoice(!rememberChoice)}
                >
                  <View style={[styles.checkbox, rememberChoice && styles.checkboxChecked]}>
                    {rememberChoice && (
                      <Icon name="check" size={14} color={COLORS.white} />
                    )}
                  </View>
                  <Typography variant="body" style={styles.checkboxLabel}>
                    Remember my choice
                  </Typography>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Typography variant="body" color={COLORS.textSecondary}>
                    Cancel
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !selectedSize && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedSize}
                >
                  <Typography
                    variant="body"
                    color={selectedSize ? COLORS.white : COLORS.textMuted}
                    style={styles.confirmButtonText}
                  >
                    Print Ticket
                  </Typography>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeButton: {
    padding: 6,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brand + '08',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preview: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 14,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.brand,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkboxLabel: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 0,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    minWidth: 0,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  confirmButtonText: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
});