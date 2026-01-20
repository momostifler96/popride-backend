import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

export default function Topbar() {
  const { adminUser } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm h-16 fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-8 flex items-center justify-end">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-2 rounded-full">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {adminUser?.email}
            </p>
            <p className="text-xs text-slate-500">Administrateur</p>
          </div>
        </div>
      </div>
    </div>
  );
}
