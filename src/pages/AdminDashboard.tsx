import { useState, useEffect } from 'react';
import { supabase, User, Device } from '../lib/supabase';
import { Plus, Trash2, Users, Bot, KeyRound, Calendar, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin current user
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Change Password form
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // New teacher form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || !currentUser) return;

    try {
      const { error } = await supabase
        .from('chatbot_users')
        .update({ password: newAdminPassword })
        .eq('id', currentUser.id);

      if (error) throw error;

      setNewAdminPassword('');
      alert('관리자 비밀번호가 성공적으로 변경되었습니다.');
      
      // Update local storage
      const updatedUser = { ...currentUser, password: newAdminPassword };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      alert('비밀번호 변경 실패: ' + error.message);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const { error } = await supabase
        .from('chatbot_users')
        .insert([{ 
          username: newUsername, 
          password: newPassword, 
          role: 'teacher',
          description: newDescription 
        }]);

      if (error) throw error;

      setNewUsername('');
      setNewPassword('');
      setNewDescription('');
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">등록된 선생님 계정</p>
              <p className="text-3xl font-bold text-slate-800">{teachers.length}<span className="text-lg font-normal text-slate-500 ml-1">명</span></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
              <Bot className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">배정된 총 기기 수</p>
              <p className="text-3xl font-bold text-slate-800">{devices.length}<span className="text-lg font-normal text-slate-500 ml-1">대</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">관리자 비밀번호 변경</h2>
            </div>
            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새로운 비밀번호 입력"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition-colors"
              >
                비밀번호 변경
              </button>
            </form>
          </div>

          {/* Create Teacher */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">새 선생님 계정 생성</h2>
            </div>
            <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="아이디 (예: Tea019)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="메모/설명 (예: 1학년 3반 김철수 선생님)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 md:col-span-2"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors md:col-span-2"
              >
                <Plus className="w-4 h-4" />
                계정 생성
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold text-slate-800 mb-4">선생님 목록</h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {teachers.map(teacher => {
                const assignedCount = devices.filter(d => d.user_id === teacher.id).length;
                return (
                  <div key={teacher.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{teacher.username}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(teacher.created_at)}</span>
                          <span className="flex items-center gap-1"><Bot className="w-3 h-3"/> {assignedCount}대 배정됨</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="계정 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {teacher.description && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-start gap-2 text-sm text-slate-600">
                        <FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                        <p>{teacher.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {teachers.length === 0 && (
                <p className="text-center text-slate-500 py-8">등록된 선생님이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Device Assignment */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-[500px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">기기 배정 및 관리</h2>
            </div>

            <form onSubmit={handleAssignDevices} className="space-y-4 mb-6 pb-6 border-b border-slate-100">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">선생님 선택...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.username} {t.description ? `(${t.description})` : ''}</option>
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
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  배정
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {devices.map(device => {
                const teacher = teachers.find(t => t.id === device.user_id);
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{device.device_id}</p>
                        <p className="text-xs text-slate-500">담당: {teacher?.username || '알 수 없음'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="배정 해제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {devices.length === 0 && (
                <p className="text-center text-slate-500 py-8">배정된 기기가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
