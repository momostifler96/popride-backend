import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ArrowRight, CreditCard, User, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { formatPrice } from '../../utils/currency';

interface RideRequest {
  id: string;
  ligne_nom: string;
  arret_depart_nom: string;
  arret_arrivee_nom: string;
  client_nom: string;
  prix: number;
  date_course: string;
}

export default function DriverUrbanRequests() {
  const { user, session, loading: authLoading } = useDriverAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = '/driver/login';
    } else if (session) {
      fetchRequests();
    }
  }, [session, authLoading]);

  const fetchRequests = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('courses_urbaines')
        .select(`
          id,
          prix,
          client_nom,
          date_course,
          ligne:lignes_urbaines(nom),
          arret_depart:arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
          arret_arrivee:arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom)
        `)
        .eq('statut', 'en_attente')
        .is('chauffeur_id', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const requestsData: RideRequest[] = (data || []).map((request: any) => ({
        id: request.id,
        ligne_nom: Array.isArray(request.ligne) ? request.ligne[0]?.nom : request.ligne?.nom,
        arret_depart_nom: Array.isArray(request.arret_depart) ? request.arret_depart[0]?.nom : request.arret_depart?.nom,
        arret_arrivee_nom: Array.isArray(request.arret_arrivee) ? request.arret_arrivee[0]?.nom : request.arret_arrivee?.nom,
        client_nom: request.client_nom,
        prix: request.prix,
        date_course: request.date_course,
      }));

      setRequests(requestsData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes');
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!user) return;

    setProcessingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update({
          chauffeur_id: user.id,
          statut: 'en_cours',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Redirect to active ride screen
      window.location.href = '/driver/urban/active';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation');
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update({
          statut: 'annulee',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Remove from list
      setRequests(requests.filter(r => r.id !== requestId));
      setProcessingId(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du refus');
      setProcessingId(null);
    }
  };

  const handleBack = () => {
    window.location.href = '/driver/home';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Courses urbaines</h1>
              <p className="text-xs text-slate-600">Demandes de courses</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-4 pb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-4">
              {error}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune demande</h3>
              <p className="text-slate-600">
                Aucune demande de course n'est disponible pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-5">
                    {/* Line Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {request.ligne_nom}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(request.date_course).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 mb-1">Départ</p>
                          <p className="font-semibold text-slate-900">{request.arret_depart_nom}</p>
                        </div>
                      </div>

                      <div className="flex items-center pl-4">
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 mb-1">Arrivée</p>
                          <p className="font-semibold text-slate-900">{request.arret_arrivee_nom}</p>
                        </div>
                      </div>
                    </div>

                    {/* Client & Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{request.client_nom}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span className="text-lg font-bold text-slate-900">
                          {formatPrice(request.prix)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Refuser</span>
                      </button>
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Accepter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
