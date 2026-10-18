import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import AuthScreen from './AuthScreen';

const COLORS = {
  bg: '#0B0B0B', primary: '#39FF5A', secondary: '#FF9F1C',
  text: '#F5F5F5', card: '#1E1E1E', muted: '#888',
};

const STATUT_CONFIG = {
  'nouvelle':        { color: COLORS.secondary, bg: '#2a1800', label: '🕐 Nouvelle', step: 1 },
  'en préparation':  { color: '#38bdf8',        bg: '#001a2a', label: '👨‍🍳 En préparation', step: 2 },
  'prête':           { color: COLORS.primary,   bg: '#0d2a14', label: '✅ Prête', step: 3 },
  'livrée':          { color: '#a78bfa',        bg: '#1a0a2a', label: '🎉 Livrée', step: 4 },
  'annulée':         { color: '#ff4444',        bg: '#2a0a0a', label: '❌ Annulée', step: 0 },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, updateProfile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedCommande, setSelectedCommande] = useState(null);

  useEffect(() => {
    if (profile) {
      setNom(profile.nom || '');
      setTelephone(profile.telephone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchCommandes();
  }, [user]);

  const fetchCommandes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('commandes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerKicker}>KALETA</Text>
          <Text style={styles.headerTitle}>PROFIL</Text>
        </View>
        <View style={styles.headerRule} />

        <View style={styles.noAuthContainer}>
          <View style={styles.noAuthIcon}>
            <Ionicons name="person-outline" size={48} color={COLORS.muted} />
          </View>
          <Text style={styles.noAuthTitle}>Pas encore connecté</Text>
          <Text style={styles.noAuthText}>
            Créez un compte pour commander, suivre vos commandes et profiter d'une expérience personnalisée.
          </Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => setShowAuth(true)}>
            <Ionicons name="person-add-outline" size={18} color="#000" />
            <Text style={styles.authBtnText}>CRÉER UN COMPTE / SE CONNECTER</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showAuth} animationType="slide" onRequestClose={() => setShowAuth(false)}>
          <AuthScreen onClose={() => setShowAuth(false)} />
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerKicker}>KALETA</Text>
        <Text style={styles.headerTitle}>PROFIL</Text>
      </View>
      <View style={styles.headerRule} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* PROFIL CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(profile?.nom || user.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.nom || 'Utilisateur'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {profile?.telephone && (
              <Text style={styles.profilePhone}>📞 {profile.telephone}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}
            style={styles.editBtn}>
            <Ionicons name={editMode ? 'close' : 'pencil-outline'} size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* EDIT FORM */}
        {editMode && (
          <View style={styles.editForm}>
            <Text style={styles.sectionTitle}>MODIFIER MON PROFIL</Text>
            {[
              { label: 'NOM COMPLET', value: nom, onChange: setNom, placeholder: 'Votre nom' },
              { label: 'TÉLÉPHONE', value: telephone, onChange: setTelephone, placeholder: '91 XX XX XX', keyboardType: 'phone-pad' },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput style={styles.input} value={f.value} onChangeText={f.onChange}
                  placeholder={f.placeholder} placeholderTextColor={COLORS.muted}
                  keyboardType={f.keyboardType} />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>✅ SAUVEGARDER</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMMANDES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MES COMMANDES</Text>
            <TouchableOpacity onPress={fetchCommandes}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Chargement...</Text>
          ) : commandes.length === 0 ? (
            <View style={styles.emptyCommandes}>
              <Ionicons name="bag-outline" size={36} color={COLORS.muted} />
              <Text style={styles.emptyText}>Aucune commande pour l'instant</Text>
            </View>
          ) : (
            commandes.map(cmd => {
              const statut = STATUT_CONFIG[cmd.statut] || STATUT_CONFIG['nouvelle'];
              const items = Array.isArray(cmd.items) ? cmd.items : [];
              return (
                <TouchableOpacity key={cmd.id} style={styles.commandeCard}
                  onPress={() => setSelectedCommande(cmd)}>
                  <View style={styles.commandeHeader}>
                    <Text style={styles.commandeId}>#{cmd.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[styles.commandeStatut, { backgroundColor: statut.bg }]}>
                      <Text style={[styles.commandeStatutText, { color: statut.color }]}>{statut.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.commandeDate}>
                    {new Date(cmd.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.commandeItems} numberOfLines={1}>
                    {items.map(i => `${i.name || i.nom} ×${i.qty}`).join(', ')}
                  </Text>
                  <View style={styles.commandeFooter}>
                    <Text style={styles.commandeTotal}>{cmd.total?.toLocaleString()} CFA</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>Voir détails →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* DECONNEXION */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ff4444" />
          <Text style={styles.signOutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* DÉTAIL COMMANDE */}
      <Modal visible={!!selectedCommande} transparent animationType="slide"
        onRequestClose={() => setSelectedCommande(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            {selectedCommande && (() => {
              const statut = STATUT_CONFIG[selectedCommande.statut] || STATUT_CONFIG['nouvelle'];
              const items = Array.isArray(selectedCommande.items) ? selectedCommande.items : [];
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalKicker}>COMMANDE #{selectedCommande.id.slice(0, 8).toUpperCase()}</Text>
                      <Text style={styles.modalTitle}>SUIVI</Text>
                    </View>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedCommande(null)}>
                      <Ionicons name="close" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  {/* STATUT STEPS */}
                  <View style={styles.stepsContainer}>
                    {['nouvelle', 'en préparation', 'prête', 'livrée'].map((s, i) => {
                      const cfg = STATUT_CONFIG[s];
                      const isActive = statut.step >= cfg.step;
                      const isCurrent = selectedCommande.statut === s;
                      return (
                        <View key={s} style={styles.step}>
                          <View style={[styles.stepDot, isActive && { backgroundColor: COLORS.primary }, isCurrent && { borderColor: COLORS.primary }]}>
                            {isActive && <Ionicons name="checkmark" size={12} color="#000" />}
                          </View>
                          {i < 3 && <View style={[styles.stepLine, isActive && { backgroundColor: COLORS.primary }]} />}
                          <Text style={[styles.stepLabel, isActive && { color: COLORS.primary }]}>{cfg.label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ height: 1, backgroundColor: '#1E1E1E', marginVertical: 16 }} />

                  {/* ITEMS */}
                  <ScrollView style={{ maxHeight: 200 }}>
                    {items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name || item.nom}</Text>
                        <Text style={styles.itemQty}>×{item.qty}</Text>
                        <Text style={styles.itemPrice}>
                          {((item.prix || item.price || 0) * item.qty).toLocaleString()} CFA
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>{selectedCommande.total?.toLocaleString()} CFA</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerKicker: { display: 'none' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: 6 },
  headerRule: { height: 1, backgroundColor: '#1E1E1E', marginHorizontal: 20, marginBottom: 20 },

  // NO AUTH
  noAuthContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, paddingTop: 60 },
  noAuthIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  noAuthTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  noAuthText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  authBtn: { backgroundColor: COLORS.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 24 },
  authBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  // PROFILE
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, margin: 20, backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22', borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  profileEmail: { color: COLORS.muted, fontSize: 12, marginBottom: 2 },
  profilePhone: { color: COLORS.muted, fontSize: 12 },
  editBtn: { padding: 8 },

  editForm: { marginHorizontal: 20, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  fieldLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },

  // SECTION
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  emptyCommandes: { alignItems: 'center', padding: 30, gap: 10 },
  emptyText: { color: COLORS.muted, fontSize: 14 },

  // COMMANDE CARD
  commandeCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  commandeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commandeId: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  commandeStatut: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  commandeStatutText: { fontSize: 11, fontWeight: '700' },
  commandeDate: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  commandeItems: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  commandeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commandeTotal: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 16, backgroundColor: '#2a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#ff444433' },
  signOutText: { color: '#ff4444', fontWeight: '800', fontSize: 14 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131313', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: '#2A2A2A' },
  modalHandle: { width: 36, height: 3, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalKicker: { color: COLORS.muted, fontSize: 10, letterSpacing: 2, fontWeight: '600', marginBottom: 3 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 4, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center' },

  // STEPS
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  step: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepLine: { position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, backgroundColor: '#333', zIndex: -1 },
  stepLabel: { color: COLORS.muted, fontSize: 9, textAlign: 'center', fontWeight: '600' },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  itemName: { flex: 1, color: COLORS.text, fontSize: 13 },
  itemQty: { color: COLORS.muted, fontSize: 13, marginHorizontal: 10 },
  itemPrice: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  totalLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  totalValue: { color: COLORS.primary, fontSize: 22, fontWeight: '900' },
});