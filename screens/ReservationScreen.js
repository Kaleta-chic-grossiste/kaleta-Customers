import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabase';
import { useParams } from '../context/ParamsContext';
import { useTheme } from '../context/ThemeContext';
import KaletaHeader from '../components/KaletaHeader';

const HEURES = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const PERSONNES = ['1', '2', '3', '4', '5', '6', '7', '8+'];
const TABLE_TYPES = ['TERRASSE', 'SALON', 'BAR'];

export default function ReservationScreen() {
  const insets = useSafeAreaInsets();
  const { waUrl } = useParams();
  const { colors } = useTheme();

  const [date, setDate] = useState(new Date());
  const [dateAffichee, setDateAffichee] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heure, setHeure] = useState('19:00');
  const [personnes, setPersonnes] = useState('2');
  const [tableType, setTableType] = useState('TERRASSE');
  const [demande, setDemande] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showHeurePicker, setShowHeurePicker] = useState(false);
  const [showPersonnesPicker, setShowPersonnesPicker] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!nom.trim() || !telephone.trim() || !dateAffichee) {
      Alert.alert('Champs manquants', 'Veuillez remplir votre nom, téléphone et la date souhaitée.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('reservations').insert({
        nom: nom.trim(), telephone: telephone.trim(),
        date: dateAffichee, heure, personnes,
        table_type: tableType, demande: demande.trim(),
        statut: 'en attente',
      });
      if (error) console.log('Erreur:', error.message);
    } catch (e) { console.log('Erreur réseau:', e.message); }
    const msg = `Bonjour KALETA ! 🌟\n\nRéservation :\n📅 ${dateAffichee}\n⏰ ${heure}\n👥 ${personnes} pers.\n🪑 ${tableType}${demande ? `\n✏️ ${demande}` : ''}\n\n👤 ${nom}\n📞 ${telephone}`;
    Linking.openURL(waUrl(msg));
    setLoading(false);
    setConfirmed(true);
  };

  const inputStyle = [styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }];
  const selectorStyle = [styles.selector, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <KaletaHeader title="RÉSERVER" />

        {confirmed ? (
          <View style={[styles.successBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.successTitle, { color: colors.primary }]}>Réservation envoyée !</Text>
            <Text style={[styles.successText, { color: colors.muted }]}>Votre réservation a été enregistrée. L'équipe Kaleta vous confirmera sous peu via WhatsApp.</Text>
            <TouchableOpacity style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setConfirmed(false); setNom(''); setTelephone(''); setDateAffichee(''); setDemande(''); }}>
              <Text style={styles.successBtnText}>Nouvelle réservation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>

            {/* DATE */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>DATE</Text>
              </View>
              <TouchableOpacity style={selectorStyle} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.selectorValue, { color: dateAffichee ? colors.text : colors.muted }]}>
                  {dateAffichee || 'Choisir une date...'}
                </Text>
                <Ionicons name="calendar" size={18} color={colors.primary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker value={date} mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (event.type !== 'dismissed' && selectedDate) {
                      setDate(selectedDate);
                      setDateAffichee(selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
                    } else { setShowDatePicker(false); }
                  }}
                />
              )}
            </View>

            {/* HEURE */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>HEURE</Text>
              </View>
              <TouchableOpacity style={selectorStyle} onPress={() => setShowHeurePicker(!showHeurePicker)}>
                <Text style={[styles.selectorValue, { color: colors.text }]}>{heure}</Text>
                <Ionicons name={showHeurePicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </TouchableOpacity>
              {showHeurePicker && (
                <View style={styles.pickerGrid}>
                  {HEURES.map(h => (
                    <TouchableOpacity key={h}
                      style={[styles.pickerItem, { backgroundColor: colors.card, borderColor: colors.border },
                        heure === h && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => { setHeure(h); setShowHeurePicker(false); }}>
                      <Text style={[styles.pickerItemText, { color: heure === h ? '#000' : colors.muted }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* PERSONNES */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>NOMBRE DE PERSONNES</Text>
              </View>
              <TouchableOpacity style={selectorStyle} onPress={() => setShowPersonnesPicker(!showPersonnesPicker)}>
                <Text style={[styles.selectorValue, { color: colors.text }]}>{personnes} personne{personnes !== '1' ? 's' : ''}</Text>
                <Ionicons name={showPersonnesPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </TouchableOpacity>
              {showPersonnesPicker && (
                <View style={styles.pickerGrid}>
                  {PERSONNES.map(p => (
                    <TouchableOpacity key={p}
                      style={[styles.pickerItem, { backgroundColor: colors.card, borderColor: colors.border },
                        personnes === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => { setPersonnes(p); setShowPersonnesPicker(false); }}>
                      <Text style={[styles.pickerItemText, { color: personnes === p ? '#000' : colors.muted }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* TYPE DE TABLE */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>TYPE DE TABLE</Text>
              </View>
              <View style={styles.tableTypes}>
                {TABLE_TYPES.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.tableTypeBtn, { backgroundColor: colors.card, borderColor: tableType === t ? colors.primary : colors.border }]}
                    onPress={() => setTableType(t)}>
                    <View style={[styles.tableTypeRadio, { borderColor: tableType === t ? colors.primary : '#555' },
                      tableType === t && { backgroundColor: colors.primary }]} />
                    <Text style={[styles.tableTypeText, { color: tableType === t ? colors.primary : colors.muted }]}>{t}</Text>
                    {t === 'TERRASSE' && <Text>⭐</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* DEMANDE */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>DEMANDE SPÉCIALE <Text style={{ color: colors.muted, fontWeight: '400' }}>(optionnel)</Text></Text>
              </View>
              <TextInput style={[...inputStyle, styles.textArea]} placeholder="Anniversaire, végétarien..."
                placeholderTextColor={colors.muted} value={demande} onChangeText={setDemande}
                multiline numberOfLines={3} textAlignVertical="top" />
            </View>

            {/* COORDONNÉES */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabelText, { color: colors.primary }]}>VOS COORDONNÉES</Text>
              </View>
              <TextInput style={[...inputStyle, { marginBottom: 10 }]} placeholder="NOM COMPLET"
                placeholderTextColor={colors.muted} value={nom} onChangeText={setNom} />
              <TextInput style={inputStyle} placeholder="TÉLÉPHONE  91 XX XX XX"
                placeholderTextColor={colors.muted} value={telephone} onChangeText={setTelephone}
                keyboardType="phone-pad" />
            </View>

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleConfirm} disabled={loading}>
              <Ionicons name="logo-whatsapp" size={20} color="#000" />
              <Text style={styles.confirmBtnText}>{loading ? 'ENVOI...' : 'CONFIRMER LA RÉSERVATION'}</Text>
            </TouchableOpacity>
            <Text style={[styles.confirmNote, { color: colors.muted }]}>✅ Enregistrement automatique + confirmation WhatsApp</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerKicker: { fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 3 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  headerRule: { height: 1, marginHorizontal: 20, marginBottom: 20 },
  form: { paddingHorizontal: 20 },
  field: { marginBottom: 20 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabelText: { fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1 },
  textArea: { minHeight: 90, paddingTop: 14 },
  selector: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  selectorValue: { fontSize: 15, fontWeight: '600' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  pickerItemText: { fontWeight: '600', fontSize: 14 },
  tableTypes: { flexDirection: 'row', gap: 10 },
  tableTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  tableTypeRadio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  tableTypeText: { fontWeight: '700', fontSize: 12 },
  confirmBtn: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10, marginBottom: 14 },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  confirmNote: { fontSize: 12, textAlign: 'center' },
  successBox: { margin: 20, borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1 },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  successText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  successBtn: { marginTop: 20, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  successBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
});
