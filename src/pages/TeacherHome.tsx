import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Device } from '../lib/supabase';
import { Bot, Edit2, MessageSquare, Check, X } from 'lucide-react';

export default function TeacherHome() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAliasValue, setEditAliasValue] = useState('');
  
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('chatbot_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        setDevices(data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (device: Device) => {
    setEditingId(device.id);
    setEditAliasValue(device.alias || '');
  };

  const handleSaveAlias = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_devices')
        .update({ alias: editAliasValue })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setDevices(devices.map(d => d.id === id ? { ...d, alias: editAliasValue } : d));
      setEditingId(null);
    } catch (error) {
      console.error('Error saving alias:', error);
      alert('별명 저장에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">기기 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">안녕하세요, {user?.username} 선생님! 👋</h1>
          <p className="text-slate-500 mt-2">선생님께 배정된 AI 금쪽이 챗봇 목록입니다. 기기의 별명을 설정하거나 채팅 내역을 모니터링할 수 있습니다.</p>
        </div>

        {devices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">배정된 기기가 없습니다</h3>
            <p className="text-slate-500">관리자에게 기기 배정을 요청해 주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => (
              <div key={device.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                      {device.device_id}
                    </span>
                  </div>

                  {editingId === device.id ? (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">학생 이름 / 별명 설정</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editAliasValue}
                          onChange={(e) => setEditAliasValue(e.target.value)}
                          placeholder="예: 1학년 3반 김철수"
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias(device.id)}
                        />
                        <button onClick={() => handleSaveAlias(device.id)} className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 group">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800 truncate">
                          {device.alias || '별명 미설정'}
                        </h3>
                        <button 
                          onClick={() => handleEditClick(device)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="별명 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!device.alias && (
                        <p className="text-xs text-slate-400 mt-1">연필 아이콘을 눌러 학생 이름을 설정해보세요.</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => navigate(`/chat/${device.device_id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 text-slate-700 font-medium py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    채팅 내역 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
