import { useState, useEffect } from 'react';
import { supabase, Device } from '../lib/supabase';
import { Bot, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeacherDashboard() {
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
        if (data.length > 0 && !selectedDevice) {
          setSelectedDevice(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && devices.length === 0) {
    return <div className="flex-1 flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Device List Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">배정된 기기 ({devices.length})</h2>
          <button onClick={fetchDevices} className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {devices.map(device => (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all",
                selectedDevice?.id === device.id
                  ? "bg-teal-50 border border-teal-200 shadow-sm"
                  : "bg-white border border-slate-100 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedDevice?.id === device.id ? "bg-teal-100" : "bg-slate-100"
              )}>
                <Bot className={cn(
                  "w-5 h-5",
                  selectedDevice?.id === device.id ? "text-teal-600" : "text-slate-500"
                )} />
              </div>
              <div>
                <p className={cn(
                  "font-bold",
                  selectedDevice?.id === device.id ? "text-teal-900" : "text-slate-700"
                )}>
                  {device.device_id}
                </p>
                <p className="text-xs text-slate-500">
                  {device.alias || 'AI 금쪽이 챗봇'}
                </p>
              </div>
              {selectedDevice?.id === device.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-teal-500" />
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
      <div className="flex-1 bg-[#f4f7f9] relative">
        {selectedDevice ? (
          <iframe
            key={selectedDevice.id} // Force reload when device changes
            src={`https://edu.telliot.co.kr/device-chat-list/${selectedDevice.device_id}`}
            className="w-full h-full border-none"
            title={`Chat Monitor for ${selectedDevice.device_id}`}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-400">
            <Bot className="w-16 h-16 mb-4 opacity-20" />
            <p>기기를 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
