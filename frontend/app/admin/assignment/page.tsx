'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import * as Alert from '@/lib/sweetalert';

interface Guru {
  uuid: string;
  namaLengkap: string;
  nip: string;
}

interface Kelas {
  uuid: string;
  namaKelas: string;
}

interface Mapel {
  uuid: string;
  namaMapel: string;
  kodeMapel: string;
}

interface TahunAjaran {
  uuid: string;
  tahun: string;
  semester: number;
  isActive: boolean;
}

interface Assignment {
  uuid: string;
  guru: Guru;
  kelas: Kelas;
  mapel: Mapel;
  createdAt: string;
}

export default function AdminAssignmentPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    guruUuid: '',
    kelasUuid: '',
    mapelUuid: '',
    tahunAjaranUuid: '',
    semester: 1,
    jamPerMinggu: 4,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [guruRes, kelasRes, mapelRes, tahunRes] = await Promise.all([
        api.get('/users?role=GURU&limit=100'),
        api.get('/kelas'),
        api.get('/mapel'),
        api.get('/tahun-ajaran'),
      ]);

      // Parse guru from users
      const gurus = (guruRes.data.users || [])
        .filter((u: any) => u.guru)
        .map((u: any) => u.guru);

      setGuruList(gurus);
      setKelasList(kelasRes.data);
      setMapelList(mapelRes.data);
      setTahunAjaranList(tahunRes.data);
      
      // Get all assignments
      fetchAssignments();
    } catch (error: any) {
      Alert.error('Error', error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Untuk sementara kita ambil dari GuruMengajarKelas
      // Nanti bisa diganti dengan endpoint TeachingAssignment
      const response = await api.get('/guru/mengajar/all'); // Endpoint ini perlu dibuat
      setAssignments(response.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guruUuid || !formData.kelasUuid || !formData.mapelUuid) {
      Alert.error('Error', 'Semua field wajib diisi!');
      return;
    }

    Alert.loading('Menyimpan assignment...');
    try {
      // POST ke endpoint all yang punya handler POST
      await api.post('/guru/mengajar/all', formData);
      
      Alert.success('Berhasil!', 'Assignment guru berhasil ditambahkan');
      setShowModal(false);
      setFormData({
        guruUuid: '',
        kelasUuid: '',
        mapelUuid: '',
        tahunAjaranUuid: '',
        semester: 1,
        jamPerMinggu: 4,
      });
      fetchAssignments();
    } catch (error: any) {
      Alert.error('Gagal', error.response?.data?.message || 'Gagal menyimpan assignment');
    }
  };

  const handleDelete = async (uuid: string, guruNama: string, kelasNama: string, mapelNama: string) => {
    const result = await Alert.confirm(
      'Hapus Assignment?',
      `Hapus assignment ${guruNama} mengajar ${mapelNama} di ${kelasNama}?`
    );

    if (!result.isConfirmed) return;

    Alert.loading('Menghapus...');
    try {
      await api.delete(`/guru/mengajar/${uuid}`);
      Alert.success('Berhasil!', 'Assignment berhasil dihapus');
      fetchAssignments();
    } catch (error: any) {
      Alert.error('Gagal', error.response?.data?.message || 'Gagal menghapus assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="ADMIN" />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Assignment Guru Mengajar</h1>
              <p className="text-gray-600 mt-1">Kelola guru mengajar mata pelajaran di kelas</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span>
              Tambah Assignment
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Cara Kerja Assignment</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>1 Guru = 1 User/Akun</strong> → Buat user dengan role GURU</li>
              <li>• <strong>Wali Kelas</strong> → Set di halaman Kelas (pilih guru dari dropdown)</li>
              <li>• <strong>Guru Mengajar</strong> → Set di sini (guru mengajar mapel apa di kelas apa)</li>
              <li>• Contoh: Pak Budi bisa mengajar Matematika di 10A, 10B DAN jadi wali kelas 10A</li>
            </ul>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Belum ada assignment. Klik "Tambah Assignment" untuk mulai assign guru ke kelas.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment, index) => (
                      <tr key={assignment.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {assignment.guru.namaLengkap}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{assignment.guru.nip}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{assignment.kelas.namaKelas}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{assignment.mapel.namaMapel}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(
                              assignment.uuid,
                              assignment.guru.namaLengkap,
                              assignment.kelas.namaKelas,
                              assignment.mapel.namaMapel
                            )}
                            className="text-red-600 hover:text-red-800"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Tambah Assignment Guru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guru</label>
                <select
                  value={formData.guruUuid}
                  onChange={(e) => setFormData({ ...formData, guruUuid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Guru</option>
                  {guruList.map((guru) => (
                    <option key={guru.uuid} value={guru.uuid}>
                      {guru.namaLengkap} ({guru.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                <select
                  value={formData.kelasUuid}
                  onChange={(e) => setFormData({ ...formData, kelasUuid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((kelas) => (
                    <option key={kelas.uuid} value={kelas.uuid}>
                      {kelas.namaKelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                <select
                  value={formData.mapelUuid}
                  onChange={(e) => setFormData({ ...formData, mapelUuid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mapelList.map((mapel) => (
                    <option key={mapel.uuid} value={mapel.uuid}>
                      {mapel.namaMapel} ({mapel.kodeMapel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
