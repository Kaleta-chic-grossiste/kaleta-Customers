import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, Animated, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';
import { useParams } from '../context/ParamsContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cfd1cd5c?w=800&q=80',
];

const RADIUS_SM = 8;
const RADIUS_MD = 14;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { params, waUrl, callUrl } = useParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const goldAnim = useRef(new Animated.Value(0)).current;
  const [bannerImages, setBannerImages] = useState(BANNER_IMAGES);
  const [selectionChef, setSelectionChef] = useState([]);
  const [evenements, setEvenements] = useState([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      Animated.timing(goldAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
    ]).start();
    fetchDynamic();
  }, []);

  const fetchDynamic = async () => {
    try {
      const [banners, chef, events] = await Promise.all([
        supabase.from('bannieres').select('url').eq('visible', true).order('ordre'),
        supabase.from('selection_chef').select('*').eq('visible', true),
        supabase.from('evenements').select('*').eq('visible', true).order('created_at', { ascending: false }),
      ]);
      if (banners.data?.length > 0) setBannerImages(banners.data.map(b => b.url));
      if (chef.data) {
        const fermeture = params.horaire_fermeture || '00:00';
        const [h, m] = fermeture.split(':');
        const fin = new Date(); fin.setHours(parseInt(h), parseInt(m), 0);
        const chefActifs = chef.data.filter(item => {
          if (!item.heure_fin) return true;
          const [ih, im] = item.heure_fin.split(':');
          const itemFin = new Date(); itemFin.setHours(parseInt(ih), parseInt(im), 0);
          return new Date() < itemFin;
        });
        // Plats sans image_url → récupérer depuis historique_plats
        const sansImage = chefActifs.filter(i => !i.image_url && i.menu_item_id);
        if (sansImage.length > 0) {
          const ids = sansImage.map(i => i.menu_item_id);
          const { data: platsData } = await supabase
            .from('historique_plats').select('id, image_url').in('id', ids);
          const imagesMap = {};
          (platsData || []).forEach(p => { imagesMap[p.id] = p.image_url; });
          setSelectionChef(chefActifs.map(item => ({
            ...item,
            image_url: item.image_url || imagesMap[item.menu_item_id] || null,
          })));
        } else {
          setSelectionChef(chefActifs);
        }
      }
      if (events.data) setEvenements(events.data);
    } catch (e) { console.log('Home fetch error:', e.message); }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % bannerImages.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [bannerImages]);

  const openWhatsApp = () => Linking.openURL(waUrl('Bonjour KALETA !'));
  const callPhone = () => Linking.openURL(callUrl());
  const sloganParts = (params.slogan_actif || 'Ici chaque plat est une histoire,|Chaque saveur est un voyage.').split('|');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: goldAnim }]}>
          <View style={styles.headerOrnamentRow}>
            <View style={[styles.headerLine, { backgroundColor: colors.primary, opacity: 0.35 }]} />
            <View style={[styles.headerDiamond, { borderColor: colors.primary }]} />
            <View style={[styles.headerLine, { backgroundColor: colors.primary, opacity: 0.35 }]} />
          </View>
          {/* LOGO */}
          <Image
            source={require('../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.headerEst, { color: colors.muted }]}>EST. 2026</Text>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>KALETA</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>TERRASSE · LOUNGE · GASTRONOMIE</Text>
          <View style={styles.headerStars}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name="star" size={8} color={colors.primary} style={{ marginHorizontal: 2 }} />
            ))}
          </View>
          <View style={[styles.headerOrnamentRow, { marginTop: 10 }]}>
            <View style={[styles.headerLine, { backgroundColor: colors.primary, opacity: 0.35 }]} />
            <View style={[styles.headerDiamond, { borderColor: colors.primary }]} />
            <View style={[styles.headerLine, { backgroundColor: colors.primary, opacity: 0.35 }]} />
          </View>
        </Animated.View>

        {/* ── BANNER CAROUSEL ── */}
        <View style={styles.bannerContainer}>
          <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {bannerImages.map((uri, i) => (
              <View key={i} style={styles.bannerSlide}>
                <Image source={{ uri }} style={styles.bannerImage} />
                <LinearGradient colors={['transparent', colors.bg + 'F5']} style={StyleSheet.absoluteFill} />
              </View>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {bannerImages.map((_, i) => (
              <View key={i} style={[styles.dot,
                { backgroundColor: i === activeSlide ? colors.primary : 'rgba(255,255,255,0.25)' },
                i === activeSlide && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.bannerBadge}>
            <View style={[styles.bannerBadgeLine, { backgroundColor: colors.primary }]} />
            <Text style={[styles.bannerBadgeText, { color: colors.primary }]}>OUVERT DEPUIS LE 14 MAI 2026</Text>
            <View style={[styles.bannerBadgeLine, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* ── WELCOME ── */}
        <Animated.View style={[styles.welcomeSection, {
          opacity: fadeAnim, transform: [{ translateY: slideAnim }],
          backgroundColor: colors.card, borderColor: colors.border, borderTopColor: colors.primary,
        }]}>
          <Text style={[styles.welcomeLabel, { color: colors.primary }]}>BIENVENUE</Text>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            L'Art de{'\n'}<Text style={[styles.welcomeTitleGold, { color: colors.primary }]}>Bien Recevoir</Text>
          </Text>
          <View style={[styles.welcomeDivider, { backgroundColor: colors.primary }]} />
          <Text style={[styles.welcomeText, { color: colors.muted }]}>
            {params.texte_bienvenue || "Niché au cœur d'Agoè Deux Lions, Kaleta transcende l'ordinaire. Un espace où l'art culinaire africain rencontre l'élégance d'un lounge contemporain."}
          </Text>
          <View style={[styles.quoteContainer, { borderTopColor: colors.border }]}>
            <View style={[styles.quoteAccent, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteLine1, { color: colors.text }]}>"{sloganParts[0]}</Text>
              <Text style={[styles.quoteLine2, { color: colors.secondary }]}>{sloganParts[1] || 'Chaque saveur est un voyage.'}"</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── TAGLINE ── */}
        <View style={styles.taglineContainer}>
          <View style={[styles.taglineRule, { backgroundColor: colors.border }]} />
          <Text style={[styles.tagline, { color: colors.text }]}>{params.tagline || "PLUS QU'UN RESTAURANT,\nUNE EXPÉRIENCE À VIVRE."}</Text>
          <View style={[styles.taglineRule, { backgroundColor: colors.border }]} />
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={[styles.ctaPrimary, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Réserver')} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={15} color="#080808" />
            <Text style={styles.ctaPrimaryText}>RÉSERVER UNE TABLE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctaSecondary, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('Menu')} activeOpacity={0.85}>
            <Ionicons name="restaurant-outline" size={15} color={colors.primary} />
            <Text style={[styles.ctaSecondaryText, { color: colors.primary }]}>NOTRE MENU</Text>
          </TouchableOpacity>
        </View>

        {/* ── INFO CARDS ── */}
        <View style={styles.infoGrid}>
          {[
            { icon: 'time-outline', label: 'HORAIRES', value: `${params.horaire_ouverture || '16h'} – ${params.horaire_fermeture || '00h'}`, sub: 'Tous les jours', onPress: callPhone },
            { icon: 'location-outline', label: 'ADRESSE', value: 'Deux Lions', sub: "Face Lycée d'Agbé", onPress: null },
            { icon: 'call-outline', label: 'CONTACT', value: params.telephone || '91 00 84 84', sub: 'Appeler', onPress: callPhone },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={item.onPress} disabled={!item.onPress} activeOpacity={0.75}>
              <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={item.icon} size={19} color={colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{item.value}</Text>
              <Text style={[styles.infoSub, { color: colors.muted }]}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOUNGE BANNER ── */}
        <View style={[styles.loungeBanner, { borderColor: colors.border }]}>
          <LinearGradient colors={[colors.card, colors.bg]} style={styles.loungeBannerInner}>
            <View style={styles.loungeOrnamentRow}>
              <View style={[styles.loungeOrnLine, { backgroundColor: colors.primary }]} />
              <View style={[styles.loungeOrnDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.loungeOrnLine, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.loungeKicker, { color: colors.muted }]}>CHAQUE SOIR · À PARTIR DE 20H</Text>
            <Text style={[styles.loungeTitle, { color: colors.primary }]}>AMBIANCE LOUNGE</Text>
            <Text style={[styles.loungeDesc, { color: colors.muted }]}>
              Laissez-vous emporter par une atmosphère envoûtante, entre musique et cocktails d'exception.
            </Text>
            <View style={styles.loungeOrnamentRow}>
              <View style={[styles.loungeOrnLine, { backgroundColor: colors.primary }]} />
              <View style={[styles.loungeOrnDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.loungeOrnLine, { backgroundColor: colors.primary }]} />
            </View>
          </LinearGradient>
        </View>

        {/* ── ÉVÉNEMENTS ── */}
        {evenements.map((ev, i) => (
          <TouchableOpacity key={i} style={[styles.eventBanner, { borderColor: colors.primary + '40' }]}
            onPress={openWhatsApp} activeOpacity={0.85}>
            <LinearGradient colors={[colors.card, colors.bg]} style={styles.eventBannerInner}>
              <View style={styles.eventLeft}>
                <Text style={[styles.eventDay, { color: colors.primary }]}>{ev.date?.split(' ')[0]}</Text>
                <Text style={[styles.eventMonth, { color: colors.primary }]}>{ev.date?.split(' ')[1]?.toUpperCase()}</Text>
              </View>
              <View style={[styles.eventSeparator, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text style={[styles.eventKicker, { color: colors.muted }]}>ÉVÉNEMENT</Text>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{ev.titre}</Text>
                {ev.description ? <Text style={[styles.eventDesc, { color: colors.muted }]}>{ev.description}</Text> : null}
                {ev.heure ? <Text style={[styles.eventDesc, { color: colors.muted }]}>🕐 {ev.heure}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* ── SÉLECTION DU CHEF ── */}
        {selectionChef.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleRule, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>SÉLECTION DU CHEF</Text>
              <View style={[styles.sectionTitleRule, { backgroundColor: colors.border }]} />
            </View>
            <TouchableOpacity style={styles.sectionLinkWrap} onPress={() => navigation.navigate('Menu')}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>Voir la carte →</Text>
            </TouchableOpacity>

            {/* GRILLE AVEC IMAGES */}
            <View style={styles.chefGrid}>
              {selectionChef.map((item, i) => (
                <TouchableOpacity key={i}
                  style={[styles.chefCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigation.navigate('Menu')} activeOpacity={0.85}>
                  {/* IMAGE */}
                  <View style={styles.chefImageWrap}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.chefImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.chefImagePlaceholder, { backgroundColor: colors.bg }]}>
                        <Text style={{ fontSize: 32 }}>{item.emoji || '🍽️'}</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', colors.card + 'EE']}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* BADGE CHEF */}
                    <View style={[styles.chefBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.chefBadgeText}>⭐ CHEF</Text>
                    </View>
                  </View>

                  {/* INFOS */}
                  <View style={styles.chefInfo}>
                    <Text style={[styles.chefNom, { color: colors.text }]} numberOfLines={2}>{item.nom}</Text>
                    {item.description ? (
                      <Text style={[styles.chefDesc, { color: colors.muted }]} numberOfLines={1}>{item.description}</Text>
                    ) : null}
                    <View style={styles.chefBottom}>
                      <Text style={[styles.chefPrix, { color: colors.primary }]}>{item.prix?.toLocaleString()} CFA</Text>
                      {item.tag && (
                        <View style={[styles.chefTag, { backgroundColor: colors.secondary + '22', borderColor: colors.secondary + '55' }]}>
                          <Text style={[styles.chefTagText, { color: colors.secondary }]}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── FOOTER ── */}
        <View style={[styles.footerStrip, { borderTopColor: colors.border }]}>
          <View style={[styles.footerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.footerText, { color: colors.muted }]}>KALETA · AGOÈ DEUX LIONS · LOMÉ</Text>
          <View style={[styles.footerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6, alignItems: 'center', gap: 4 },
  headerOrnamentRow: { flexDirection: 'row', alignItems: 'center', width: 100, gap: 8 },
  headerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  headerDiamond: { width: 6, height: 6, borderWidth: 1, transform: [{ rotate: '45deg' }] },
  headerEst: { fontSize: 9, letterSpacing: 5, fontWeight: '400', marginTop: 8 },
  headerLogo: { width: 80, height: 80, marginTop: 8 },
  headerTitle: { fontSize: 38, fontWeight: '900', letterSpacing: 10 },
  headerSub: { fontSize: 9, letterSpacing: 4, fontWeight: '500' },
  headerStars: { flexDirection: 'row', marginTop: 6 },

  /* BANNER */
  bannerContainer: { width, height: 260, position: 'relative' },
  bannerSlide: { width, height: 260 },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  dotsRow: { position: 'absolute', bottom: 46, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { width: 20, borderRadius: 3 },
  bannerBadge: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerBadgeLine: { width: 22, height: StyleSheet.hairlineWidth, opacity: 0.8 },
  bannerBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5 },

  /* WELCOME */
  welcomeSection: { margin: 20, padding: 24, borderRadius: RADIUS_MD, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 2 },
  welcomeLabel: { fontSize: 10, letterSpacing: 6, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  welcomeTitle: { fontSize: 28, fontWeight: '300', textAlign: 'center', lineHeight: 36, letterSpacing: 1, marginBottom: 16 },
  welcomeTitleGold: { fontWeight: '800', fontStyle: 'italic' },
  welcomeDivider: { width: 36, height: StyleSheet.hairlineWidth, alignSelf: 'center', marginBottom: 16, opacity: 0.8 },
  welcomeText: { fontSize: 13.5, lineHeight: 22, textAlign: 'center', letterSpacing: 0.3 },
  quoteContainer: { flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  quoteAccent: { width: 2, marginRight: 12, borderRadius: 2 },
  quoteLine1: { fontSize: 13, fontStyle: 'italic', lineHeight: 20, fontWeight: '300' },
  quoteLine2: { fontSize: 13, fontStyle: 'italic', fontWeight: '600', lineHeight: 20 },

  /* TAGLINE */
  taglineContainer: { paddingHorizontal: 24, marginBottom: 24, alignItems: 'center', gap: 14 },
  taglineRule: { width: 48, height: StyleSheet.hairlineWidth },
  tagline: { fontSize: 16, fontWeight: '800', textAlign: 'center', lineHeight: 26, letterSpacing: 1.5 },

  /* CTA */
  ctaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 22 },
  ctaPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS_SM, paddingVertical: 15, gap: 8 },
  ctaPrimaryText: { color: '#080808', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  ctaSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS_SM, paddingVertical: 15, gap: 8 },
  ctaSecondaryText: { fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },

  /* INFO CARDS */
  infoGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 22 },
  infoCard: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS_MD, padding: 14, alignItems: 'center', gap: 5 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  infoLabel: { fontSize: 8, letterSpacing: 2, fontWeight: '700' },
  infoValue: { fontSize: 11.5, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
  infoSub: { fontSize: 10, textAlign: 'center' },

  /* LOUNGE */
  loungeBanner: { marginHorizontal: 20, borderRadius: RADIUS_MD, overflow: 'hidden', marginBottom: 14, borderWidth: StyleSheet.hairlineWidth },
  loungeBannerInner: { padding: 24, alignItems: 'center', gap: 8 },
  loungeOrnamentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  loungeOrnLine: { flex: 1, height: StyleSheet.hairlineWidth, opacity: 0.6 },
  loungeOrnDot: { width: 4, height: 4, borderRadius: 2 },
  loungeKicker: { fontSize: 9, letterSpacing: 3, fontWeight: '600', marginTop: 4 },
  loungeTitle: { fontWeight: '800', letterSpacing: 4, fontSize: 15 },
  loungeDesc: { fontSize: 12.5, textAlign: 'center', lineHeight: 19, marginBottom: 4 },

  /* ÉVÉNEMENTS */
  eventBanner: { marginHorizontal: 20, borderRadius: RADIUS_MD, overflow: 'hidden', marginBottom: 14, borderWidth: StyleSheet.hairlineWidth },
  eventBannerInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  eventLeft: { alignItems: 'center', minWidth: 42 },
  eventDay: { fontSize: 28, fontWeight: '900', lineHeight: 30 },
  eventMonth: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  eventSeparator: { width: StyleSheet.hairlineWidth, height: 50, marginLeft: 16 },
  eventKicker: { fontSize: 9, letterSpacing: 2.5, fontWeight: '600', marginBottom: 4 },
  eventTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  eventDesc: { fontSize: 11.5, marginTop: 4 },

  /* SÉLECTION DU CHEF — GRILLE AVEC IMAGES */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 4, marginTop: 12 },
  sectionTitleRule: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionTitle: { fontWeight: '800', fontSize: 11, letterSpacing: 3 },
  sectionLinkWrap: { paddingHorizontal: 20, marginBottom: 14 },
  sectionLink: { fontSize: 12, textAlign: 'right' },

  chefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 10 },
  chefCard: { width: CARD_WIDTH, borderRadius: RADIUS_MD, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  chefImageWrap: { position: 'relative', height: CARD_WIDTH * 0.72 },
  chefImage: { width: '100%', height: '100%' },
  chefImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  chefBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  chefBadgeText: { color: '#000', fontSize: 9, fontWeight: '800' },
  chefInfo: { padding: 10 },
  chefNom: { fontWeight: '700', fontSize: 13, marginBottom: 2 },
  chefDesc: { fontSize: 11, marginBottom: 6 },
  chefBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chefPrix: { fontWeight: '800', fontSize: 13 },
  chefTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  chefTagText: { fontSize: 9, fontWeight: '800' },

  /* FOOTER */
  footerStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 8, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  footerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  footerText: { fontSize: 9, letterSpacing: 3, fontWeight: '600' },
});
