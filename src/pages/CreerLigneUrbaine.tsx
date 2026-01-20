import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Plus, Trash2, Loader, CheckCircle, ArrowLeft, MapPin } from 'lucide-react';

interface Arret {
  id: string;
  nom: string;
  latitude: string;
  longitude: string;
  ordre: string;
}

interface CreerLigneUrbaineProps {
  onBack: () => void;
  ligneId?: string;
  onGererArrets?: (ligneId: string) => void;
}

export default function CreerLigneUrbaine({ onBack, ligneId, onGererArrets }: CreerLigneUrbaineProps) {
  const [nomLigne, setNomLigne] = useState('');
  const [numero, setNumero] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState<'brouillon' | 'active' | 'inactive'>('brouillon');
  const [couleur, setCouleur] = useState('#3B82F6');
  const [prix, setPrix] = useState('');
  const [arrets, setArrets] = useState<Arret[]>([
    { id: '1', nom: '', latitude: '', longitude: '', ordre: '1' }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (ligneId) {
      fetchLigneData();
    }
  }, [ligneId]);

  const fetchLigneData = async () => {
    try {
      setLoadingData(true);
      const { data: ligneData, error: ligneError } = await supabase
        .from('lignes_urbaines')
        .select('*')
        .eq('id', ligneId)
        .single();

      if (ligneError) throw ligneError;

      setNomLigne(ligneData.nom || '');
      setNumero(ligneData.numero || '');
      setDescription(ligneData.description || '');
      setStatut(ligneData.statut || 'brouillon');
      setCouleur(ligneData.couleur || '#3B82F6');
      setPrix(ligneData.prix ? ligneData.prix.toString() : '');

      const { data: arretsData, error: arretsError } = await supabase
        .from('arrets_urbains')
        .select('*')
        .eq('ligne_id', ligneId)
        .order('ordre', { ascending: true });

      if (arretsError) throw arretsError;

      if (arretsData && arretsData.length > 0) {
        setArrets(
          arretsData.map((arret) => ({
            id: arret.id,
            nom: arret.nom,
            latitude: arret.latitude?.toString() || '',
            longitude: arret.longitude?.toString() || '',
            ordre: arret.ordre?.toString() || '',
          }))
        );
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement de la ligne');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddArret = () => {
    const newId = (Math.max(...arrets.map(a => parseInt(a.id))) + 1).toString();
    const newOrdre = (arrets.length + 1).toString();
    setArrets([...arrets, { id: newId, nom: '', latitude: '', longitude: '', ordre: newOrdre }]);
  };

  const handleRemoveArret = (id: string) => {
    if (arrets.length > 1) {
      setArrets(arrets.filter(a => a.id !== id));
    }
  };

  const handleArretChange = (id: string, field: keyof Arret, value: string) => {
    setArrets(arrets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const validateForm = (): boolean => {
    if (!nomLigne.trim()) {
      setError('Le nom de la ligne est obligatoire');
      return false;
    }

    if (!numero.trim()) {
      setError('Le numéro de la ligne est obligatoire');
      return false;
    }

    if (prix && isNaN(parseFloat(prix))) {
      setError('Le prix doit être un nombre valide');
      return false;
    }

    for (const arret of arrets) {
      if (!arret.nom.trim()) {
        setError('Tous les arrêts doivent avoir un nom');
        return false;
      }
      if (!arret.latitude.trim() || isNaN(parseFloat(arret.latitude))) {
        setError('Tous les arrêts doivent avoir une latitude valide');
        return false;
      }
      if (!arret.longitude.trim() || isNaN(parseFloat(arret.longitude))) {
        setError('Tous les arrêts doivent avoir une longitude valide');
        return false;
      }
      if (!arret.ordre.trim() || isNaN(parseInt(arret.ordre))) {
        setError('Tous les arrêts doivent avoir un ordre valide');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const lignePayload = {
        nom: nomLigne,
        numero: numero,
        description: description,
        statut: statut,
        couleur: couleur,
        prix: prix ? parseFloat(prix) : null,
        updated_at: new Date().toISOString(),
      };

      let currentLigneId = ligneId;

      if (ligneId) {
        const { error: updateError } = await supabase
          .from('lignes_urbaines')
          .update(lignePayload)
          .eq('id', ligneId);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('arrets_urbains')
          .delete()
          .eq('ligne_id', ligneId);

        if (deleteError) throw deleteError;
      } else {
        const { data: ligneData, error: ligneError } = await supabase
          .from('lignes_urbaines')
          .insert([lignePayload])
          .select()
          .single();

        if (ligneError) throw ligneError;
        currentLigneId = ligneData.id;
      }

      const arretsToInsert = arrets.map((arret) => ({
        ligne_id: currentLigneId,
        nom: arret.nom,
        latitude: parseFloat(arret.latitude),
        longitude: parseFloat(arret.longitude),
        ordre: parseInt(arret.ordre),
      }));

      const { error: arretsError } = await supabase
        .from('arrets_urbains')
        .insert(arretsToInsert);

      if (arretsError) throw arretsError;

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors de ${ligneId ? "la modification" : "la création"} de la ligne`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <Header
          title={ligneId ? 'Modifier la ligne' : 'Créer une ligne urbaine'}
          description={ligneId ? 'Modifier une ligne existante' : 'Ajouter une nouvelle ligne avec ses arrêts'}
        />
        <main className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={ligneId ? 'Modifier la ligne' : 'Créer une ligne urbaine'}
        description={ligneId ? 'Modifier une ligne existante' : 'Ajouter une nouvelle ligne avec ses arrêts'}
      />

      <main className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour à la liste</span>
          </button>

          {ligneId && onGererArrets && (
            <button
              onClick={() => onGererArrets(ligneId)}
              className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Gérer les arrêts</span>
            </button>
          )}
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Ligne {ligneId ? 'modifiée' : 'créée'} avec succès!
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Informations de la ligne
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numéro de ligne *
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ex: L1, 23, A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de la ligne *
                </label>
                <input
                  type="text"
                  value={nomLigne}
                  onChange={(e) => setNomLigne(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ex: Centre-ville - Abobo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Description de la ligne..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut *
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as 'brouillon' | 'active' | 'inactive')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prix (€)
                </label>
                <input
                  type="text"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ex: 1.50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Couleur de la ligne
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={couleur}
                    onChange={(e) => setCouleur(e.target.value)}
                    className="h-10 w-20 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">{couleur}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Arrêts de la ligne
              </h3>
              <button
                type="button"
                onClick={handleAddArret}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Ajouter un arrêt</span>
              </button>
            </div>

            <div className="space-y-4">
              {arrets.map((arret, index) => (
                <div key={arret.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Arrêt #{index + 1}
                    </span>
                    {arrets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveArret(arret.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nom de l'arrêt *
                      </label>
                      <input
                        type="text"
                        value={arret.nom}
                        onChange={(e) => handleArretChange(arret.id, 'nom', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ex: Gare d'Adjamé"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Latitude *
                      </label>
                      <input
                        type="text"
                        value={arret.latitude}
                        onChange={(e) => handleArretChange(arret.id, 'latitude', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ex: 5.3600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Longitude *
                      </label>
                      <input
                        type="text"
                        value={arret.longitude}
                        onChange={(e) => handleArretChange(arret.id, 'longitude', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ex: -4.0083"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ordre *
                      </label>
                      <input
                        type="number"
                        value={arret.ordre}
                        onChange={(e) => handleArretChange(arret.id, 'ordre', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{ligneId ? 'Modification' : 'Création'} en cours...</span>
                </>
              ) : (
                <span>{ligneId ? 'Modifier la ligne' : 'Créer la ligne'}</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
