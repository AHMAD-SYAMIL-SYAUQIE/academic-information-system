'use client';

import { useAuthStore } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  role: 'ADMIN' | 'GURU' | 'SISWA';
}

export default function Sidebar({ role }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const adminMenus = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Kelola Users', path: '/admin/users', icon: '👥' },
    { name: 'Kelola Kelas', path: '/admin/kelas', icon: '🏫' },
    { name: 'Kelola Mata Pelajaran', path: '/admin/mapel', icon: '📚' },
    { name: 'Assignment Mengajar', path: '/admin/assignment', icon: '👨‍🏫' },
    { name: 'Tahun Ajaran', path: '/admin/tahun-ajaran', icon: '📅' },
    { name: 'Sesi Absensi', path: '/admin/sesi-absensi', icon: '⏰' },
    { name: 'Laporan', path: '/admin/laporan', icon: '📈' },
    { name: 'Aturan Akademik', path: '/admin/aturan', icon: '⚙️' },
  ];

  const guruMenus = [
    { name: 'Dashboard', path: '/guru/dashboard', icon: '📊' },
    { name: 'QR Code Absensi', path: '/guru/qr-code', icon: '📱' },
    { name: 'Monitoring Absensi', path: '/guru/absensi', icon: '✅' },
    { name: 'Input Nilai', path: '/guru/nilai', icon: '📝' },
    { name: 'Approval Izin', path: '/guru/izin', icon: '📋' },
    { name: 'Laporan Kelas', path: '/guru/laporan', icon: '📊' },
  ];

  const siswaMenus = [
    { name: 'Dashboard', path: '/siswa/dashboard', icon: '📊' },
    { name: 'Scan QR Absensi', path: '/siswa/scan-qr', icon: '📸' },
    { name: 'Riwayat Absensi', path: '/siswa/riwayat', icon: '📅' },
    { name: 'Lihat Nilai', path: '/siswa/nilai', icon: '📈' },
    { name: 'Ajukan Izin', path: '/siswa/izin', icon: '📝' },
  ];

  const menus = role === 'ADMIN' ? adminMenus : role === 'GURU' ? guruMenus : siswaMenus;

  return (
    <div className="flex flex-col h-screen w-72 bg-white text-gray-800 fixed left-0 top-0 shadow-lg border-r border-gray-200">
      {/* Header dengan Logo */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
            <svg className="w-7 h-7 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg">MAN 19 Jakarta</h1>
            <p className="text-xs text-blue-100">Sistem Akademik</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <p className="text-xs text-blue-100 mb-1">Pengguna Aktif</p>
          <p className="font-semibold text-sm truncate">{user?.username}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <p className="text-xs text-blue-50">
              {role === 'ADMIN' ? 'Administrator' : role === 'GURU' ? 'Tenaga Pengajar' : 'Peserta Didik'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menus.map((menu) => (
          <button
            key={menu.path}
            onClick={() => router.push(menu.path)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
              isActive(menu.path)
                ? 'bg-blue-600 text-white shadow-md font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">{menu.icon}</span>
            <span className="text-sm">{menu.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer dengan Logout */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar
        </button>
      </div>
    </div>
  );
}
