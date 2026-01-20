import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, X, MapPin, Loader } from 'lucide-react';

interface Arret {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  ordre: number;
}

interface Ligne {
  id: string;
  nom: string;
  numero: string;
  couleur: string;
  statut: string;
}

interface GererArretsLigneProps {
  ligneId: string;
  onBack: () => void;
}

export default function GererArretsLigne({ ligneId, onBack }: GererArretsLigneProps) {
  const [ligne, setLigne] = useState<Ligne | null>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', latitude: '', longitude: '' });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [ligneId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: ligneData, error: ligneError } = await supabase
        .from('lignes_urbaines')
        .select('*')
        .eq('id', ligneId)
        .single();

      if (ligneError) throw ligneError;
      setLigne(ligneData);

      const { data: arretsData, error: arretsError } = await supabase
        .from('arrets_urbains')
        .select('*')
        .eq('ligne_id', ligneId)
        .order('ordre', { ascending: true });

      if (arretsError) throw arretsError;
      setArrets(arretsData || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (arret: Arret) => {
    setEditingId(arret.id);
    setEditForm({
      nom: arret.nom,
      latitude: arret.latitude.toString(),
      longitude: arret.longitude.toString(),
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ nom: '', latitude: '', longitude: '' });
  };

  const handleEditSave = async (arretId: string) => {
    if (!editForm.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    const lat = parseFloat(editForm.latitude);
    const lng = parseFloat(editForm.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordonnées invalides');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('arrets_urbains')
        .update({
          nom: editForm.nom,
          latitude: lat,
          longitude: lng,
        })
        .eq('id', arretId);

      if (updateError) throw updateError;

      setSuccess('Arrêt modifié avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (arretId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet arrêt ?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('arrets_urbains')
        .delete()
        .eq('id', arretId);

      if (deleteError) throw deleteError;

      const remainingArrets = arrets.filter((a) => a.id !== arretId);
      for (let i = 0; i < remainingArrets.length; i++) {
        await supabase
          .from('arrets_urbains')
          .update({ ordre: i + 1 })
          .eq('id', remainingArrets[i].id);
      }

      setSuccess('Arrêt supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newArrets = [...arrets];
    const draggedItem = newArrets[draggedIndex];
    newArrets.splice(draggedIndex, 1);
    newArrets.splice(index, 0, draggedItem);

    setArrets(newArrets);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      setSaving(true);
      setError('');

      for (let i = 0; i < arrets.length; i++) {
        await supabase
          .from('arrets_urbains')
          .update({ ordre: i + 1 })
          .eq('id', arrets[i].id);
      }

      setSuccess('Ordre mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setDraggedIndex(null);
      fetchData();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      setSaving(false);
    }
  };

  const handleAddArret = async () => {
    const newOrdre = arrets.length + 1;

    try {
      setSaving(true);
      setError('');

      const { data, error: insertError } = await supabase
        .from('arrets_urbains')
        .insert([
          {
            ligne_id: ligneId,
            nom: 'Nouvel arrêt',
            latitude: 0,
            longitude: 0,
            ordre: newOrdre,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess('Arrêt ajouté avec succès');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
      setEditingId(data.id);
      setEditForm({ nom: 'Nouvel arrêt', latitude: '0', longitude: '0' });
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Gestion des arrêts" description="Chargement..." />
        <main className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!ligne) {
    return (
      <div>
        <Header title="Gestion des arrêts" description="Ligne introuvable" />
        <main className="p-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header title="Gestion des arrêts" description={`${ligne.numero} - ${ligne.nom}`} />

      <main className="p-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour à la ligne</span>
        </button>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ligne.couleur }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Ligne {ligne.numero}
                    </h3>
                    <p className="text-sm text-slate-600">{ligne.nom}</p>
                  </div>
                </div>
                <button
                  onClick={handleAddArret}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Ajouter un arrêt</span>
                </button>
              </div>

              <div className="space-y-2">
                {arrets.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">Aucun arrêt pour cette ligne</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Commencez par ajouter un arrêt
                    </p>
                  </div>
                ) : (
                  arrets.map((arret, index) => (
                    <div
                      key={arret.id}
                      draggable={editingId !== arret.id}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`border border-slate-200 rounded-lg p-4 bg-slate-50 transition-all ${
                        draggedIndex === index ? 'opacity-50' : ''
                      } ${editingId !== arret.id ? 'cursor-move' : ''}`}
                    >
                      {editingId === arret.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Nom de l'arrêt
                            </label>
                            <input
                              type="text"
                              value={editForm.nom}
                              onChange={(e) =>
                                setEditForm({ ...editForm, nom: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Latitude
                              </label>
                              <input
                                type="text"
                                value={editForm.latitude}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, latitude: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Longitude
                              </label>
                              <input
                                type="text"
                                value={editForm.longitude}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, longitude: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={handleEditCancel}
                              className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-sm">Annuler</span>
                            </button>
                            <button
                              onClick={() => handleEditSave(arret.id)}
                              disabled={saving}
                              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              <span className="text-sm">Enregistrer</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-5 h-5 text-slate-400" />
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {arret.nom}
                              </p>
                              <p className="text-xs text-slate-500">
                                {arret.latitude.toFixed(6)}, {arret.longitude.toFixed(6)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditStart(arret)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(arret.id)}
                              disabled={saving}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Carte des arrêts
              </h3>
              <div className="bg-slate-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
                {arrets.length === 0 ? (
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Aucun arrêt à afficher</p>
                  </div>
                ) : (
                  <div className="w-full h-full p-4">
                    <svg className="w-full h-full" viewBox="0 0 400 400">
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="10"
                          refX="8"
                          refY="3"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3, 0 6"
                            fill={ligne.couleur}
                          />
                        </marker>
                      </defs>

                      {arrets.map((arret, index) => {
                        if (index < arrets.length - 1) {
                          const nextArret = arrets[index + 1];
                          const x1 = 50 + (index * 300) / (arrets.length - 1);
                          const y1 = 200 - arret.latitude * 10;
                          const x2 = 50 + ((index + 1) * 300) / (arrets.length - 1);
                          const y2 = 200 - nextArret.latitude * 10;

                          return (
                            <line
                              key={`line-${index}`}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={ligne.couleur}
                              strokeWidth="3"
                              markerEnd="url(#arrowhead)"
                            />
                          );
                        }
                        return null;
                      })}

                      {arrets.map((arret, index) => {
                        const x = 50 + (index * 300) / (arrets.length - 1);
                        const y = 200 - arret.latitude * 10;

                        return (
                          <g key={arret.id}>
                            <circle
                              cx={x}
                              cy={y}
                              r="8"
                              fill="white"
                              stroke={ligne.couleur}
                              strokeWidth="3"
                            />
                            <text
                              x={x}
                              y={y + 25}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#475569"
                              fontWeight="600"
                            >
                              {index + 1}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Itinéraire
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {arrets.map((arret, index) => (
                    <div key={arret.id} className="flex items-start space-x-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">
                          {arret.nom}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
