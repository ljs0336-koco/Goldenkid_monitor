import { useState, useEffect } from 'react';
import { supabase, User, Device } from '../lib/supabase';
import { Plus, Trash2, Users, Bot } from 'lucide-react';

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // New teacher form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // New device form
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [newDeviceIds, setNewDeviceIds] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase
        .from('chatbot_users')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });
      
      if (usersData) setTeachers(usersData);

      const { data: devicesData } = await supabase
        .from('chatbot_devices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (devicesData) setDevices(devicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const { error } = await supabase
        .from('chatbot_users')
        .insert([{ username: newUsername, password: newPassword, role: 'teacher' }]);

      if (error) throw error;

      setNewUsername('');
      setNewPassword('');
      fetchData();
      alert('선생님 계정이 생성되었습니다.');
    } catch (error: any) {
      alert('계정 생성 실패: ' + error.message);
    }
  };

  const handleAssignDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !newDeviceIds) return;

    const ids = newDeviceIds.split(',').map(id => id.trim()).filter(id => id);
    if (ids.length === 0) return;

    try {
      const inserts = ids.map(id => ({
        user_id: selectedTeacherId,
        device_id: id,
      }));

      const { error } = await supabase
        .from('chatbot_devices')
        .insert(inserts);

      if (error) throw error;

      setNewDeviceIds('');
      fetchData();
      alert('기기가 배정되었습니다.');
    } catch (error: any) {
      alert('기기 배정 실패: ' + error.message);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 모든 기기 배정도 삭제됩니다.')) return;
    try {
      await supabase.from('chatbot_users').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('배정을 삭제하시겠습니까?')) return;
    try {
      await supabase.from('chatbot_devices').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Teacher Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">선생님 계정 관리</h2>
            </div>

            <form onSubmit={handleCreateTeacher} className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="아이디 (예: Tea019)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                생성
              </button>
            </form>

            <div className="space-y-3">
              {teachers.map(teacher => (
                <div key={teacher.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{teacher.username}</p>
                    <p className="text-xs text-slate-500">ID: {teacher.id}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-center text-slate-500 py-4">등록된 선생님이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Device Assignment */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">기기 배정</h2>
            </div>

            <form onSubmit={handleAssignDevices} className="space-y-4 mb-6">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">선생님 선택...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="기기 ID (쉼표로 구분, 예: n001, k1001)"
                  value={newDeviceIds}
                  onChange={(e) => setNewDeviceIds(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  배정
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {devices.map(device => {
                const teacher = teachers.find(t => t.id === device.user_id);
                return (
                  <div key={device.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{device.device_id}</p>
                      <p className="text-xs text-slate-500">담당: {teacher?.username || '알 수 없음'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {devices.length === 0 && (
                <p className="text-center text-slate-500 py-4">배정된 기기가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
