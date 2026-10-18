import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ParamsContext = createContext({});
export const useParams = () => useContext(ParamsContext);

const DEFAULTS = {
  telephone: '91 00 84 84',
  whatsapp_numero: '22891008484',
  localisation: "Deux Lions, en face du Lycée d'Agbé",
  adresse_complete: "Deux Lions, en face du Lycée d'Agbé, à côté de l'OTR, Lomé, Togo",
  horaire_ouverture: '16:00',
  horaire_fermeture: '00:00',
  texte_bienvenue: "Niché au cœur d'Agoè Deux Lions, Kaleta transcende l'ordinaire. Un espace où l'art culinaire africain rencontre l'élégance d'un lounge contemporain.",
  slogan_actif: 'Ici chaque plat est une histoire,|Chaque saveur est un voyage.',
  tagline: "PLUS QU'UN RESTAURANT, UNE EXPÉRIENCE À VIVRE.",
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  google_maps_url: 'https://maps.google.com/?q=Deux+Lions+Lycee+Agbe+Lome+Togo',
  couleur_principale: '#39FF5A',
  couleur_secondaire: '#FF9F1C',
};

export function ParamsProvider({ children, onColorsLoaded }) {
  const [params, setParams] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchParams(); }, []);

  const fetchParams = async () => {
    try {
      const { data, error } = await supabase.from('parametres').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const p = { ...DEFAULTS };
        data.forEach(item => { if (item.valeur) p[item.cle] = item.valeur; });
        setParams(p);
        // Notifier le ThemeContext des couleurs — avec délai pour s'assurer que le context est prêt
        setTimeout(() => {
          if (typeof onColorsLoaded === 'function') {
            onColorsLoaded(p.couleur_principale, p.couleur_secondaire);
          }
        }, 100);
      }
    } catch (e) {
      console.log('Params: utilisation des valeurs par défaut');
    }
    setLoading(false);
  };

  const waUrl  = (msg = '') => `https://wa.me/${params.whatsapp_numero || '22891008484'}?text=${encodeURIComponent(msg)}`;
  const callUrl = ()         => `tel:+${params.whatsapp_numero || '22891008484'}`;

  return (
    <ParamsContext.Provider value={{ params, loading, fetchParams, waUrl, callUrl }}>
      {children}
    </ParamsContext.Provider>
  );
}
