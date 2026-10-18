import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Dimensions, Linking, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useParams } from '../context/ParamsContext';
import AuthScreen from './AuthScreen';

import KaletaHeader from '../components/KaletaHeader';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - 48) / 2;
const JOURS = ['LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI','DIMANCHE'];
const getTodayJour = () => { const d = new Date().getDay(); return JOURS[d === 0 ? 6 : d - 1]; };

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const { waUrl } = useParams();
  const [activeTab, setActiveTab] = useState('DU JOUR');
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('TOUT');
  const [menuDuJour, setMenuDuJour] = useState([]);
  const [menuGeneral, setMenuGeneral] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [historiqueVisible, setHistoriqueVisible] = useState(false);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [adresse, setAdresse] = useState('');
  const [telCommande, setTelCommande] = useState('');

  const todayJour = getTodayJour();
  const cartTotal = cart.reduce((sum, i) => sum + (i.prix || 0) * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const platsDuJourIds = menuDuJour.map(m => m.plat_id);

  useEffect(() => { fetchAll(); loadHistorique(); }, []);

  const fetchAll = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [cats, mdj, mg] = await Promise.all([
        supabase.from('categories_plats').select('*').order('ordre'),
        supabase.from('menu_du_jour').select('*, historique_plats(*, categories_plats(nom,couleur))').eq('date', today).order('ordre'),
        supabase.from('menu_general').select('*, historique_plats(*, categories_plats(nom,couleur))').order('ordre'),
      ]);
      setCategories(cats.data || []);
      const mgObj = {};
      JOURS.forEach(j => { mgObj[j] = []; });
      (mg.data || []).forEach(item => { if (mgObj[item.jour]) mgObj[item.jour].push(item); });
      setMenuGeneral(mgObj);
      const mdjData = mdj.data || [];
      if (mdjData.length > 0) {
        setMenuDuJour(mdjData);
      } else {
        const auto = (mgObj[todayJour] || []).map(item => ({ ...item, auto: true, mis_en_relief: true }));
        setMenuDuJour(auto);
      }
    } catch (e) { console.log('Menu error:', e.message); }
    setLoading(false);
  };

  const loadHistorique = async () => {
    try {
      const data = await AsyncStorage.getItem('kaleta_commandes');
      if (data) setHistoriqueCommandes(JSON.parse(data));
    } catch (e) {}
  };

  const saveCommande = async (cmd) => {
    try {
      const existing = await AsyncStorage.getItem('kaleta_commandes');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(cmd);
      await AsyncStorage.setItem('kaleta_commandes', JSON.stringify(list.slice(0, 20)));
      setHistoriqueCommandes(list.slice(0, 20));
    } catch (e) {}
  };

  const addToCart = (plat) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === plat.id);
      if (ex) return prev.map(c => c.id === plat.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...plat, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0)
  );

  const handleCommanderPress = () => {
    if (!user) { setCartVisible(false); setShowAuth(true); return; }
    if (profile?.telephone) setTelCommande(profile.telephone);
    setCartVisible(false);
    setShowOrderForm(true);
  };

  const sendOrder = async () => {
    if (!telCommande.trim()) { Alert.alert('Champs manquants', 'Entrez votre numéro de téléphone'); return; }
    const cmd = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      items: cart.map(c => ({ nom: c.nom, prix: c.prix || 0, qty: c.qty })),
      total: cartTotal, statut: 'envoyée',
    };
    try {
      await supabase.from('commandes').insert({
        items: cart.map(c => ({ id: c.id, name: c.nom, nom: c.nom, prix: c.prix || 0, price: c.prix || 0, qty: c.qty, image: c.image_url })),
        total: cartTotal, statut: 'nouvelle',
        user_id: user?.id || null,
        nom_client: profile?.nom || user?.email || 'Client',
        adresse_livraison: adresse.trim(),
        telephone: telCommande.trim(),
      });
    } catch (e) { console.log('Erreur commande:', e.message); }
    await saveCommande(cmd);
    const msg = `Bonjour KALETA ! 🛒\n\n👤 ${profile?.nom || 'Client'}\n📞 ${telCommande}${adresse ? `\n📍 ${adresse}` : ''}\n\n${cart.map(c => `• ${c.nom} × ${c.qty} = ${((c.prix || 0) * c.qty).toLocaleString()} CFA`).join('\n')}\n\n💰 TOTAL : ${cartTotal.toLocaleString()} CFA`;
    Linking.openURL(waUrl(msg));
    setCart([]); setShowOrderForm(false); setAdresse('');
    setOrderSuccess(true); setTimeout(() => setOrderSuccess(false), 3000);
  };

  const filteredDuJour = menuDuJour.filter(item => {
    const plat = item.historique_plats;
    return (activeCat === 'TOUT' || plat?.categories_plats?.nom === activeCat) &&
      (!search || plat?.nom?.toLowerCase().includes(search.toLowerCase()));
  });

  const allDaysFiltered = JOURS.map(jour => ({
    jour, isToday: jour === todayJour,
    plats: (menuGeneral[jour] || []).filter(item => {
      const plat = item.historique_plats;
      return (activeCat === 'TOUT' || plat?.categories_plats?.nom === activeCat) &&
        (!search || plat?.nom?.toLowerCase().includes(search.toLowerCase()));
    }),
  }));

  const renderPlatCard = (item, isDuJour = false) => {
    const plat = item.historique_plats;
    if (!plat) return null;
    const isHighlight = isDuJour || (platsDuJourIds.includes(item.plat_id) && item.isToday);
    return (
      <TouchableOpacity key={item.id}
        style={{ width: IMG_SIZE, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: isHighlight ? 1.5 : 1, borderColor: isHighlight ? colors.primary : colors.border }}
        onPress={() => setSelectedPlat({ ...plat, isDuJour: isHighlight })} activeOpacity={0.88}>
        <View style={{ position: 'relative', height: IMG_SIZE * 0.75 }}>
          {plat.image_url ? (
            <Image source={{ uri: plat.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="restaurant-outline" size={28} color={colors.muted} />
            </View>
          )}
          {isHighlight && (
            <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>⭐ DU JOUR</Text>
            </View>
          )}
          {plat.categories_plats && (
            <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: plat.categories_plats.couleur + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: plat.categories_plats.couleur + '55' }}>
              <Text style={{ color: plat.categories_plats.couleur, fontSize: 9, fontWeight: '800' }}>{plat.categories_plats.nom}</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 2 }} numberOfLines={2}>{plat.nom}</Text>
          {plat.description ? <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 6 }} numberOfLines={1}>{plat.description}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{plat.prix?.toLocaleString()} CFA</Text>
            <TouchableOpacity style={{ width: 28, height: 28, backgroundColor: colors.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }} onPress={() => addToCart(plat)}>
              <Ionicons name="add" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ModalBase = ({ visible, onClose, children }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 36, height: 3, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
          {children}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* HEADER */}
      <KaletaHeader
        title="CARTE"
        right={
          <>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setHistoriqueVisible(true)}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              onPress={() => setCartVisible(true)}>
              <Ionicons name="bag-outline" size={20} color={colors.text} />
              {cartCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: colors.secondary, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        }
      />

      {/* TOAST */}
      {orderSuccess && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, marginHorizontal: 16, borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <Ionicons name="checkmark-circle" size={18} color="#000" />
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 13, flex: 1 }}>Commande envoyée ! Panier vidé ✅</Text>
        </View>
      )}

      {/* SEARCH */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: colors.border }}>
        <Ionicons name="search-outline" size={16} color={colors.muted} />
        <TextInput style={{ flex: 1, color: colors.text, fontSize: 13 }} placeholder="Rechercher..." placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.muted} /></TouchableOpacity>}
      </View>

      {/* MAIN TABS */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 4, padding: 4, borderWidth: 1, borderColor: colors.border }}>
        {['DU JOUR', 'CARTE'].map(t => (
          <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 3, backgroundColor: activeTab === t ? colors.primary : 'transparent' }} onPress={() => setActiveTab(t)}>
            <Text style={{ color: activeTab === t ? '#000' : colors.muted, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CATEGORY FILTER */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        {['TOUT', ...categories.map(c => c.nom)].map(cat => (
          <TouchableOpacity key={cat}
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: activeCat === cat ? colors.primary : colors.card, borderRadius: 20, borderWidth: 1, borderColor: activeCat === cat ? colors.primary : colors.border }}
            onPress={() => setActiveCat(cat)}>
            <Text style={{ color: activeCat === cat ? '#000' : colors.muted, fontSize: 11, fontWeight: '700' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Chargement du menu...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

          {/* DU JOUR */}
          {activeTab === 'DU JOUR' && (
            menuDuJour.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
                <Ionicons name="restaurant-outline" size={40} color={colors.muted} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Pas de menu du jour</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Consultez notre carte complète</Text>
                <TouchableOpacity style={{ marginTop: 10, borderBottomWidth: 1, borderBottomColor: colors.primary }} onPress={() => setActiveTab('CARTE')}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Voir la carte →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12, letterSpacing: 3 }}>MENU DU JOUR</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {filteredDuJour.map(item => renderPlatCard(item, true))}
                </View>
              </>
            )
          )}

          {/* CARTE */}
          {activeTab === 'CARTE' && allDaysFiltered.map(({ jour, isToday, plats }) => {
            if (plats.length === 0) return null;
            return (
              <View key={jour} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: isToday ? colors.primary + '44' : colors.border }}>
                  <Text style={{ color: isToday ? colors.primary : colors.muted, fontWeight: '800', fontSize: 13, letterSpacing: 2 }}>{jour}</Text>
                  {isToday && (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>AUJOURD'HUI</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {plats.map(item => renderPlatCard({ ...item, isToday }, false))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedPlat} transparent animationType="slide" onRequestClose={() => setSelectedPlat(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
            <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 6 }} onPress={() => setSelectedPlat(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            {selectedPlat && (
              <>
                {selectedPlat.image_url ? (
                  <Image source={{ uri: selectedPlat.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 220, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="restaurant-outline" size={50} color={colors.muted} />
                  </View>
                )}
                {selectedPlat.isDuJour && (
                  <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>⭐ MENU DU JOUR</Text>
                  </View>
                )}
                <View style={{ padding: 20 }}>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8 }}>{selectedPlat.nom}</Text>
                  {selectedPlat.description && <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 12, lineHeight: 20 }}>{selectedPlat.description}</Text>}
                  <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>{selectedPlat.prix?.toLocaleString()} CFA</Text>
                  <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 }}
                    onPress={() => { addToCart(selectedPlat); setSelectedPlat(null); }}>
                    <Ionicons name="add" size={18} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>AJOUTER À LA COMMANDE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CART MODAL */}
      <ModalBase visible={cartVisible} onClose={() => setCartVisible(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 }}>RÉCAPITULATIF</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 }}>VOTRE PANIER</Text>
          </View>
          <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 4, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => setCartVisible(false)}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
        {cart.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Ionicons name="bag-outline" size={40} color={colors.muted} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Panier vide</Text>
          </View>
        ) : (
          <>
            <ScrollView style={{ maxHeight: 280 }}>
              {cart.map((item, i) => (
                <View key={item.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="restaurant-outline" size={16} color={colors.muted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{item.nom}</Text>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 2 }}>{((item.prix || 0) * item.qty).toLocaleString()} CFA</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={{ width: 30, height: 30, backgroundColor: colors.bg, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{item.qty}</Text>
                      <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={{ width: 30, height: 30, backgroundColor: colors.bg, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i < cart.length - 1 && <View style={{ height: 1, backgroundColor: colors.border }} />}
                </View>
              ))}
            </ScrollView>
            <View style={{ backgroundColor: colors.bg, borderRadius: 4, padding: 16, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>TOTAL</Text>
                <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900' }}>{cartTotal.toLocaleString()} CFA</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{cartCount} article{cartCount > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 }} onPress={handleCommanderPress}>
              <Ionicons name="logo-whatsapp" size={18} color="#000" />
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>
                {user ? 'CONFIRMER LA COMMANDE' : '🔐 SE CONNECTER POUR COMMANDER'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ModalBase>

      {/* ORDER FORM */}
      <ModalBase visible={showOrderForm} onClose={() => setShowOrderForm(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 }}>FINALISER</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 }}>MA COMMANDE</Text>
          </View>
          <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 4, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowOrderForm(false)}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: colors.primary + '22', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '44' }}>
          <Ionicons name="person-circle" size={28} color={colors.primary} />
          <View>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{profile?.nom || user?.email}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Client connecté</Text>
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>RÉSUMÉ ({cart.length} article{cart.length > 1 ? 's' : ''})</Text>
        {cart.map(item => (
          <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ color: colors.text, fontSize: 13 }}>{item.nom} × {item.qty}</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{((item.prix || 0) * item.qty).toLocaleString()} CFA</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 16 }}>
          <Text style={{ color: colors.muted, fontWeight: '700' }}>TOTAL</Text>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 18 }}>{cartTotal.toLocaleString()} CFA</Text>
        </View>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>TÉLÉPHONE *</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Ionicons name="call-outline" size={16} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput style={{ flex: 1, color: colors.text, fontSize: 14 }} value={telCommande} onChangeText={setTelCommande} placeholder="91 XX XX XX" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
        </View>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>ADRESSE (optionnel)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
          <Ionicons name="location-outline" size={16} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput style={{ flex: 1, color: colors.text, fontSize: 14 }} value={adresse} onChangeText={setAdresse} placeholder="Votre adresse" placeholderTextColor={colors.muted} />
        </View>
        <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 }} onPress={sendOrder}>
          <Ionicons name="logo-whatsapp" size={18} color="#000" />
          <Text style={{ color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>CONFIRMER VIA WHATSAPP</Text>
        </TouchableOpacity>
      </ModalBase>

      {/* HISTORIQUE */}
      <ModalBase visible={historiqueVisible} onClose={() => setHistoriqueVisible(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 }}>MES COMMANDES</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 }}>HISTORIQUE</Text>
          </View>
          <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 4, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => setHistoriqueVisible(false)}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
        {historiqueCommandes.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Ionicons name="time-outline" size={40} color={colors.muted} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Aucune commande</Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {historiqueCommandes.map((cmd) => (
              <View key={cmd.id} style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>{cmd.date}</Text>
                  <View style={{ backgroundColor: colors.primary + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>{cmd.statut}</Text>
                  </View>
                </View>
                {cmd.items.map((item, j) => (
                  <Text key={j} style={{ color: colors.text, fontSize: 12, marginBottom: 2 }}>• {item.nom} × {item.qty} — {((item.prix || 0) * item.qty).toLocaleString()} CFA</Text>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{cmd.items.length} article{cmd.items.length > 1 ? 's' : ''}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{cmd.total?.toLocaleString()} CFA</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ModalBase>

      {/* AUTH MODAL */}
      <Modal visible={showAuth} animationType="slide" onRequestClose={() => setShowAuth(false)}>
        <AuthScreen onClose={() => setShowAuth(false)} />
      </Modal>
    </View>
  );
}