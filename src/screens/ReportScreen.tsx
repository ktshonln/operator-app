import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

export const ReportScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Header title={t('reports.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stats}>
          <View style={styles.box}>
            <Typography variant="caption" color={COLORS.white}>{t('reports.revenue')}</Typography>
            <Typography variant="body" color={COLORS.white} style={{ fontWeight: 'bold' }}>450K</Typography>
          </View>
          <View style={[styles.box, { backgroundColor: '#38A169' }]}>
            <Typography variant="caption" color={COLORS.white}>{t('reports.sales')}</Typography>
            <Typography variant="body" color={COLORS.white} style={{ fontWeight: 'bold' }}>124</Typography>
          </View>
        </View>

        <View style={styles.miniChart}>
          <Typography variant="caption" style={{ fontWeight: 'bold' }}>{t('reports.usage')}</Typography>
          <View style={styles.bars}>
            <View style={[styles.bar, { height: 30 }]} />
            <View style={[styles.bar, { height: 50 }]} />
            <View style={[styles.bar, { height: 20 }]} />
            <View style={[styles.bar, { height: 45, backgroundColor: COLORS.brand }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  box: {
    flex: 0.48,
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    padding: 12,
  },
  miniChart: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginTop: 8,
  },
  bar: {
    width: 12,
    backgroundColor: '#CBD5E0',
    borderRadius: 2,
    marginRight: 8,
  },
});
