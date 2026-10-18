import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

const COLORS = {
  bg: '#0B0B0B', primary: '#39FF5A', secondary: '#FF9F1C',
  text: '#F5F5F5', card: '#1E1E1E', muted: '#888',
};

export default function AuthScreen({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // login | register
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erreur', 'Email et mot de passe requis');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    onSuccess && onSuccess();
  };

  const handleRegister = async () => {
    if (!nom || !email || !password) return Alert.alert('Erreur', 'Tous les champs sont requis');
    if (password.length < 6) return Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); return Alert.alert('Erreur', error.message); }
    // Créer le profil
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, nom, telephone,
      });
    }
    setLoading(false);
    Alert.alert('✅ Compte créé !', 'Bienvenue chez Kaleta !');
    onSuccess && onSuccess();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* LOGO */}
          <View style={styles.logoSection}>
            <Text style={styles.logo}>KALETA</Text>
            <Text style={styles.logoSub}>TERRASSE · LOUNGE</Text>
            <View style={styles.logoDivider} />
          </View>

          <Text style={styles.title}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Connectez-vous pour passer commande'
              : 'Rejoignez Kaleta pour commander facilement'}
          </Text>

          {/* TABS */}
          <View style={styles.modeTabs}>
            <TouchableOpacity style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}>
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => setMode('register')}>
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            {mode === 'register' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>NOM COMPLET *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color={COLORS.muted} />
                    <TextInput style={styles.input} placeholder="Votre nom complet"
                      placeholderTextColor={COLORS.muted} value={nom} onChangeText={setNom} />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>TÉLÉPHONE</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={16} color={COLORS.muted} />
                    <TextInput style={styles.input} placeholder="91 XX XX XX"
                      placeholderTextColor={COLORS.muted} value={telephone}
                      onChangeText={setTelephone} keyboardType="phone-pad" />
                  </View>
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color={COLORS.muted} />
                <TextInput style={styles.input} placeholder="votre@email.com"
                  placeholderTextColor={COLORS.muted} value={email}
                  onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>MOT DE PASSE *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} />
                <TextInput style={styles.input} placeholder="••••••••"
                  placeholderTextColor={COLORS.muted} value={password}
                  onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
              <Text style={styles.submitBtnText}>
                {loading ? 'Chargement...' : mode === 'login' ? '🔐 SE CONNECTER' : '✅ CRÉER MON COMPTE'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Vos données sont sécurisées et utilisées uniquement pour vos commandes chez Kaleta.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'flex-end' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  logo: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: 6 },
  logoSub: { fontSize: 10, color: COLORS.muted, letterSpacing: 4, marginTop: 2 },
  logoDivider: { width: 40, height: 1, backgroundColor: COLORS.primary, marginTop: 12, opacity: 0.6 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 24, lineHeight: 19 },
  modeTabs: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 10, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#2a2a2a' },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  modeTabActive: { backgroundColor: COLORS.primary },
  modeTabText: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },
  modeTabTextActive: { color: '#000' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  note: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 17 },
});
