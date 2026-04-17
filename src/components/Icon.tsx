import React from 'react';
import { ViewStyle } from 'react-native';
import {
  Home,
  User,
  Settings,
  Bell,
  BellOff,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Camera,
  Check,
  CheckCircle,
  X,
  XCircle,
  Lock,
  Mail,
  Phone,
  Users,
  Building2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  LogOut,
  Globe,
  Shield,
  ShieldCheck,
  AlertCircle,
  Info,
  CreditCard,
  Bus,
  Map,
  BarChart3,
  Send,
  Ticket,
  DollarSign,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export type IconName = 
  | 'home'
  | 'person' 
  | 'settings'
  | 'notifications'
  | 'bell-off'
  | 'search'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'eye'
  | 'eye-off'
  | 'camera'
  | 'check'
  | 'check-circle'
  | 'close'
  | 'close-circle'
  | 'lock'
  | 'mail'
  | 'phone'
  | 'users'
  | 'business'
  | 'add'
  | 'edit'
  | 'trash'
  | 'more'
  | 'logout'
  | 'globe'
  | 'shield'
  | 'shield-check'
  | 'alert'
  | 'info'
  | 'card'
  | 'bus'
  | 'map'
  | 'chart'
  | 'send'
  | 'ticket'
  | 'dollar-sign'
  | 'refresh-cw';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const iconMap = {
  'home': Home,
  'person': User,
  'settings': Settings,
  'notifications': Bell,
  'bell-off': BellOff,
  'search': Search,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'eye': Eye,
  'eye-off': EyeOff,
  'camera': Camera,
  'check': Check,
  'check-circle': CheckCircle,
  'close': X,
  'close-circle': XCircle,
  'lock': Lock,
  'mail': Mail,
  'phone': Phone,
  'users': Users,
  'business': Building2,
  'add': Plus,
  'edit': Edit,
  'trash': Trash2,
  'more': MoreVertical,
  'logout': LogOut,
  'globe': Globe,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'alert': AlertCircle,
  'info': Info,
  'card': CreditCard,
  'bus': Bus,
  'map': Map,
  'chart': BarChart3,
  'send': Send,
  'ticket': Ticket,
  'dollar-sign': DollarSign,
  'refresh-cw': RefreshCw,
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = COLORS.text,
  style 
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return <IconComponent size={size} color={color} style={style} />;
};