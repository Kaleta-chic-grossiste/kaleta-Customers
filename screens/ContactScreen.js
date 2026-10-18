import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParams } from '../context/ParamsContext';
import { useTheme } from '../context/ThemeContext';
import KaletaHeader from '../components/KaletaHeader';

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { params, waUrl, callUrl } = useParams();
  const { colors } = useTheme();

  const openMaps = () => Linking.openURL(params.google_maps_url || 'https://maps.google.com/?q=Deux+Lions+Lome+Togo');
  const horaires = `${params.horaire_ouverture || '16:00'} – ${params.horaire_fermeture || '00:00'}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        <KaletaHeader title="CONTACT" right={<Ionicons name="sunny-outline" size={22} color={colors.primary} />} />

        {/* ADRESSE */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>ADRESSE</Text>
          </View>
          <Text style={[styles.addressText, { color: colors.text }]}>{params.adresse_complete || params.localisation}</Text>
          <TouchableOpacity style={[styles.mapsBtn, { borderBottomColor: colors.primary }]} onPress={openMaps}>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
            <Text style={[styles.mapsBtnText, { color: colors.primary }]}>OUVRIR DANS MAPS</Text>
          </TouchableOpacity>
        </View>

        {/* MAP */}
        <View style={[styles.mapPlaceholder, { borderColor: colors.border }]}>
          <View style={[styles.mapInner, { backgroundColor: colors.card }]}>
            <Ionicons name="map" size={40} color={colors.primary} />
            <Text style={[styles.mapLabel, { color: colors.text }]}>Deux Lions · Agoè · Lomé</Text>
            <Text style={[styles.mapSub, { color: colors.muted }]}>En face du Lycée d'Agbé</Text>
            <TouchableOpacity onPress={openMaps}>
              <Text style={[styles.mapOpenBtnText, { color: colors.primary }]}>Voir sur Google Maps →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TÉLÉPHONE */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>TÉLÉPHONE</Text>
          </View>
          <Text style={[styles.phoneNumber, { color: colors.text }]}>{params.telephone || '91 00 84 84'}</Text>
          <View style={styles.phoneButtons}>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(callUrl())}>
              <Ionicons name="call" size={18} color="#000" />
              <Text style={styles.callBtnText}>APPELER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waBtn}
              onPress={() => Linking.openURL(waUrl('Bonjour KALETA !'))}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.waBtnText}>WHATSAPP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HORAIRES */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>HORAIRES</Text>
          </View>
          <View style={[styles.hoursCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.hoursRow}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={[styles.hoursText, { color: colors.text }]}>
                Tous les jours : <Text style={{ fontWeight: '800' }}>{horaires}</Text>
              </Text>
            </View>
            <View style={styles.hoursRow}>
              <Ionicons name="musical-notes" size={14} color={colors.secondary} />
              <Text style={[styles.hoursSub, { color: colors.muted }]}>Ambiance lounge à partir de 20h</Text>
            </View>
          </View>
        </View>

        {/* RÉSEAUX */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="share-social" size={16} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>SUIVEZ-NOUS</Text>
          </View>
          <View style={styles.socialRow}>
            {[
              { label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', url: params.facebook_url },
              { label: 'Instagram', icon: 'logo-instagram', color: '#E1306C', url: params.instagram_url },
              { label: 'TikTok', icon: 'musical-note', color: '#010101', url: params.tiktok_url },
            ].map(s => (
              <TouchableOpacity key={s.label}
                style={[styles.socialBtn, { backgroundColor: s.color, opacity: s.url ? 1 : 0.35 }]}
                onPress={() => s.url && Linking.openURL(s.url)} disabled={!s.url}>
                <Ionicons name={s.icon} size={22} color="#fff" />
                <Text style={styles.socialLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerLogo, { color: colors.primary }]}>KALETA</Text>
          <Text style={[styles.footerSub, { color: colors.muted }]}>TERRASSE · LOUNGE</Text>
          <Text style={[styles.footerQuote, { color: colors.text }]}>"Ici chaque plat est une histoire,</Text>
          <Text style={[styles.footerQuote, { color: colors.secondary }]}>Chaque saveur est un voyage."</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerKicker: { fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 6 },
  headerRule: { height: 1, marginHorizontal: 20, marginBottom: 20 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionLabel: { fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  addressText: { fontSize: 15, lineHeight: 24, marginBottom: 14 },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderBottomWidth: 1, paddingBottom: 2 },
  mapsBtnText: { fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  mapPlaceholder: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 28, borderWidth: 1 },
  mapInner: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapLabel: { fontWeight: '700', fontSize: 15 },
  mapSub: { fontSize: 12 },
  mapOpenBtnText: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  phoneNumber: { fontSize: 32, fontWeight: '900', marginBottom: 14 },
  phoneButtons: { flexDirection: 'row', gap: 12 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  callBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14 },
  waBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  hoursCard: { borderRadius: 14, padding: 16, gap: 10, borderWidth: 1 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursText: { fontSize: 14 },
  hoursSub: { fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, gap: 6 },
  socialLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 30, borderTopWidth: 1, marginHorizontal: 20 },
  footerLogo: { fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  footerSub: { fontSize: 11, letterSpacing: 3, marginBottom: 16 },
  footerQuote: { fontSize: 13, fontStyle: 'italic' },
});
