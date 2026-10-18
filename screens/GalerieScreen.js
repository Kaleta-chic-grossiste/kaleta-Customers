import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import KaletaHeader from '../components/KaletaHeader';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - 48) / 2;

const FALLBACK = [
  { id: '1', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', label: 'Vue terrasse', categorie: 'TERRASSE' },
  { id: '2', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', label: 'Plat signature', categorie: 'PLATS' },
  { id: '3', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80', label: 'Cocktail bar', categorie: 'COCKTAILS' },
  { id: '4', url: 'https://images.unsplash.com/photo-1550966871-3ed3cfd1cd5c?w=600&q=80', label: 'Ambiance nuit', categorie: 'ÉVÉNEMENTS' },
  { id: '5', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', label: 'Spécialité', categorie: 'PLATS' },
];

export default function GalerieScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('TOUT');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photos, setPhotos] = useState(FALLBACK);
  const [categories, setCategories] = useState(['TOUT', 'TERRASSE', 'PLATS', 'COCKTAILS', 'ÉVÉNEMENTS']);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    try {
      const { data } = await supabase.from('galerie').select('*').eq('visible', true).order('ordre');
      if (data && data.length > 0) {
        setPhotos(data);
        setCategories(['TOUT', ...new Set(data.map(p => p.categorie).filter(Boolean))]);
      }
    } catch (e) { console.log('Galerie fallback'); }
    setLoading(false);
  };

  const filtered = activeFilter === 'TOUT' ? photos : photos.filter(p => p.categorie === activeFilter);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <KaletaHeader title="GALERIE" right={<Text style={{ color: colors.muted, fontSize: 13 }}>{filtered.length} photos</Text>} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {categories.map(f => (
          <TouchableOpacity key={f}
            style={[styles.tab, { backgroundColor: colors.card, borderColor: colors.border },
              activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.tabText, { color: activeFilter === f ? '#000' : colors.muted }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {filtered.map((photo, idx) => (
            <TouchableOpacity key={photo.id}
              style={[styles.photoCard, idx === 0 && styles.photoCardWide]}
              onPress={() => setSelectedPhoto(photo)} activeOpacity={0.88}>
              <Image source={{ uri: photo.url }}
                style={[styles.photo, idx === 0 && styles.photoWide]} resizeMode="cover" />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoLabel}>{photo.label}</Text>
                {photo.categorie && (
                  <View style={[styles.photoCatBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
                    <Text style={[styles.photoCatText, { color: colors.primary }]}>{photo.categorie}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image source={{ uri: selectedPhoto.url }} style={styles.lightboxImage} resizeMode="contain" />
              <View style={styles.lightboxCaption}>
                <Text style={styles.lightboxLabel}>{selectedPhoto.label}</Text>
                {selectedPhoto.categorie && (
                  <View style={[styles.lightboxCat, { backgroundColor: colors.primary }]}>
                    <Text style={styles.lightboxCatText}>{selectedPhoto.categorie}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerKicker: { fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 6 },
  headerCount: { fontSize: 13 },
  headerRule: { height: 1, marginHorizontal: 20, marginBottom: 14 },
  tabsScroll: { maxHeight: 38, marginBottom: 14 },
  tabsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, paddingBottom: 40 },
  photoCard: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoCardWide: { width: '100%', height: 200 },
  photo: { width: '100%', height: IMG_SIZE },
  photoWide: { height: 200 },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoLabel: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  photoCatBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  photoCatText: { fontSize: 9, fontWeight: '800' },
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', alignItems: 'center', justifyContent: 'center' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6 },
  lightboxImage: { width, height: width, maxHeight: 500 },
  lightboxCaption: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lightboxLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lightboxCat: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lightboxCatText: { color: '#000', fontSize: 11, fontWeight: '800' },
});
