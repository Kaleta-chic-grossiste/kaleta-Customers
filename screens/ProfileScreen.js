import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabase';
import AuthScreen from './AuthScreen';
import KaletaHeader from '../components/KaletaHeader';

const STATUT_CONFIG = {
  'nouvelle':       { color: '#FF9F1C', bg: '#2a1800', label: '🕐 Nouvelle',        step: 1 },
  'en préparation': { color: '#38bdf8', bg: '#001a2a', label: '👨‍🍳 En préparation', step: 2 },
  'prête':          { color: '#39FF5A', bg: '#0d2a14', label: '✅ Prête',            step: 3 },
  'livrée':         { color: '#a78bfa', bg: '#1a0a2a', label: '🎉 Livrée',           step: 4 },
  'annulée':        { color: '#ff4444', bg: '#2a0a0a', label: '❌ Annulée',          step: 0 },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { isDark, colors, toggleTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedCommande, setSelectedCommande] = useState(null);

  useEffect(() => {
    if (profile) { setNom(profile.nom || ''); setTelephone(profile.telephone || ''); }
  }, [profile]);

  useEffect(() => { if (user) fetchCommandes(); }, [user]);

  const fetchCommandes = async () => {
    setLoading(true);
    const { data } = await supabase.from('commandes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setCommandes(data || []);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    await updateProfile({ nom, telephone });
    setEditMode(false);
    Alert.alert('✅', 'Profil mis à jour !');
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <KaletaHeader title="PROFIL" />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="person-outline" size={48} color={colors.muted} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' }}>Pas encore connecté</Text>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30 }}>
            Créez un compte pour commander, suivre vos commandes et profiter d'une expérience personnalisée.
          </Text>
          <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 24 }}
            onPress={() => setShowAuth(true)}>
            <Ionicons name="person-add-outline" size={18} color="#000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>CRÉER UN COMPTE / SE CONNECTER</Text>
          </TouchableOpacity>

          {/* THEME TOGGLE même sans compte */}
          <View style={{ marginTop: 30, width: '100%', backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? '#1a1a2a' : '#fff3e0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#a78bfa' : colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{isDark ? 'Mode sombre' : 'Mode clair'}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}</Text>
            </View>
            <Switch value={!isDark} onValueChange={toggleTheme}
              trackColor={{ false: '#333', true: colors.primary + '66' }}
              thumbColor={isDark ? '#888' : colors.primary} />
          </View>
        </View>

        <Modal visible={showAuth} animationType="slide" onRequestClose={() => setShowAuth(false)}>
          <AuthScreen onClose={() => setShowAuth(false)} />
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <KaletaHeader title="PROFIL" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* PROFIL CARD */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, margin: 20, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '22', borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>
              {(profile?.nom || user.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{profile?.nom || 'Utilisateur'}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>{user.email}</Text>
            {profile?.telephone && <Text style={{ color: colors.muted, fontSize: 12 }}>📞 {profile.telephone}</Text>}
          </View>
          <TouchableOpacity onPress={() => setEditMode(!editMode)} style={{ padding: 8 }}>
            <Ionicons name={editMode ? 'close' : 'pencil-outline'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* EDIT FORM */}
        {editMode && (
          <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 14 }}>MODIFIER MON PROFIL</Text>
            {[
              { label: 'NOM COMPLET', value: nom, onChange: setNom, placeholder: 'Votre nom' },
              { label: 'TÉLÉPHONE', value: telephone, onChange: setTelephone, placeholder: '91 XX XX XX', keyboardType: 'phone-pad' },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>{f.label}</Text>
                <TextInput style={{ backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border }}
                  value={f.value} onChangeText={f.onChange} placeholder={f.placeholder}
                  placeholderTextColor={colors.muted} keyboardType={f.keyboardType} />
              </View>
            ))}
            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }} onPress={handleSaveProfile}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>✅ SAUVEGARDER</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* THÈME */}
        <View style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? '#1a1a2a' : '#fff3e0', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#a78bfa' : colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{isDark ? 'Mode sombre' : 'Mode clair'}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}</Text>
            </View>
            <Switch value={!isDark} onValueChange={toggleTheme}
              trackColor={{ false: '#333', true: colors.primary + '66' }}
              thumbColor={isDark ? '#888' : colors.primary} />
          </View>
        </View>

        {/* COMMANDES */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>MES COMMANDES</Text>
            <TouchableOpacity onPress={fetchCommandes}>
              <Ionicons name="refresh-outline" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Chargement...</Text>
          ) : commandes.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 30, gap: 10 }}>
              <Ionicons name="bag-outline" size={36} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 14 }}>Aucune commande pour l'instant</Text>
            </View>
          ) : commandes.map(cmd => {
            const statut = STATUT_CONFIG[cmd.statut] || STATUT_CONFIG['nouvelle'];
            const items = Array.isArray(cmd.items) ? cmd.items : [];
            return (
              <TouchableOpacity key={cmd.id}
                style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setSelectedCommande(cmd)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>#{cmd.id.slice(0, 8).toUpperCase()}</Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: statut.bg }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: statut.color }}>{statut.label}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                  {new Date(cmd.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={{ color: colors.muted + 'cc', fontSize: 12, marginBottom: 8 }} numberOfLines={1}>
                  {items.map(i => `${i.name || i.nom} ×${i.qty}`).join(', ')}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>{cmd.total?.toLocaleString()} CFA</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Voir détails →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DÉCONNEXION */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 16, backgroundColor: '#2a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#ff444433' }}
          onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ff4444" />
          <Text style={{ color: '#ff4444', fontWeight: '800', fontSize: 14 }}>SE DÉCONNECTER</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* DÉTAIL COMMANDE */}
      <Modal visible={!!selectedCommande} transparent animationType="slide" onRequestClose={() => setSelectedCommande(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 36, height: 3, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            {selectedCommande && (() => {
              const statut = STATUT_CONFIG[selectedCommande.statut] || STATUT_CONFIG['nouvelle'];
              const items = Array.isArray(selectedCommande.items) ? selectedCommande.items : [];
              return (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <View>
                      <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 2, marginBottom: 3 }}>COMMANDE #{selectedCommande.id.slice(0, 8).toUpperCase()}</Text>
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 }}>SUIVI</Text>
                    </View>
                    <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 4, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => setSelectedCommande(null)}>
                      <Ionicons name="close" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* STEPS */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    {['nouvelle', 'en préparation', 'prête', 'livrée'].map((s, i) => {
                      const cfg = STATUT_CONFIG[s];
                      const isActive = statut.step >= cfg.step;
                      return (
                        <View key={s} style={{ alignItems: 'center', flex: 1 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isActive ? colors.primary : colors.bg, borderWidth: 2, borderColor: isActive ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                            {isActive && <Ionicons name="checkmark" size={12} color="#000" />}
                          </View>
                          <Text style={{ color: isActive ? colors.primary : colors.muted, fontSize: 9, textAlign: 'center', fontWeight: '600' }}>{cfg.label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

                  <ScrollView style={{ maxHeight: 200 }}>
                    {items.map((item, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>{item.name || item.nom}</Text>
                        <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 10 }}>×{item.qty}</Text>
                        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                          {((item.prix || item.price || 0) * item.qty).toLocaleString()} CFA
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>TOTAL</Text>
                    <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>{selectedCommande.total?.toLocaleString()} CFA</Text>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({});
