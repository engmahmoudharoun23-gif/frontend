import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // جلب المستخدمين من نفس المشروع
  useEffect(() => {
    fetchUsers();
    
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // تحديث الرسائل تلقائياً كل 5 ثواني (تقليل الحمل)
  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        fetchMessages(selectedUser.id, true);
      }, 5000); // زيادة الفترة من 3 إلى 5 ثواني
      return () => clearInterval(interval);
    }
  }, [selectedUser, messages]); // إضافة messages كـ dependency
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      // استخدام Web Audio API لإنشاء صوت beep بسيط
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // تردد عالي
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // تشغيل مرتين للتنبيه
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(1, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch (e) {
      console.log('صوت التنبيه غير مدعوم');
    }
  };

  const fetchMessages = async (userId, silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chat/simple/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // التحقق من وجود رسائل جديدة
      if (!silent && messages.length > 0) {
        const newMessages = response.data.filter(msg => 
          msg.sender_id !== user.id && 
          !messages.find(m => m.id === msg.id)
        );
        
        if (newMessages.length > 0) {
          playNotificationSound();
          
          // إظهار إشعار المتصفح
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('رسالة جديدة', {
              body: `رسالة من ${selectedUser?.full_name || 'مستخدم'}`,
              icon: '/logo192.png'
            });
          }
        }
      }
      
      setMessages(response.data);
    } catch (error) {
      console.error('خطأ في جلب الرسائل:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;
    
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/chat/simple/send`, {
        receiver_id: selectedUser.id,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewMessage('');
      fetchMessages(selectedUser.id, true);
      fetchUsers(); // تحديث قائمة المستخدمين
    } catch (error) {
      alert('فشل إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    fetchMessages(u.id);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="h-[calc(100vh-80px)] flex">
        {/* قائمة المستخدمين */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">💬 المحادثات</h2>
            <p className="text-sm text-gray-500 mt-1">فريق عملك</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">لا يوجد مستخدمون</div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === u.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {u.full_name?.charAt(0) || u.username?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{u.full_name || u.username}</h3>
                      <p className="text-xs text-gray-500">{u.role === 'admin' ? 'مسؤول' : 'مستخدم'}</p>
                      {u.shared_projects && u.shared_projects.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">📁 {u.shared_projects[0].substring(0, 25)}...</p>
                      )}
                    </div>
                    {u.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        {u.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* منطقة الدردشة */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedUser ? (
            <>
              {/* رأس الدردشة */}
              <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedUser.full_name || selectedUser.username}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.role === 'admin' ? '🔹 مسؤول' : '👤 مستخدم'}</p>
                  </div>
                </div>
              </div>

              {/* الرسائل */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">
                    <p className="text-4xl mb-2">💬</p>
                    <p>ابدأ المحادثة الآن</p>
                  </div>
                ) : (
                  messages.slice(-50).map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        <div className={`max-w-md ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'} rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow`}>
                          <p className="break-words text-sm">{msg.message}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className="text-xs font-bold">
                                {msg.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* إرسال رسالة */}
              <div className="bg-white border-t-2 border-gray-200 p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="💬 اكتب رسالتك..."
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                  >
                    {loading ? '⏳' : '📤'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">🔔 التحديث التلقائي كل 5 ثواني</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <p className="text-6xl mb-4">💬</p>
              <p className="text-xl">اختر مستخدم من القائمة لبدء المحادثة</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Chat;
