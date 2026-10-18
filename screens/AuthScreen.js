import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RADIUS_SM = 8;
const RADIUS_MD = 14;
const RADIUS_LG = 20;

/* ── FIELD — défini HORS du composant parent pour éviter
   le remontage du TextInput à chaque keystroke (bug clavier) ── */
const Field = ({ label, icon, value, onChange, placeholder, keyboardType, secureTextEntry, rightIcon, onRightIcon, colors }) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.primary }]}>{label}</Text>
    <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <TextInput
        style={[styles.fieldText, { color: colors.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIcon} activeOpacity={0.75}>
          <Ionicons name={rightIcon} size={17} color={colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function AuthScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erreur', 'Remplissez tous les champs');
    setLoading(true);
    try {
      await signIn(email, password);
      onClose?.();
    } catch (e) {
      Alert.alert('Erreur connexion', e.message.includes('Invalid') ? 'Email ou mot de passe incorrect' : e.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!nom || !emailReg || !passwordReg) return Alert.alert('Erreur', 'Remplissez tous les champs');
    if (passwordReg.length < 6) return Alert.alert('Erreur', 'Mot de passe : minimum 6 caractères');
    setLoading(true);
    try {
      await signUp(emailReg, passwordReg, nom, telephone);
      Alert.alert('Compte créé !', 'Bienvenue chez Kaleta !', [{ text: 'OK', onPress: () => onClose?.() }]);
    } catch (e) {
      Alert.alert('Erreur inscription', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
      >

        {/* ── CLOSE ───────────────────────────── */}
        {onClose && (
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 16, backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}

        {/* ── BRANDING ────────────────────────── */}
        <View style={styles.branding}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandingOrnamentRow}>
            <View style={[styles.ornLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.ornDiamond, { borderColor: colors.primary }]} />
            <View style={[styles.ornLine, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.brandLogo, { color: colors.primary }]}>KALETA</Text>
          <Text style={[styles.brandSub, { color: colors.muted }]}>TERRASSE · LOUNGE</Text>
          <View style={[styles.brandDivider, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brandHeading, { color: colors.text }]}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
          <Text style={[styles.brandDesc, { color: colors.muted }]}>
            {mode === 'login' ? 'Connectez-vous pour commander' : 'Rejoignez la famille Kaleta'}
          </Text>
        </View>

        {/* ── TABS ────────────────────────────── */}
        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {['login', 'register'].map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.tab, mode === m && { backgroundColor: colors.primary }]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: mode === m ? '#000' : colors.muted }]}>
                {m === 'login' ? 'SE CONNECTER' : 'CRÉER UN COMPTE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FORM CONNEXION ──────────────────── */}
        {mode === 'login' ? (
          <View style={styles.form}>
            <Field
              label="EMAIL"
              icon="mail-outline"
              value={email}
              onChange={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              colors={colors}
            />
            <Field
              label="MOT DE PASSE"
              icon="lock-closed-outline"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIcon={() => setShowPass(!showPass)}
              colors={colors}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#000" />
              <Text style={styles.submitBtnText}>{loading ? 'CONNEXION...' : 'SE CONNECTER'}</Text>
            </TouchableOpacity>
          </View>
        ) : (

          /* ── FORM INSCRIPTION ─────────────── */
          <View style={styles.form}>
            <Field
              label="NOM COMPLET *"
              icon="person-outline"
              value={nom}
              onChange={setNom}
              placeholder="Votre nom"
              colors={colors}
            />
            <Field
              label="TÉLÉPHONE"
              icon="call-outline"
              value={telephone}
              onChange={setTelephone}
              placeholder="91 XX XX XX"
              keyboardType="phone-pad"
              colors={colors}
            />
            <Field
              label="EMAIL *"
              icon="mail-outline"
              value={emailReg}
              onChange={setEmailReg}
              placeholder="votre@email.com"
              keyboardType="email-address"
              colors={colors}
            />
            <Field
              label="MOT DE PASSE *"
              icon="lock-closed-outline"
              value={passwordReg}
              onChange={setPasswordReg}
              placeholder="Min. 6 caractères"
              secureTextEntry={!showPass}
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIcon={() => setShowPass(!showPass)}
              colors={colors}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={18} color="#000" />
              <Text style={styles.submitBtnText}>{loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── FOOTER ──────────────────────────── */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.muted }]}>KALETA · AGOÈ DEUX LIONS · LOMÉ</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },

  /* ── CLOSE ── */
  closeBtn: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    borderRadius: RADIUS_LG,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  /* ── BRANDING ── */
  branding: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 14,
  },
  brandingOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 8,
    marginBottom: 10,
  },
  ornLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.45,
  },
  ornDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  brandLogo: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '500',
    marginTop: 3,
  },
  brandDivider: {
    width: 32,
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    opacity: 0.6,
  },
  brandHeading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  brandDesc: {
    fontSize: 13,
  },

  /* ── TABS ── */
  tabs: {
    flexDirection: 'row',
    borderRadius: RADIUS_SM,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 26,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: RADIUS_SM - 2,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
  },

  /* ── FORM ── */
  form: { gap: 0 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS_MD,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  fieldText: { flex: 1, fontSize: 14 },

  /* ── SUBMIT ── */
  submitBtn: {
    borderRadius: RADIUS_MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginTop: 10,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },

  /* ── FOOTER ── */
  footer: {
    alignItems: 'center',
    paddingTop: 28,
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '600',
  },
});