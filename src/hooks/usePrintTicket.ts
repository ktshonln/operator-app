import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Share } from 'react-native';
import { PrintSize } from '../types/ticket';
import { getTicketPrintHtml } from '../api/tickets';

const PRINT_SIZE_STORAGE_KEY = 'print_ticket_size_preference';

export const usePrintTicket = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [currentSize, setCurrentSize] = useState<PrintSize>('80mm');

  const getSavedPrintSize = async (): Promise<PrintSize | null> => {
    try {
      const savedSize = await AsyncStorage.getItem(PRINT_SIZE_STORAGE_KEY);
      return savedSize as PrintSize | null;
    } catch (error) {
      console.error('Failed to get saved print size:', error);
      return null;
    }
  };

  const savePrintSize = async (size: PrintSize): Promise<void> => {
    try {
      await AsyncStorage.setItem(PRINT_SIZE_STORAGE_KEY, size);
    } catch (error) {
      console.error('Failed to save print size:', error);
    }
  };

  const clearSavedPrintSize = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(PRINT_SIZE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear saved print size:', error);
    }
  };

  const printTicketWithSize = async (ticketId: string, size: PrintSize): Promise<void> => {
    setIsLoading(true);
    
    try {
      const html = await getTicketPrintHtml(ticketId, size);
      setCurrentHtml(html);
      setCurrentSize(size);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Print ticket error:', error);
      
      if (error.status === 404) {
        Alert.alert('Error', 'Ticket not found');
      } else if (error.status === 403) {
        Alert.alert('Error', 'You do not have permission to print this ticket');
      } else {
        Alert.alert('Error', error.message || 'Failed to prepare ticket for printing. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    // In a real app, this would trigger the native print dialog
    // For now, we'll show options to share or simulate printing
    Alert.alert(
      'Print Options',
      'Choose how to handle the ticket:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share HTML', 
          onPress: () => shareTicket()
        },
        { 
          text: 'Simulate Print', 
          onPress: () => {
            setShowPreview(false);
            Alert.alert('Success', `Ticket ${currentTicketId} sent to printer (${currentSize} format)`);
          }
        }
      ]
    );
  };

  const shareTicket = async () => {
    try {
      await Share.share({
        message: 'Ticket HTML',
        title: `Ticket ${currentTicketId}`,
        // Note: React Native Share doesn't support HTML directly
        // In a real app, you'd save the HTML to a file and share that
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const initiatePrint = async (ticketId: string): Promise<void> => {
    setCurrentTicketId(ticketId);
    
    // Check for saved size preference
    const savedSize = await getSavedPrintSize();
    
    if (savedSize) {
      // Use saved preference directly
      await printTicketWithSize(ticketId, savedSize);
    } else {
      // Show size selector
      setShowSizeSelector(true);
    }
  };

  const handleSizeConfirm = async (size: PrintSize, remember: boolean): Promise<void> => {
    setShowSizeSelector(false);
    
    if (remember) {
      await savePrintSize(size);
    }
    
    if (currentTicketId) {
      await printTicketWithSize(currentTicketId, size);
      setCurrentTicketId(null);
    }
  };

  const handleSizeCancel = (): void => {
    setShowSizeSelector(false);
    setCurrentTicketId(null);
  };

  const changePrintSize = (): void => {
    setShowSizeSelector(true);
  };

  const closePreview = (): void => {
    setShowPreview(false);
    setCurrentHtml('');
    setCurrentTicketId(null);
  };

  return {
    isLoading,
    showSizeSelector,
    showPreview,
    currentHtml,
    initiatePrint,
    handleSizeConfirm,
    handleSizeCancel,
    changePrintSize,
    getSavedPrintSize,
    clearSavedPrintSize,
    closePreview,
    handlePrint,
  };
};