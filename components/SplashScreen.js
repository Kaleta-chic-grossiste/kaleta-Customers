import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const LOGO = require('../assets/logo.png');

export default function SplashScreen({ onFinish }) {
  const { colors } = useTheme();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo apparaît avec scale
      Animated.parallel([
        Animated.timing(logoAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      // Texte apparaît
      Animated.timing(textAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Dots apparaissent
      Animated.timing(dotsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Pause
      Animated.delay(800),
    ]).start(() => onFinish?.());
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* LOGO */}
      <Animated.View style={[styles.logoWrap, {
        opacity: logoAnim,
        transform: [{ scale: scaleAnim }],
      }]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* NOM */}
      <Animated.View style={{ opacity: textAnim, alignItems: 'center' }}>
        <Text style={[styles.name, { color: colors.primary }]}>KALETA</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>TERRASSE · LOUNGE · GASTRONOMIE</Text>
      </Animated.View>

      {/* DOTS */}
      <Animated.View style={[styles.dots, { opacity: dotsAnim }]}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  name: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 10,
    marginBottom: 4,
  },
  sub: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
});
