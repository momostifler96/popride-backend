import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import {
  Loader,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Mail,
  Shield,
  ShieldOff,
  Clock,
  FileText,
  AlertTriangle,
  X,
  Plus,
  Calendar,
  MapPin,
  Car,
  Euro,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface Client {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  contenu: string;
  created_at: string;
  admin_users?: {
    email: string;
  };
}

interface CourseUrbaine {
  id: string;
  date_course: string;
  prix: number;
  statut: string;
  lignes_urbaines?: { nom: string; numero: string };
  arrets_urbains_arrets_urbains_arret_depart_idTocourses_urbaines?: { nom: string };
  arrets_urbains_arrets_urbains_arret_arrivee_idTocourses_urbaines?: { nom: string };
}

interface Signalement {
  id: string;
  motif: string;
  description: string;
  statut: string;
  created_at: string;
  auteur_nom: string;
}

interface ClientDetails {
  client: Client;
  notes: Note[];
  courses: CourseUrbaine[];
  signalements: Signalement[];
  stats: {
    total_courses: number;
    montant_depense: number;
    signalements_count: number;
  };
}

const STATUTS = [
  { value: 'all', label: 'Tous', color: '', icon: null },
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'bloque', label: 'Bloqué', color: 'bg-red-100 text-red-800', icon: ShieldOff },
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 10000);
    return () => clearInterval(interval);
  }, [filterStatut]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (client: Client) => {
    try {
      setLoadingDetails(true);
      setSelectedClient(client);
      setShowDetails(true);

      const [notesResult, coursesResult, signalementsResult] = await Promise.all([
        supabase
          .from('notes_clients')
          .select(`
            id,
            contenu,
            created_at,
            admin_users(email)
          `)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('courses_urbaines')
          .select(`
            id,
            date_course,
            prix,
            statut,
            lignes_urbaines(nom, numero),
            arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
            arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom)
          `)
          .eq('client_id', client.id)
          .order('date_course', { ascending: false })
          .limit(50),
        supabase
          .from('signalements')
          .select('id, motif, description, statut, created_at, auteur_nom')
          .eq('type_entite', 'client')
          .eq('entite_id', client.id)
          .order('created_at', { ascending: false }),
      ]);

      const notes = notesResult.data || [];
      const courses = coursesResult.data || [];
      const signalements = signalementsResult.data || [];

      const montant_depense = courses
        .filter((c) => c.statut === 'terminee')
        .reduce((sum, c) => sum + (c.prix || 0), 0);

      setClientDetails({
        client,
        notes,
        courses,
        signalements,
        stats: {
          total_courses: courses.length,
          montant_depense,
          signalements_count: signalements.length,
        },
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des détails du client');
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleStatut = async (clientId: string, currentStatut: string) => {
    const newStatut = currentStatut === 'bloque' ? 'actif' : 'bloque';
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ statut: newStatut, updated_at: new Date().toISOString() })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setSuccess(
        newStatut === 'bloque'
          ? 'Client bloqué avec succès'
          : 'Client débloqué avec succès'
      );
      setTimeout(() => setSuccess(''), 3000);
      fetchClients();
      if (showDetails && selectedClient?.id === clientId) {
        const updatedClient = { ...selectedClient, statut: newStatut };
        setSelectedClient(updatedClient);
        if (clientDetails) {
          setClientDetails({ ...clientDetails, client: updatedClient });
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const addNote = async () => {
    if (!selectedClient || !newNote.trim()) return;

    try {
      setAddingNote(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('notes_clients')
        .insert({
          client_id: selectedClient.id,
          admin_id: user?.id,
          contenu: newNote.trim(),
        });

      if (insertError) throw insertError;

      setSuccess('Note ajoutée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setNewNote('');
      setShowAddNote(false);
      fetchClientDetails(selectedClient);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors de l'ajout de la note");
    } finally {
      setAddingNote(false);
    }
  };

  const getStatutInfo = (statut: string) => {
    return STATUTS.find((s) => s.value === statut) || STATUTS[0];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div>
        <Header title="Clients" description="Gestion des clients de la plateforme" />
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
      <Header title="Clients" description="Gestion des clients de la plateforme" />

      <main className="p-8">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="mb-6 flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <p className="text-slate-600">
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-700 flex items-center mr-2">
              Statut:
            </span>
            {STATUTS.map((statut) => (
              <button
                key={statut.value}
                onClick={() => setFilterStatut(statut.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatut === statut.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {statut.label}
              </button>
            ))}
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucun client trouvé</p>
            <p className="text-slate-500 text-sm">Les clients enregistrés apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => {
              const statutInfo = getStatutInfo(client.statut);
              const StatutIcon = statutInfo.icon;

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-900">{client.nom}</h3>
                        {StatutIcon && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statutInfo.color}`}
                          >
                            <div className="flex items-center space-x-1">
                              <StatutIcon className="w-3 h-3" />
                              <span>{statutInfo.label}</span>
                            </div>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{client.telephone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs">Inscrit le {formatDate(client.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => fetchClientDetails(client)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Voir détails</span>
                      </button>

                      <button
                        onClick={() => toggleStatut(client.id, client.statut)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${
                          client.statut === 'bloque'
                            ? 'bg-green-50 hover:bg-green-100 text-green-600'
                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                        }`}
                      >
                        {client.statut === 'bloque' ? (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Débloquer</span>
                          </>
                        ) : (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            <span>Bloquer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showDetails && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Détails - {selectedClient.nom}</span>
                  {clientDetails && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getStatutInfo(clientDetails.client.statut).color
                      }`}
                    >
                      {getStatutInfo(clientDetails.client.statut).label}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedClient(null);
                    setClientDetails(null);
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : clientDetails ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">Courses effectuées</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {clientDetails.stats.total_courses}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-900">Montant dépensé</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {clientDetails.stats.montant_depense.toFixed(2)} €
                        </p>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <p className="text-sm font-medium text-orange-900">Signalements</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">
                          {clientDetails.stats.signalements_count}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span>Notes administratives ({clientDetails.notes.length})</span>
                        </h4>
                        <button
                          onClick={() => setShowAddNote(!showAddNote)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Ajouter une note</span>
                        </button>
                      </div>

                      {showAddNote && (
                        <div className="mb-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Écrivez votre note ici..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setShowAddNote(false);
                                setNewNote('');
                              }}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm transition-colors"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={addNote}
                              disabled={addingNote || !newNote.trim()}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {addingNote && <Loader className="w-3 h-3 animate-spin" />}
                              <span>Enregistrer</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {clientDetails.notes.length > 0 ? (
                        <div className="space-y-2">
                          {clientDetails.notes.map((note) => (
                            <div
                              key={note.id}
                              className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                            >
                              <p className="text-sm text-slate-900 mb-2">{note.contenu}</p>
                              <div className="flex items-center space-x-2 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatDateTime(note.created_at)}</span>
                                {note.admin_users && (
                                  <>
                                    <span>•</span>
                                    <span>Par {note.admin_users.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Aucune note pour ce client</p>
                      )}
                    </div>

                    {clientDetails.signalements.length > 0 && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span>Signalements ({clientDetails.signalements.length})</span>
                        </h4>
                        <div className="space-y-2">
                          {clientDetails.signalements.map((signalement) => (
                            <div
                              key={signalement.id}
                              className="bg-orange-50 rounded-lg p-3 border border-orange-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-orange-900">
                                  {signalement.motif}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    signalement.statut === 'traite'
                                      ? 'bg-green-100 text-green-800'
                                      : signalement.statut === 'rejete'
                                      ? 'bg-slate-100 text-slate-800'
                                      : signalement.statut === 'en_cours'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {signalement.statut}
                                </span>
                              </div>
                              {signalement.description && (
                                <p className="text-sm text-orange-800 mb-2">
                                  {signalement.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-orange-700">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(signalement.created_at)}</span>
                                <span>•</span>
                                <span>Par {signalement.auteur_nom}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {clientDetails.courses.length > 0 && (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Historique des courses ({clientDetails.courses.length})</span>
                        </h4>
                        <div className="space-y-2">
                          {clientDetails.courses.slice(0, 20).map((course) => (
                            <div
                              key={course.id}
                              className="bg-slate-50 rounded-lg p-3 flex justify-between items-center"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-slate-900">
                                    {formatDate(course.date_course)}
                                  </span>
                                  {course.lignes_urbaines && (
                                    <>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-sm text-slate-700">
                                        Ligne {course.lignes_urbaines.numero} -{' '}
                                        {course.lignes_urbaines.nom}
                                      </span>
                                    </>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      course.statut === 'terminee'
                                        ? 'bg-green-100 text-green-800'
                                        : course.statut === 'annulee'
                                        ? 'bg-red-100 text-red-800'
                                        : course.statut === 'en_cours'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {course.statut}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Euro className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-900">
                                  {course.prix.toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {clientDetails.courses.length === 0 && (
                      <div className="border-t border-slate-200 pt-6">
                        <div className="text-center py-8">
                          <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 text-sm">
                            Ce client n'a pas encore effectué de courses
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
