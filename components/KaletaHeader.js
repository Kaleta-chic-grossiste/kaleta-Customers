import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LOGO = require('../assets/logo.png');

export default function KaletaHeader({ title, right, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <View style={styles.left}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
