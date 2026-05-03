import React, { useState, useRef } from 'react';
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
import { Icon, IconName } from './Icon';
import { COLORS } from '../theme/colors';

interface MenuItem {
  id: string;
  title: string;
  icon: IconName;
  onPress: () => void;
  color?: string;
}

interface PopupMenuProps {
  items: MenuItem[];
  children: React.ReactNode;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PopupMenu: React.FC<PopupMenuProps> = ({ items, children }) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showMenu = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        // Calculate menu position
        const menuWidth = 200;
        const menuHeight = items.length * 50 + 16; // 50px per item + padding
        
        let x = px + width - menuWidth; // Align to right edge of button
        let y = py + height + 8; // Below the button with some spacing
        
        // Adjust if menu would go off screen
        if (x < 16) x = 16;
        if (x + menuWidth > screenWidth - 16) x = screenWidth - menuWidth - 16;
        if (y + menuHeight > screenHeight - 100) y = py - menuHeight - 8; // Above button
        
        setMenuPosition({ x, y });
        setVisible(true);
        
        // Animate in
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleItemPress = (item: MenuItem) => {
    hideMenu();
    setTimeout(() => {
      item.onPress();
    }, 100);
  };

  return (
    <>
      <TouchableOpacity ref={buttonRef} onPress={showMenu} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
      >
        <TouchableWithoutFeedback onPress={hideMenu}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.menu,
                {
                  left: menuPosition.x,
                  top: menuPosition.y,
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
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index === items.length - 1 && styles.lastMenuItem,
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={item.color || COLORS.text}
                    style={styles.menuIcon}
                  />
                  <Typography
                    variant="body"
                    style={[
                      styles.menuText,
                      item.color && { color: item.color },
                    ]}
                  >
                    {item.title}
                  </Typography>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});