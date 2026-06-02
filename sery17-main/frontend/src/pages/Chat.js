import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ======== Notification Sound (Web Audio API) ========
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine'; // Sine wave is perfect for a whistle sound
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const t = ctx.currentTime;
    const actualVol = 0.5;

    // الصفرة الأولى (صعود Fwee)
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.linearRampToValueAtTime(2600, t + 0.1);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(actualVol, t + 0.02);
    gainNode.gain.setValueAtTime(actualVol, t + 0.08);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.1);

    // الصفرة الثانية (هبوط Fwoo)
    osc.frequency.setValueAtTime(2600, t + 0.12);
    osc.frequency.linearRampToValueAtTime(1600, t + 0.35);

    gainNode.gain.setValueAtTime(0, t + 0.12);
    gainNode.gain.linearRampToValueAtTime(actualVol, t + 0.15);
    gainNode.gain.setValueAtTime(actualVol, t + 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    
    osc.start(t);
    osc.stop(t + 0.4);
  } catch (e) {
    // Silently fail if audio not supported
  }
};

const Chat = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const locale = isRtl ? ar : enUS;

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const selectedContactRef = useRef(null);

  // Keep ref in sync with state so interval can access current value
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // إغلاق القائمة المنبثقة عند النقر في أي مكان آخر
  useEffect(() => {
    const handleCloseMenu = (e) => {
      // إذا كان النقر على زر الخيارات نفسه، لا تغلق القائمة هنا بل اترك معالج الزر يقوم بالتبديل
      if (e.target && e.target.closest('[title="خيارات الرسالة"]')) {
        return;
      }
      setContextMenu(null);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('contextmenu', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
    };
  }, []);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch(`${API}/chat/v2/contacts?t=${new Date().getTime()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setContacts(data);
    } catch {
      // silently fail on refresh
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId, isBackground = false) => {
    if (!contactId) return;
    try {
      const response = await fetch(`${API}/chat/v2/messages/${contactId}?t=${new Date().getTime()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();

      setMessages(prev => {
        const newCount = data.length;
        const oldCount = isBackground ? prevMessageCountRef.current : 0;

        if (isBackground && newCount > oldCount && oldCount > 0) {
          // New message arrived from the other person
          const lastMsg = data[data.length - 1];
          if (lastMsg && lastMsg.sender_id !== user.id) {
            playNotificationSound();
            // Scroll to bottom for new message
            setTimeout(() => scrollToBottom(), 150);
          }
        }
        prevMessageCountRef.current = newCount;
        return data;
      });

      if (!isBackground) {
        prevMessageCountRef.current = data.length;
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    } catch {
      // silently fail
    }
  }, [user.id, scrollToBottom]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!selectedContact) return;

    prevMessageCountRef.current = 0;
    fetchMessages(selectedContact.id, false);

    const interval = setInterval(() => {
      if (selectedContactRef.current) {
        fetchMessages(selectedContactRef.current.id, true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedContact, fetchMessages]);

  const handleEditMessage = async (messageId) => {
    if (!inputText.trim()) return;
    try {
      const response = await fetch(`${API}/chat/v2/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: inputText.trim() })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || isRtl ? 'فشل تعديل الرسالة' : 'Failed to edit message');
      }
      setEditingMessage(null);
      setInputText('');
      fetchMessages(selectedContact?.id, false);
    } catch (err) {
      toast.error(err.message || isRtl ? 'حدث خطأ أثناء تعديل الرسالة' : 'Error editing message');
    }
  };

  const [pendingAttachment, setPendingAttachment] = useState(null);

  const handleSendMessage = async (imageUrl = null) => {
    if (editingMessage) {
      await handleEditMessage(editingMessage.id);
      return;
    }

    let finalImageUrl = imageUrl;
    
    if (pendingAttachment && !finalImageUrl) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('file', pendingAttachment.file);
        const uploadRes = await fetch(`${API}/storage/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (!uploadRes.ok) throw new Error();
        const data = await uploadRes.json();
        if (data.storage_path) {
          finalImageUrl = data.storage_path.startsWith('http') ? data.storage_path : `${API}/storage/files/${encodeURIComponent(data.storage_path)}`;
        } else {
          finalImageUrl = data.url;
        }
        setPendingAttachment(null);
      } catch {
        toast.error(isRtl ? 'فشل رفع المرفق' : 'Failed to upload attachment');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    if (!inputText.trim() && !finalImageUrl) return;
    if (!selectedContact) return;

    const msgData = {
      receiver_id: selectedContact.id,
      text: inputText.trim() || null,
      image_url: finalImageUrl
    };

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedContact.id,
      text: msgData.text,
      image_url: msgData.image_url,
      created_at: new Date().toISOString(),
      is_deleted: false,
      is_read: false,
      is_edited: false
    };

    setMessages(prev => {
      prevMessageCountRef.current = prev.length + 1;
      return [...prev, tempMsg];
    });
    setInputText('');
    setTimeout(() => scrollToBottom(), 50);

    try {
      const response = await fetch(`${API}/chat/v2/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(msgData)
      });
      if (!response.ok) throw new Error();
      // Refresh to get real message from server
      fetchMessages(selectedContact.id, false);
      fetchContacts();
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال الرسالة' : 'Error sending message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const result = await Swal.fire({
        title: isRtl ? 'خيارات الحذف' : 'Delete Options',
        text: isRtl ? 'هل تريد حذف هذه الرسالة للجميع أم من عندك فقط؟' : 'Do you want to delete this message for everyone or just for you?',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#e53935',
        denyButtonColor: '#ff9800',
        cancelButtonColor: '#9e9e9e',
        confirmButtonText: isRtl ? 'حذف للجميع' : 'Delete for Everyone',
        denyButtonText: isRtl ? 'حذف لدي فقط' : 'Delete for Me',
        cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
        reverseButtons: true
      });
      
      if (!result.isConfirmed && !result.isDenied) return;
      
      const forEveryone = result.isConfirmed;
      
      setMessages(prev => {
        prevMessageCountRef.current = prev.length - 1;
        return prev.filter(m => m.id !== messageId);
      });
      
      const response = await fetch(`${API}/chat/v2/messages/${messageId}?for_everyone=${forEveryone}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete message');
      }
      
      toast.success(forEveryone ? isRtl ? 'تم حذف الرسالة للجميع' : 'Message deleted for everyone' : isRtl ? 'تم حذف الرسالة من عندك فقط' : 'Message deleted for you');
    } catch (err) {
      toast.error(err.message || isRtl ? 'لم يتم الحذف' : 'Not deleted');
      fetchMessages(selectedContact?.id, false);
    }
  };

  const handleClearConversation = async (contactId) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه المحادثة بالكامل؟ سيتم مسح جميع الرسائل بينك وبين هذا الشخص، ولا يمكن التراجع عن ذلك.' : 'Are you sure you want to clear this conversation? All messages will be erased from your device.')) return;
    try {
      const response = await fetch(`${API}/chat/v2/conversation/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error();
      setMessages([]);
      fetchContacts();
      toast.success(isRtl ? 'تم حذف المحادثة بالكامل بنجاح' : 'Conversation completely cleared');
    } catch {
      toast.error(isRtl ? 'لم يتم حذف المحادثة' : 'Conversation not cleared');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          }, 'image/jpeg', 0.7); // 70% quality for good compression
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      } else if (file.size > 100 * 1024 * 1024) {
        toast.error(isRtl ? 'حجم الملف يجب أن لا يتجاوز 100 ميجابايت' : 'File size must not exceed 100MB');
        setUploadingImage(false);
        return;
      }

      const previewUrl = URL.createObjectURL(fileToUpload);
      setPendingAttachment({ file: fileToUpload, previewUrl, type: file.type });
    } catch {
      toast.error(isRtl ? 'فشل معالجة الملف' : 'Failed to process file');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'hh:mm a', { locale });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale });
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      {/* ✅ Fixed full-height container - uses fixed positioning relative to viewport minus nav */}
      <div
        className="flex bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        style={{ height: 'calc(100vh - 5rem)' }}
      >
        {/* ======== Contacts Sidebar ======== */}
        <div
          className={`bg-gray-50 flex flex-col border-gray-200 flex-shrink-0 transition-all duration-300
            ${isRtl ? 'border-l' : 'border-r'}
            ${selectedContact ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'}
          `}
        >
          {/* Header */}
          <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{isRtl ? 'الدردشة الفورية' : 'Instant Chat'}</h2>
              <p className="text-xs text-gray-400">{isRtl ? 'محادثات آمنة ومشفرة 🔒' : 'Secure Encrypted Chats 🔒'}</p>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingContacts ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center text-gray-500 mt-10 p-4 text-sm">
                <div className="text-4xl mb-3">👥</div>
                لا يوجد جهات اتصال متاحة للمحادثة حسب الصلاحيات.
              </div>
            ) : (
              contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all text-right
                    ${selectedContact?.id === contact.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-white border border-transparent hover:shadow-sm'}
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {contact.name?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden text-right min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-800 truncate text-sm">{t(contact.name || '')}</div>
                      {contact.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse flex items-center justify-center min-w-4 h-4 shadow-sm">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {contact.last_message || (isRtl ? 'ابدأ المحادثة...' : 'Start conversation...')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ======== Chat Area ======== */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedContact ? 'hidden md:flex' : 'flex'}`}
          style={{ background: '#F0F2F5' }}>

          {selectedContact ? (
            <>
              {/* Chat Header - fixed height */}
              <div className="p-3 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm z-10 flex-shrink-0">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                  {t(selectedContact.name || '')?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate">{t(selectedContact.name || '')}</div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
                    {isRtl ? 'محادثة خاصة ومشفرة' : 'Private encrypted conversation'}
                  </div>
                </div>
                <button
                  onClick={() => handleClearConversation(selectedContact.id)}
                  className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-all flex-shrink-0 shadow-sm border border-transparent hover:shadow-md"
                  title={isRtl ? "حذف جميع رسائل هذه المحادثة (من جهازك فقط، ستبقى لدى الطرف الآخر)" : "Clear conversation (from your device only)"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* ✅ Messages Area - hidden x-scroll, visible y-scroll */}
              <div
                ref={messagesAreaRef}
                className="flex-1 overflow-x-hidden overflow-y-auto p-4"
                style={{ minHeight: 0 }}
              >
                {messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-2xl text-sm font-medium text-gray-500 shadow-sm border border-gray-100 text-center">
                      <div className="text-3xl mb-2">🔒</div>
                      {isRtl ? 'لا توجد رسائل سابقة.' : 'No previous messages.'}<br />
                      <span className="text-xs text-gray-400">{isRtl ? 'المحادثة مشفرة بينك وبين هذا الشخص فقط.' : 'This chat is end-to-end encrypted.'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg, index) => {
                      const isMine = msg.sender_id === user.id;
                      const prevMsg = messages[index - 1];
                      const showDate = index === 0 || new Date(msg.created_at).toDateString() !== new Date(prevMsg?.created_at).toDateString();
                      const showAvatar = !isMine && (index === messages.length - 1 || messages[index + 1]?.sender_id !== msg.sender_id);
                      
                      // Fix timezone bug: python backend sends naive UTC timestamp without 'Z'
                      const safeCreatedAt = msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z';
                      const createdTime = new Date(safeCreatedAt).getTime();
                      const nowTime = Date.now();
                      const isWithin20Mins = (nowTime - createdTime) < 20 * 60 * 1000;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="bg-white/90 px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`w-full flex items-end gap-2 mb-2 ${isMine ? 'justify-end' : 'justify-start'}`} style={{ direction: 'ltr' }}>
                            {/* Avatar placeholder for non-mine to keep alignment */}
                            {!isMine && (
                              <div className={`w-7 h-7 rounded-full flex-shrink-0 ${showAvatar ? 'bg-gradient-to-tr from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold' : 'opacity-0'}`}>
                                {showAvatar ? selectedContact.name?.charAt(0)?.toUpperCase() : ''}
                              </div>
                            )}

                             <div className="max-w-[75%] flex items-center gap-2 group relative">
                               <div 
                                 className={`px-3.5 py-2 rounded-2xl shadow-sm transition-all text-right relative
                                   ${isMine
                                     ? 'bg-[#dcf8c6] text-gray-900 rounded-br-none border border-[#c1e2a4]'
                                     : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}
                                   ${isMine && isWithin20Mins ? 'pl-16 min-h-[44px]' : ''}
                                 `}
                                 style={{ direction: 'rtl' }}
                               >
                                 {/* Action buttons (Edit/Delete) - inside bubble on the left */}
                                 {isMine && isWithin20Mins && (
                                   <div className="absolute top-1/2 -translate-y-1/2 left-1.5 flex items-center gap-1 opacity-100 flex-shrink-0" style={{ direction: 'ltr' }}>
                                     {msg.text && (
                                       <button
                                         onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                          setEditingMessage(msg);
                                          setInputText(msg.text);
                                          setTimeout(() => {
                                            if (inputRef.current) {
                                              inputRef.current.focus();
                                              inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                          }, 100);
                                        }}
                                         className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-full shadow-sm hover:scale-110 transition-all border border-gray-200/50 cursor-pointer z-10"
                                         title={isRtl ? "تعديل الرسالة (متاح لـ 20 دقيقة)" : "Edit message (available for 20 mins)"}
                                       >
                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                         </svg>
                                       </button>
                                     )}
                                     <button
                                       onClick={(e) => {
                                         e.preventDefault();
                                         e.stopPropagation();
                                         handleDeleteMessage(msg.id);
                                       }}
                                       className="p-1.5 text-gray-500 hover:text-red-600 bg-white/60 hover:bg-white rounded-full shadow-sm hover:scale-110 transition-all border border-gray-200/50 cursor-pointer z-10"
                                       title={isRtl ? "حذف الرسالة للجميع (متاح لـ 20 دقيقة)" : "Delete message for everyone (available for 20 mins)"}
                                     >
                                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                       </svg>
                                     </button>
                                   </div>
                                 )}
                                {msg.image_url && (
                                  <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={msg.image_url}
                                      alt={isRtl ? "مرفق" : "Attachment"}
                                      className="max-w-full h-auto rounded-xl mb-1.5 cursor-pointer hover:opacity-90 transition-opacity max-h-60 object-contain"
                                    />
                                  </a>
                                )}
                                {msg.text && (
                                  <div className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">
                                    {msg.text}
                                  </div>
                                )}
                                <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {msg.is_edited && <span className="font-semibold text-[9px] opacity-90">{i18n.language === 'ar' ? 'معدلة' : 'edited'} • </span>}
                                  {formatTime(msg.created_at)}
                                  {isMine && (
                                    <div className="flex items-center ml-1" style={{ color: msg.is_read ? '#34b7f1' : '#a0aec0' }}>
                                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L7 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M22 10l-5.5 5.5m-3 3L11 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ✅ Input Area - fixed at bottom, flex-shrink-0 */}
              <div className="p-3 bg-[#F0F2F5] flex-shrink-0 border-t border-gray-200/50">
                {editingMessage && (
                  <div className="bg-indigo-50/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between text-xs text-indigo-700 border border-indigo-100 rounded-t-2xl animate-fadeIn mb-1.5 shadow-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {i18n.language === 'ar' ? 'تعديل الرسالة...' : 'Editing message...'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setInputText('');
                      }}
                      className="text-gray-400 hover:text-red-500 font-bold transition-colors bg-white hover:bg-red-50 p-1 rounded-full shadow-sm"
                      title={isRtl ? "إلغاء التعديل" : "Cancel Edit"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 transition-all w-full focus-within:border-gray-200">
                  
                  {pendingAttachment && (
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setPendingAttachment(null)}
                          className={`absolute -top-2 ${isRtl ? '-left-2' : '-right-2'} bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        {pendingAttachment.type.startsWith('image/') ? (
                          <img src={pendingAttachment.previewUrl} alt="Preview" className="h-24 w-auto rounded-lg object-contain shadow-sm border border-gray-200" />
                        ) : (
                          <div className="h-24 w-24 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2 px-4 py-2">
                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={(!inputText.trim() && !pendingAttachment) || uploadingImage}
                      className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200
                        ${(inputText.trim() || pendingAttachment)
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <svg className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>

                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={i18n.language === 'ar' ? "اكتب رسالة..." : "Type a message..."}
                      className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none resize-none py-2 text-gray-800 text-sm leading-relaxed"
                      rows="1"
                      style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
                      dir="auto"
                    />

                  {/* Attachment Last (so it's on the Left in RTL) */}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className={`p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors flex-shrink-0 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isRtl ? "إرفاق ملف" : "Attach file"}
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state when no contact selected */
            <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-8">
              <div className="w-28 h-28 mb-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 relative">
                <svg className="w-14 h-14 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">{isRtl ? 'الدردشة الفورية الآمنة' : 'Secure Instant Chat'}</h3>
              <p className="text-center max-w-xs text-sm leading-relaxed text-gray-400">
                {isRtl ? 'اختر زميلاً من القائمة على اليمين للبدء بمحادثة.' : 'Select a colleague from the list to start chatting.'}<br />
                <span className="text-indigo-400 font-medium">{isRtl ? '🔒 المحادثات مشفرة تماماً.' : '🔒 Chats are fully encrypted.'}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      {contextMenu && (() => {
        const menuWidth = 140;
        const menuHeight = 90;
        let posX = contextMenu.x;
        let posY = contextMenu.y;
        
        if (posX + menuWidth > window.innerWidth) {
          posX = window.innerWidth - menuWidth - 10;
        }
        if (posY + menuHeight > window.innerHeight) {
          posY = window.innerHeight - menuHeight - 10;
        }
        
        return (
          <div 
            className="fixed bg-white border border-gray-200/80 rounded-xl shadow-xl py-1.5 min-w-[140px] z-[9999] animate-fadeIn text-sm text-right font-medium divide-y divide-gray-100"
            style={{ 
              top: `${posY}px`, 
              left: `${posX}px`,
              direction: 'rtl'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.message.text && (
              <button
                onClick={() => {
                  setEditingMessage(contextMenu.message);
                  setInputText(contextMenu.message.text);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>تعديل الرسالة</span>
              </button>
            )}
            <button
              onClick={() => {
                handleDeleteMessage(contextMenu.message.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>حذف للجميع</span>
            </button>
          </div>
        );
      })()}
    </Layout>
  );
};

export default Chat;
