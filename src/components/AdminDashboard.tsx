import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldCheck, Users, CreditCard, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('saas_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/admin/users', { headers })
        ]);

        if (statsRes.ok && usersRes.ok) {
          setStats(await statsRes.json());
          setUsers((await usersRes.json()).users);
        } else {
          toast.error("Error al cargar datos del administrador");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-red-500">
        <ShieldCheck className="mr-2 h-8 w-8" />
        <h2 className="text-xl font-bold">Acceso Denegado. Se requieren permisos de administrador.</h2>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-white">Cargando métricas...</div>;

  return (
    <div className="flex h-full flex-col p-6 text-white overflow-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <ShieldCheck className="mr-2 h-6 w-6 text-indigo-400" />
        Súper Administrador
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center text-gray-400 mb-2">
            <Users className="h-5 w-5 mr-2" /> Usuarios Totales
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center text-gray-400 mb-2">
            <CreditCard className="h-5 w-5 mr-2" /> Suscripciones PRO
          </div>
          <div className="text-3xl font-bold text-green-400">{stats?.activeSubscriptions || 0}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center text-gray-400 mb-2">
            <Activity className="h-5 w-5 mr-2" /> Logs de Ejecución
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalExecutionLogs || 0}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center text-gray-400 mb-2">
            <ShieldCheck className="h-5 w-5 mr-2" /> Estado Stripe
          </div>
          <div className={`text-xl font-bold ${stats?.stripeConnected ? 'text-green-400' : 'text-red-400'}`}>
            {stats?.stripeConnected ? 'Conectado (Seguro)' : 'Faltan Claves (.env)'}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Gestión de Clientes</h2>
      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-white/5 text-gray-200">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado Membresía</th>
              <th className="p-4">Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.subscription_status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {u.subscription_status?.toUpperCase() || 'INACTIVE'}
                  </span>
                </td>
                <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
