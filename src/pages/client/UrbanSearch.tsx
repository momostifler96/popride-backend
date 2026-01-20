import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, CreditCard, Bus, CheckCircle, Car, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { formatPrice } from '../../utils/currency';

interface Ligne {
  id: string;
  numero: string;
  nom: string;
  couleur: string;
  prix: number;
  statut: string;
}

interface Arret {
  id: string;
  nom: string;
  ordre: number;
  latitude: number | null;
  longitude: number | null;
}

interface Tarif {
  prix_eco: number;
  prix_confort: number;
  prix_confort_plus: number;
}

interface Category {
  id: string;
  nom: string;
  description: string;
}

export default function UrbanSearch() {
  const { user } = useClientAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [selectedLigne, setSelectedLigne] = useState<Ligne | null>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [arretDepart, setArretDepart] = useState<string>('');
  const [arretArrivee, setArretArrivee] = useState<string>('');
  const [nombrePlaces, setNombrePlaces] = useState<number>(1);
  const [tarif, setTarif] = useState<Tarif | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLignes();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedLigne && step === 2) {
      fetchArrets(selectedLigne.id);
    }
  }, [selectedLigne, step]);

  useEffect(() => {
    if (selectedLigne && arretDepart && arretArrivee && arretDepart !== arretArrivee) {
      fetchTarif(selectedLigne.id, arretDepart, arretArrivee);
    }
  }, [selectedLigne, arretDepart, arretArrivee]);

  const fetchLignes = async () => {
    try {
      const { data, error } = await supabase
        .from('lignes_urbaines')
        .select('id, numero, nom, couleur, prix, statut')
        .eq('statut', 'active')
        .order('numero');

      if (error) throw error;
      setLignes(data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_vehicules')
        .select('id, nom, description')
        .eq('statut', 'active')
        .order('nom');

      if (error) throw error;
      setCategories(data || []);

      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArrets = async (ligneId: string) => {
    try {
      const { data, error } = await supabase
        .from('arrets_urbains')
        .select('id, nom, ordre, latitude, longitude')
        .eq('ligne_id', ligneId)
        .order('ordre');

      if (error) throw error;
      setArrets(data || []);
    } catch (error) {
      console.error('Error fetching stops:', error);
    }
  };

  const fetchTarif = async (ligneId: string, departId: string, arriveeId: string) => {
    try {
      const { data, error } = await supabase
        .from('tarifs_urbains')
        .select('prix_eco, prix_confort, prix_confort_plus')
        .eq('ligne_id', ligneId)
        .eq('arret_depart_id', departId)
        .eq('arret_arrivee_id', arriveeId)
        .maybeSingle();

      if (error) throw error;
      setTarif(data);
    } catch (error) {
      console.error('Error fetching tarif:', error);
    }
  };

  const handleLineSelect = (ligne: Ligne) => {
    setSelectedLigne(ligne);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setArretDepart('');
    setArretArrivee('');
    setSelectedCategory('');
    setNombrePlaces(1);
    setTarif(null);
  };

  const getEstimatedTime = (): string => {
    if (!arretDepart || !arretArrivee || arrets.length === 0) {
      return '5-10 min';
    }

    const departArret = arrets.find(a => a.id === arretDepart);
    const arriveeArret = arrets.find(a => a.id === arretArrivee);

    if (!departArret || !arriveeArret) {
      return '5-10 min';
    }

    const stopsCount = Math.abs(arriveeArret.ordre - departArret.ordre);
    const baseTime = 5;
    const timePerStop = 2;
    const totalTime = baseTime + (stopsCount * timePerStop);

    return `${totalTime}-${totalTime + 5} min`;
  };

  const getPrice = (): number => {
    if (!tarif || !selectedCategory) {
      return selectedLigne?.prix || 0;
    }

    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return selectedLigne?.prix || 0;

    const categoryName = category.nom.toLowerCase();
    if (categoryName.includes('eco')) {
      return tarif.prix_eco;
    } else if (categoryName.includes('confort+') || categoryName.includes('confort plus')) {
      return tarif.prix_confort_plus;
    } else if (categoryName.includes('confort')) {
      return tarif.prix_confort;
    }

    return selectedLigne?.prix || 0;
  };

  const handleContinue = () => {
    if (!selectedLigne || !arretDepart || !arretArrivee || !selectedCategory || nombrePlaces < 1) {
      return;
    }

    const params = new URLSearchParams({
      ligne_id: selectedLigne.id,
      depart_id: arretDepart,
      arrival_id: arretArrivee,
      category_id: selectedCategory,
      nombre_places: nombrePlaces.toString(),
    });

    window.history.pushState({}, '', `/client/urban/confirm?${params.toString()}`);
    window.location.href = `/client/urban/confirm?${params.toString()}`;
  };

  const handleBack = () => {
    if (step === 2) {
      handleBackToStep1();
    } else {
      window.location.href = '/client/home';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (lignes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500 to-cyan-600">
        <header className="bg-white shadow-sm px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center space-x-2">
              <Bus className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">POP RIDE</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center">
            <Bus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aucune ligne disponible</h2>
            <p className="text-slate-600">Les lignes urbaines ne sont pas encore configurées.</p>
          </div>
        </main>
      </div>
    );
  }

  const canContinue = step === 2 && selectedLigne && arretDepart && arretArrivee && arretDepart !== arretArrivee && selectedCategory && nombrePlaces >= 1;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500 to-cyan-600">
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center space-x-2">
            <Bus className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">POP RIDE</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-4 pb-32">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Choisissez votre ligne
              </h2>
              <div className="space-y-3">
                {lignes.map((ligne) => (
                  <button
                    key={ligne.id}
                    onClick={() => handleLineSelect(ligne)}
                    className="w-full bg-white rounded-2xl p-5 shadow-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: ligne.couleur }}
                      >
                        {ligne.numero}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900 text-lg">{ligne.nom}</p>
                        <p className="text-blue-600 font-semibold">{formatPrice(ligne.prix)}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {selectedLigne && (
                <div className="bg-white/90 rounded-xl p-4 flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedLigne.couleur }}
                  >
                    {selectedLigne.numero}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{selectedLigne.nom}</p>
                    <p className="text-sm text-slate-600">Configurez votre trajet</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-900 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>Arrêt de départ</span>
                  </label>
                  <select
                    value={arretDepart}
                    onChange={(e) => setArretDepart(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="">Sélectionnez un arrêt</option>
                    {arrets
                      .filter((a) => a.id !== arretArrivee)
                      .map((arret) => (
                        <option key={arret.id} value={arret.id}>
                          {arret.ordre}. {arret.nom}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-900 mb-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>Arrêt d'arrivée</span>
                  </label>
                  <select
                    value={arretArrivee}
                    onChange={(e) => setArretArrivee(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-slate-900"
                    disabled={!arretDepart}
                  >
                    <option value="">Sélectionnez un arrêt</option>
                    {arrets
                      .filter((a) => a.id !== arretDepart)
                      .map((arret) => (
                        <option key={arret.id} value={arret.id}>
                          {arret.ordre}. {arret.nom}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <label className="text-sm font-semibold text-slate-900 mb-3 block">
                  Nombre de places
                </label>
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => setNombrePlaces(Math.max(1, nombrePlaces - 1))}
                    className="w-12 h-12 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-4xl font-bold text-slate-900 w-16 text-center">
                    {nombrePlaces}
                  </span>
                  <button
                    onClick={() => setNombrePlaces(Math.min(4, nombrePlaces + 1))}
                    className="w-12 h-12 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {categories.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-2 mb-4">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Catégorie de véhicule</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-3 rounded-xl border-2 text-center ${
                          selectedCategory === category.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-bold text-slate-900 text-sm">{category.nom}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canContinue && (
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-slate-900 mb-4">Récapitulatif</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm">Temps estimé</span>
                      </div>
                      <span className="font-semibold text-slate-900">{getEstimatedTime()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm">Prix total</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(getPrice() * nombrePlaces)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          {step === 2 && (
            <button
              onClick={handleBackToStep1}
              className="w-full py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 mb-2"
            >
              Retour
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-4 rounded-xl font-bold text-lg ${
              canContinue
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
