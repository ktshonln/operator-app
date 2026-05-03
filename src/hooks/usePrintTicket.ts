import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Share } from 'react-native';
import { PrintSize } from '../types/ticket';
import { MOCK_TICKETS } from '../mock/transportData';

const PRINT_SIZE_STORAGE_KEY = 'print_ticket_size_preference';

// Mock HTML generator for different print sizes
const generateMockPrintHTML = (ticketId: string, size: PrintSize): string => {
  const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
  
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Generate QR code placeholder (in real app, this would be base64 encoded)
  const qrCodePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
  
  // Company logo placeholder
  const logoPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA3N2ZmIi8+PHRleHQgeD0iMzAiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxvZ288L3RleHQ+PC9zdmc+';

  // Size-specific styles
  const sizeStyles = {
    '58mm': {
      width: '58mm',
      pageSize: '58mm auto',
      qrSize: '30mm',
      logoMaxWidth: '25mm',
    },
    '80mm': {
      width: '80mm',
      pageSize: '80mm auto',
      qrSize: '40mm',
      logoMaxWidth: '35mm',
    },
    'a4': {
      width: '210mm',
      pageSize: 'a4',
      qrSize: '50mm',
      logoMaxWidth: '50mm',
      wrapperStyle: 'max-width: 80mm; margin: 20mm auto;',
    },
  };

  const currentSize = sizeStyles[size];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${ticket.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: #fff;
      color: #000;
      width: ${currentSize.width};
      margin: 0 auto;
      padding: 10px;
    }
    .receipt-wrapper {
      ${size === 'a4' ? currentSize.wrapperStyle : ''}
    }
    .receipt { width: 100%; padding: 4mm; }
    .logo {
      display: block;
      max-width: ${currentSize.logoMaxWidth};
      margin: 0 auto 2mm;
    }
    .company-name {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 3mm;
    }
    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
    .title {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 2mm 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 1mm 0;
    }
    .label { color: #555; }
    .qr-wrapper { text-align: center; margin: 3mm 0; }
    .qr-wrapper img {
      width: ${currentSize.qrSize};
      height: ${currentSize.qrSize};
    }
    .ticket-id {
      text-align: center;
      font-size: 9px;
      color: #555;
      margin-bottom: 3mm;
    }
    .powered-by {
      text-align: center;
      font-size: 8px;
      color: #999;
      margin-top: 3mm;
    }
    @media print {
      body { margin: 0; padding: 0; }
      @page { margin: 0; size: ${currentSize.pageSize}; }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <!-- Company -->
      <img class="logo" src="${logoPlaceholder}" alt="Volcano Express" />
      <div class="company-name">Volcano Express</div>
      <div class="divider"></div>
      <div class="title">TICKET</div>
      <div class="divider"></div>
      
      <!-- Passenger -->
      <div class="row">
        <span class="label">Passenger</span>
        <span>${ticket.passenger_name}</span>
      </div>
      <div class="row">
        <span class="label">Phone</span>
        <span>${ticket.passenger_phone}</span>
      </div>
      <div class="divider"></div>
      
      <!-- Trip -->
      <div class="row">
        <span class="label">From</span>
        <span>${ticket.from_location}</span>
      </div>
      <div class="row">
        <span class="label">To</span>
        <span>${ticket.to_location}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span>${ticket.departure_date}</span>
      </div>
      <div class="row">
        <span class="label">Time</span>
        <span>${ticket.departure_time}</span>
      </div>
      <div class="divider"></div>
      
      <!-- Payment -->
      <div class="row">
        <span class="label">Seats</span>
        <span>${ticket.seats_count}</span>
      </div>
      <div class="row">
        <span class="label">Amount</span>
        <span>RWF ${ticket.total_amount.toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="label">Method</span>
        <span>${ticket.payment_method}</span>
      </div>
      <div class="divider"></div>
      
      <!-- Conditional fields -->
      ${ticket.bus_plate ? `
      <div class="row">
        <span class="label">Bus</span>
        <span>${ticket.bus_plate}</span>
      </div>` : ''}
      
      ${ticket.driver_name ? `
      <div class="row">
        <span class="label">Driver</span>
        <span>${ticket.driver_name}</span>
      </div>` : ''}
      
      ${ticket.issued_by ? `
      <div class="row">
        <span class="label">Issued by</span>
        <span>${ticket.issued_by}</span>
      </div>` : ''}
      
      <div class="divider"></div>
      
      <!-- QR Code -->
      <div class="qr-wrapper">
        <img src="${qrCodePlaceholder}" alt="Scan to verify ticket" />
      </div>
      <div class="ticket-id">${ticket.id}</div>
      <div class="divider"></div>
      <div class="powered-by">powered by katisha online</div>
    </div>
  </div>
  
  <script>
    // Auto-print functionality (commented out for preview)
    // window.onload = function () { 
    //   setTimeout(() => {
    //     window.print(); 
    //   }, 500);
    // }
  </script>
</body>
</html>`;
};

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if ticket exists
      const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
      if (!ticket) {
        throw { status: 404 };
      }
      
      // Generate mock HTML
      const html = generateMockPrintHTML(ticketId, size);
      
      console.log('Mock Print HTML generated for ticket:', ticketId, 'size:', size);
      
      // Set the HTML and show preview
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
        Alert.alert('Error', 'Failed to prepare ticket for printing. Please try again.');
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