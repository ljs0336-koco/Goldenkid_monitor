import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Device } from '../lib/supabase';
import { Bot, RefreshCw, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, []);

  // Update selected device when URL param changes or devices load
  useEffect(() => {
    if (devices.length > 0) {
      if (deviceId) {
        const found = devices.find(d => d.device_id === deviceId);
        if (found) {
          setSelectedDevice(found);
        } else {
          // If invalid ID in URL, select first
          setSelectedDevice(devices[0]);
          navigate(`/chat/${devices[0].device_id}`, { replace: true });
        }
      } else {
        // If no ID in URL, select first
        setSelectedDevice(devices[0]);
        navigate(`/chat/${devices[0].device_id}`, { replace: true });
      }
    }
  }, [deviceId, devices, navigate]);

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

  const handleDeviceSelect = (device: Device) => {
    navigate(`/chat/${device.device_id}`);
  };

  if (loading && devices.length === 0) {
    return <div className="flex-1 flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Device List Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            홈으로
          </button>
          <button onClick={fetchDevices} className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors" title="새로고침">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm">모니터링 기기 목록 ({devices.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {devices.map(device => (
            <button
              key={device.id}
              onClick={() => handleDeviceSelect(device)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                selectedDevice?.id === device.id
                  ? "bg-teal-50 border border-teal-200 shadow-sm"
                  : "bg-white border border-transparent hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                selectedDevice?.id === device.id ? "bg-teal-100" : "bg-slate-100"
              )}>
                <Bot className={cn(
                  "w-5 h-5",
                  selectedDevice?.id === device.id ? "text-teal-600" : "text-slate-500"
                )} />
              </div>
              <div className="overflow-hidden">
                <p className={cn(
                  "font-bold truncate text-sm",
                  selectedDevice?.id === device.id ? "text-teal-900" : "text-slate-700"
                )}>
                  {device.alias || '별명 미설정'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {device.device_id}
                </p>
              </div>
              {selectedDevice?.id === device.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              )}
            </button>
          ))}
          {devices.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              배정된 기기가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area (Iframe) */}
      <div className="flex-1 bg-[#f4f7f9] relative flex flex-col">
        {selectedDevice ? (
          <>
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 leading-tight">
                    {selectedDevice.alias || '별명 미설정'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{selectedDevice.device_id} 채팅 내역</p>
                </div>
              </div>
            </div>
            <iframe
              key={selectedDevice.id} // Force reload when device changes
              src={`https://edu.telliot.co.kr/device-chat-list/${selectedDevice.device_id}`}
              className="w-full flex-1 border-none bg-white"
              title={`Chat Monitor for ${selectedDevice.device_id}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </>
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-400">
            <Bot className="w-16 h-16 mb-4 opacity-20" />
            <p>좌측에서 모니터링할 기기를 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
