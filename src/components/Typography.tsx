import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { COLORS } from '../theme/colors';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = COLORS.text,
  align = 'left',
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'caption':
        return styles.caption;
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
