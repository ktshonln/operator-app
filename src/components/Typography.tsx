import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { COLORS } from '../theme/colors';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extraBold';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = COLORS.text,
  align = 'left',
  weight,
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'caption':
        return styles.caption;
      default:
        return styles.body;
    }
  };

  const getWeightStyle = () => {
    switch (weight) {
      case 'medium':
        return { fontWeight: '500' };
      case 'semibold':
        return { fontWeight: '600' };
      case 'bold':
        return { fontWeight: '700' };
      case 'extraBold':
        return { fontWeight: '800' };
      default:
        return {};
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        getWeightStyle() as any,
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
    fontWeight: '800',
    letterSpacing: -1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
});
