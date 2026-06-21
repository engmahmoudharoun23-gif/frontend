import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import { translateBrandingText } from '../utils/brandingTranslation';
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

    const playPop = (freq, startTime, duration) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'triangle'; // Very loud and piercing wave
      osc2.type = 'sine';     // Fills the body of the sound
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Sharp pitch sweep for a very aggressive pop
      osc1.frequency.setValueAtTime(freq, startTime);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration / 2);
      
      osc2.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration / 2);
      
      // Extreme amplitude envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(5.0, startTime + 0.01); // EXTREME VOLUME
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    const t = ctx.currentTime;
    // نغمة فقاعة مزدوجة (Bubble/Pop) بصوت حاد جداً وعالي
    playPop(800, t, 0.08);           // Pop 1
    playPop(1100, t + 0.12, 0.08);    // Pop 2
    
  } catch (e) {
    // Silently fail if audio not supported
  }
};

const playBuzzSound = () => {
  try {
    // Play the audio multiple times simultaneously to amplify the volume significantly
    const playLoudly = () => {
      const audio1 = new Audio('/yahoo-buzz.mp3');
      const audio2 = new Audio('/yahoo-buzz.mp3');
      const audio3 = new Audio('/yahoo-buzz.mp3');
      
      audio1.play().catch(e => console.error("Audio play failed", e));
      audio2.play().catch(e => {});
      audio3.play().catch(e => {});
    };
    playLoudly();
    
    // Add a shake effect to the chat window (like old Yahoo!)
    const chatContainer = document.querySelector('.bg-white.rounded-2xl.shadow-xl.overflow-hidden') || document.body;
    if (chatContainer) {
      if (!document.getElementById('yahoo-shake-style')) {
        const style = document.createElement('style');
        style.id = 'yahoo-shake-style';
        style.innerHTML = `
          @keyframes yahooShake {
            0% { transform: translate(3px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
          .yahoo-shake {
            animation: yahooShake 0.1s infinite;
          }
        `;
        document.head.appendChild(style);
      }
      chatContainer.classList.add('yahoo-shake');
      setTimeout(() => chatContainer.classList.remove('yahoo-shake'), 1200); // Shake for 1.2s matching the sound
    }
  } catch (e) {
    console.error("Error playing buzz", e);
  }
};

const Chat = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const locale = isRtl ? ar : enUS;

  const [contacts, setContacts] = useState(() => {
    try {
      const cached = localStorage.getItem('chat_contacts_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const [loadingContacts, setLoadingContacts] = useState(() => {
    return !localStorage.getItem('chat_contacts_cache');
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupMembers, setEditGroupMembers] = useState([]);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [newGroupAvatar, setNewGroupAvatar] = useState(null);
  const [editGroupAvatar, setEditGroupAvatar] = useState(null);
  const [uploadingGroupAvatar, setUploadingGroupAvatar] = useState(false);

  // حالة ربط المستخدمين (Link Users)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUser1, setLinkUser1] = useState('');
  const [linkUser2, setLinkUser2] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [chatLinks, setChatLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = [
    // Faces
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","👽","👾","🤖",
    // Hands
    "👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👣",
    // Hearts/Emotions
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
    // Animals
    "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷","🕸","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿","🦔",
    // Common symbols
    "🔥","✨","🌟","💫","💥","💯","💢","💨","💦","💤","✅","☑️","✔️","❌","❎","✖️","➕","➖","➗","‼️","⁉️","❓","❔","❕","❗️","🎉","🎊","🎈","💡","⏳","⌚️","⏰","⏱","⏲","🕰","🧭"
  ];

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
      try { localStorage.setItem('chat_contacts_cache', JSON.stringify(data)); } catch(e) {}
    } catch {
      // silently fail on refresh
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    try {
      const response = await fetch(`${API}/chat/v2/links`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setChatLinks(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingLinks(false);
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
            if (lastMsg.text === '[BUZZ]') {
              playBuzzSound();
            } else {
              playNotificationSound();
            }
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
    if (showLinkModal) {
      fetchLinks();
    }
  }, [showLinkModal, fetchLinks]);

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

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;
    setCreatingGroup(true);
    try {
      const response = await fetch(`${API}/chat/v2/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          members: newGroupMembers,
          avatar: newGroupAvatar
        })
      });
      if (!response.ok) throw new Error();
      toast.success(isRtl ? 'تم إنشاء المجموعة بنجاح' : 'Group created successfully');
      setShowGroupModal(false);
      setNewGroupName('');
      setNewGroupMembers([]);
      setNewGroupAvatar(null);
      fetchContacts();
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء إنشاء المجموعة' : 'Error creating group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim() || editGroupMembers.length === 0) return;
    setUpdatingGroup(true);
    try {
      const response = await fetch(`${API}/chat/v2/groups/${selectedContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editGroupName.trim(),
          members: editGroupMembers,
          avatar: editGroupAvatar
        })
      });
      if (!response.ok) throw new Error();
      toast.success(isRtl ? 'تم تحديث المجموعة بنجاح' : 'Group updated successfully');
      setShowEditGroupModal(false);
      setSelectedContact(prev => ({...prev, name: editGroupName.trim(), members: editGroupMembers, avatar: editGroupAvatar || prev.avatar}));
      fetchContacts();
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تحديث المجموعة' : 'Error updating group');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد أنك تريد حذف هذه المجموعة نهائياً؟' : 'Are you sure you want to permanently delete this group?')) return;
    try {
      const response = await fetch(`${API}/chat/v2/groups/${selectedContact.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error();
      toast.success(isRtl ? 'تم حذف المجموعة بنجاح' : 'Group deleted successfully');
      setShowEditGroupModal(false);
      setSelectedContact(null);
      fetchContacts();
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء حذف المجموعة' : 'Error deleting group');
    }
  };

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
      window.dispatchEvent(new Event('updateBadges'));
      setEditingMessage(null);
      setInputText('');
      fetchMessages(selectedContact?.id, false);
    } catch (err) {
      toast.error(err.message || isRtl ? 'حدث خطأ أثناء تعديل الرسالة' : 'Error editing message');
    }
  };

  const [pendingAttachments, setPendingAttachments] = useState([]);

  const handleGroupAvatarUpload = async (e, setAvatarFunc) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingGroupAvatar(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const res = await fetch(`${API}/storage/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = data.storage_path.startsWith('http') ? data.storage_path : `${API}/storage/files/${encodeURIComponent(data.storage_path)}`;
      setAvatarFunc(url);
    } catch (err) {
      toast.error(isRtl ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploadingGroupAvatar(false);
    }
  };

  const handleSendMessage = async (imageUrl = null, customText = null) => {
    if (editingMessage) {
      await handleEditMessage(editingMessage.id);
      return;
    }

    if (!selectedContact) return;

    let textToSend = customText || inputText.trim();

    if (pendingAttachments.length > 0) {
      setUploadingImage(true);
      try {
        for (let i = 0; i < pendingAttachments.length; i++) {
          const attachment = pendingAttachments[i];
          const formData = new FormData();
          formData.append('file', attachment.file);
          
          const uploadRes = await fetch(`${API}/storage/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
          });
          
          if (!uploadRes.ok) throw new Error();
          const data = await uploadRes.json();
          let uploadedUrl = data.storage_path ? (data.storage_path.startsWith('http') ? data.storage_path : `${API}/storage/files/${encodeURIComponent(data.storage_path)}`) : data.url;
          
          const msgData = {
            receiver_id: selectedContact.id,
            text: i === 0 ? (textToSend || null) : null,
            image_url: uploadedUrl
          };
          
          await fetch(`${API}/chat/v2/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(msgData)
          });
        }
        
        setInputText('');
        setPendingAttachments([]);
        fetchMessages(selectedContact.id, true);
        return;
      } catch {
        toast.error(isRtl ? 'فشل رفع بعض المرفقات' : 'Failed to upload some attachments');
      } finally {
        setUploadingImage(false);
      }
    }

    if (!textToSend && !imageUrl) return;

    const msgData = {
      receiver_id: selectedContact.id,
      text: textToSend || null,
      image_url: imageUrl
    };

    try {
      setInputText('');
      const response = await fetch(`${API}/chat/v2/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(msgData)
      });
      if (!response.ok) throw new Error();
      fetchMessages(selectedContact.id, true);
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال الرسالة' : 'Error sending message');
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
      window.dispatchEvent(new Event('updateBadges'));
      
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
      window.dispatchEvent(new Event('updateBadges'));
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
          const targetSizeKB = 100;
          
          const tryCompress = (quality, maxDim) => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
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
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              const sizeKB = blob.size / 1024;
              if (sizeKB > targetSizeKB && quality > 0.1) {
                tryCompress(quality - 0.15, maxDim * 0.8);
              } else {
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                resolve(compressedFile);
              }
            }, 'image/jpeg', quality);
          };
          
          tryCompress(0.8, 1000);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLinkUsers = async (e) => {
    e.preventDefault();
    if (!linkUser1 || !linkUser2) {
      toast.error(isRtl ? 'يجب اختيار مستخدمين' : 'You must select two users');
      return;
    }
    if (linkUser1 === linkUser2) {
      toast.error(isRtl ? 'يجب اختيار مستخدمين مختلفين' : 'You must select different users');
      return;
    }
    setLinkLoading(true);
    try {
      const response = await fetch(`${API}/chat/v2/link-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_ids: [linkUser1, linkUser2] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error linking users');
      
      toast.success(isRtl ? 'تم ربط المستخدمين بنجاح' : 'Users linked successfully');
      setShowLinkModal(false);
      setLinkUser1('');
      setLinkUser2('');
      fetchContacts();
    } catch (error) {
      toast.error(error.message || (isRtl ? 'حدث خطأ أثناء الربط' : 'Error linking users'));
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkUsers = async () => {
    if (!linkUser1 || !linkUser2) {
      toast.error(isRtl ? 'يجب اختيار مستخدمين' : 'You must select two users');
      return;
    }
    if (linkUser1 === linkUser2) {
      toast.error(isRtl ? 'يجب اختيار مستخدمين مختلفين' : 'You must select different users');
      return;
    }
    setLinkLoading(true);
    try {
      const response = await fetch(`${API}/chat/v2/unlink-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_ids: [linkUser1, linkUser2] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error unlinking users');
      
      toast.success(isRtl ? 'تم إلغاء ربط المستخدمين بنجاح' : 'Users unlinked successfully');
      setShowLinkModal(false);
      setLinkUser1('');
      setLinkUser2('');
      fetchContacts();
    } catch (error) {
      toast.error(error.message || (isRtl ? 'حدث خطأ أثناء إلغاء الربط' : 'Error unlinking users'));
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkSpecificUsers = async (u1, u2) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من إلغاء الربط؟' : 'Are you sure you want to unlink?')) return;
    setLinkLoading(true);
    try {
      const response = await fetch(`${API}/chat/v2/unlink-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_ids: [u1, u2] })
      });
      if (!response.ok) throw new Error();
      toast.success(isRtl ? 'تم إلغاء الربط بنجاح' : 'Users unlinked successfully');
      fetchLinks();
      fetchContacts();
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء إلغاء الربط' : 'Error unlinking users');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingImage(true);
    try {
      const newAttachments = [];
      for (const file of files) {
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await compressImage(file);
        } else if (file.size > 100 * 1024 * 1024) {
          toast.error(isRtl ? 'حجم الملف يجب أن لا يتجاوز 100 ميجابايت' : 'File size must not exceed 100MB');
          continue;
        }

        const previewUrl = URL.createObjectURL(fileToUpload);
        newAttachments.push({ file: fileToUpload, previewUrl, type: file.type });
      }
      setPendingAttachments(prev => [...prev, ...newAttachments]);
    } catch {
      toast.error(isRtl ? 'فشل معالجة بعض الملفات' : 'Failed to process some files');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const safeDate = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return format(new Date(safeDate), 'hh:mm a', { locale });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const safeDate = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return format(new Date(safeDate), 'dd MMMM yyyy', { locale });
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
            ${selectedContact ? 'hidden md:flex md:w-96' : 'flex w-full md:w-96'}
          `}
        >
          {/* Header */}
          <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">{isRtl ? 'الدردشة الفورية' : 'Instant Chat'}</h2>
              <p className="text-xs text-gray-400">{isRtl ? 'محادثات آمنة ومشفرة 🔒' : 'Secure Encrypted Chats 🔒'}</p>
            </div>
            {/* Add Group Button */}
            {(user?.role === 'admin' || user?.can_create_subusers) && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowLinkModal(true)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shadow-sm border border-emerald-100 flex-shrink-0"
                  title={isRtl ? "ربط شخصين للتحدث المباشر" : "Link two users for direct chat"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </button>
                <button 
                  onClick={() => setShowGroupModal(true)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm border border-indigo-100 flex-shrink-0"
                  title={isRtl ? "إنشاء مجموعة جديدة" : "Create New Group"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
            )}
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
                  onClick={() => {
                    setSelectedContact(contact);
                    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread_count: 0 } : c));
                    window.dispatchEvent(new Event('updateBadges'));
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all text-right
                    ${selectedContact?.id === contact.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm'
                      : 'hover:bg-white border border-transparent hover:shadow-sm'}
                  `}
                >
                  <div className="relative flex-shrink-0">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {contact.is_group ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> : contact.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden text-right min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-800 truncate text-sm">{t(`common.${contact.name}`, { defaultValue: contact.name })}</div>
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
                {selectedContact.avatar ? (
                  <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                    {selectedContact.is_group ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> : t(`common.${selectedContact.name}`, { defaultValue: selectedContact.name })?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate">{t(`common.${selectedContact.name}`, { defaultValue: selectedContact.name })}</div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
                    {selectedContact.is_group 
                      ? (isRtl ? 'مجموعة دردشة آمنة' : 'Secure Group Chat')
                      : (isRtl ? 'محادثة خاصة ومشفرة' : 'Private encrypted conversation')}
                  </div>
                </div>
                {selectedContact.is_group && (
                  <button
                    onClick={() => {
                      setEditGroupName(selectedContact.name);
                      setEditGroupMembers(selectedContact.members || []);
                      setEditGroupAvatar(selectedContact.avatar || null);
                      setShowEditGroupModal(true);
                    }}
                    className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-full transition-all flex-shrink-0 shadow-sm border border-transparent hover:shadow-md mx-1"
                    title={isRtl ? "إدارة المجموعة والأعضاء" : "Manage Group & Members"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </button>
                )}
                {!selectedContact.is_group && (
                  <button
                    onClick={() => handleClearConversation(selectedContact.id)}
                    className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-all flex-shrink-0 shadow-sm border border-transparent hover:shadow-md"
                    title={isRtl ? "حذف جميع رسائل هذه المحادثة (من جهازك فقط، ستبقى لدى الطرف الآخر)" : "Clear conversation (from your device only)"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
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
                              <div className={`relative w-7 h-7 flex-shrink-0 ${!showAvatar ? 'opacity-0' : ''}`}>
                                {showAvatar && (
                                  selectedContact.avatar ? (
                                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-200" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                      {selectedContact.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                  )
                                )}
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
                                    {msg.text === '[BUZZ]' ? (
                                      <span className="flex items-center gap-2 font-bold text-amber-600 animate-pulse">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        {i18n.language === 'ar' ? 'أرسل تنبيهاً! (Buzz)' : 'Sent a Buzz!'}
                                      </span>
                                    ) : (
                                      msg.text
                                    )}
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
                
                {pendingAttachments.length > 0 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <div className="flex flex-wrap gap-3">
                      {pendingAttachments.map((att, idx) => (
                        <div key={idx} className="relative group inline-block">
                          {att.type.startsWith('image/') ? (
                            <img src={att.previewUrl} alt="Preview" className="h-20 w-auto rounded-lg object-contain shadow-sm border border-slate-300" />
                          ) : (
                            <div className="h-20 w-20 flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-slate-300">
                              <svg className="w-8 h-8 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              <span className="text-[10px] text-gray-500 truncate w-16 text-center">{att.file.name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 transition-all w-full focus-within:border-gray-200">

                  <div className="flex items-end gap-2 px-4 py-2">
                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={(!inputText.trim() && pendingAttachments.length === 0) || uploadingImage}
                      className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200
                        ${(inputText.trim() || pendingAttachments.length > 0)
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
                    multiple
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

                  <button
                    onClick={() => {
                      playBuzzSound();
                      handleSendMessage(null, '[BUZZ]');
                    }}
                    disabled={uploadingImage}
                    className={`p-2 rounded-full text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors flex-shrink-0 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isRtl ? "إرسال تنبيه صوتي (Buzz)" : "Send Buzz"}
                  >
                    <svg className="w-5 h-5 hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors flex-shrink-0 ${showEmojiPicker ? 'bg-gray-100 text-indigo-500' : ''}`}
                      title={isRtl ? "إضافة إيموجي" : "Add Emoji"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    
                    {showEmojiPicker && (
                      <div className={`absolute bottom-full ${isRtl ? 'left-0' : 'right-0'} mb-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-3 w-72 max-h-64 overflow-y-auto grid grid-cols-6 gap-1 z-50`}>
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setInputText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                              inputRef.current?.focus();
                            }}
                            className="text-2xl hover:bg-gray-50 hover:scale-110 p-2 rounded-lg transition-all text-center flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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

      {/* Edit Group Modal */}
      {showEditGroupModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                {isRtl ? 'إدارة المجموعة والأعضاء' : 'Manage Group & Members'}
              </h3>
              <button onClick={() => setShowEditGroupModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateGroup} className="p-4">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative group">
                  {editGroupAvatar ? (
                    <img src={editGroupAvatar} alt="Group Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                  )}
                  {user.id === selectedContact?.created_by && (
                    <label className={`absolute bottom-0 ${isRtl ? 'left-0' : 'right-0'} w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors`}>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGroupAvatarUpload(e, setEditGroupAvatar)} disabled={uploadingGroupAvatar} />
                      {uploadingGroupAvatar ? (
                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </label>
                  )}
                </div>
                {user.id === selectedContact?.created_by && (
                  <span className="text-xs text-gray-500 mt-2">{isRtl ? 'تغيير صورة المجموعة' : 'Change Group Picture'}</span>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">{isRtl ? 'اسم المجموعة' : 'Group Name'}</label>
                <input
                  type="text"
                  required
                  disabled={user.id !== selectedContact.created_by}
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRtl ? 'أعضاء المجموعة' : 'Group Members'}</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
                  {contacts.filter(c => !c.is_group).map(c => {
                    const isCreatorOrAdmin = user.id === selectedContact.created_by;
                    const isCheckboxDisabled = !isCreatorOrAdmin || c.id === user.id;
                    return (
                    <label key={c.id} className={`flex items-center gap-3 p-2 rounded transition-colors border border-transparent ${isCheckboxDisabled ? 'opacity-70' : 'hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={isCheckboxDisabled}
                        checked={editGroupMembers.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setEditGroupMembers([...editGroupMembers, c.id]);
                          else setEditGroupMembers(editGroupMembers.filter(id => id !== c.id));
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <div className="flex items-center gap-2">
                        {c.avatar ? (
                          <img src={c.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                            {c.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-800">{t(`common.${c.name}`, { defaultValue: c.name })} {c.id === user.id && (isRtl ? '(أنت)' : '(You)')}</span>
                      </div>
                    </label>
                  )})}
                </div>
              </div>
              <div className="flex gap-2 justify-end w-full">
                {user.id === selectedContact.created_by && (
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="px-4 py-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-lg transition-colors font-bold text-sm ml-0 mr-auto flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {isRtl ? 'حذف المجموعة' : 'Delete Group'}
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditGroupModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-bold text-sm"
                  >
                    {isRtl ? 'إغلاق' : 'Close'}
                  </button>
                  {user.id === selectedContact.created_by && (
                    <button
                    type="submit"
                    disabled={updatingGroup || !editGroupName.trim() || editGroupMembers.length === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors font-bold text-sm flex items-center gap-2 shadow-sm"
                  >
                    {updatingGroup ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    )}
                    {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {/* Link Users Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-4 border-b border-gray-100 bg-emerald-50 flex justify-between items-center">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                {isRtl ? 'ربط شخصين للدردشة المباشرة' : 'Link Users for Direct Chat'}
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleLinkUsers} className="p-5 space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                {isRtl ? 'حدد مستخدمين لربطهما معاً وتمكينهما من رؤية ومحادثة بعضهما البعض.' : 'Select two users to link them together, allowing them to see and chat with each other.'}
              </p>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{isRtl ? 'المستخدم الأول' : 'First User'}</label>
                <select
                  required
                  value={linkUser1}
                  onChange={(e) => setLinkUser1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                >
                  <option value="" disabled>{isRtl ? 'اختر مستخدماً...' : 'Select a user...'}</option>
                  <option value={user.id}>{isRtl ? 'أنا (نفسي)' : 'Me (Myself)'}</option>
                  {contacts.filter(c => !c.is_group).map(c => (
                    <option key={c.id} value={c.id}>{translateBrandingText(c.name, isRtl)}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center my-2">
                <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{isRtl ? 'المستخدم الثاني' : 'Second User'}</label>
                <select
                  required
                  value={linkUser2}
                  onChange={(e) => setLinkUser2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                >
                  <option value="" disabled>{isRtl ? 'اختر مستخدماً...' : 'Select a user...'}</option>
                  <option value={user.id}>{isRtl ? 'أنا (نفسي)' : 'Me (Myself)'}</option>
                  {contacts.filter(c => !c.is_group).map(c => (
                    <option key={c.id} value={c.id}>{translateBrandingText(c.name, isRtl)}</option>
                  ))}
                </select>
              </div>

              <div className="mt-2 mb-4">
                {loadingLinks ? (
                  <div className="flex justify-center p-2"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : chatLinks.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 px-1">
                      {isRtl ? 'الارتباطات الحالية:' : 'Current Links:'}
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                      {chatLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded-lg shadow-sm hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="font-bold text-emerald-700 truncate max-w-[100px]">{translateBrandingText(link.user1_name, isRtl)}</span>
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                            <span className="font-bold text-emerald-700 truncate max-w-[100px]">{translateBrandingText(link.user2_name, isRtl)}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleUnlinkSpecificUsers(link.user1_id, link.user2_id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title={isRtl ? 'إلغاء الربط' : 'Unlink'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="button" disabled={linkLoading} onClick={handleUnlinkUsers} className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 flex items-center gap-2">
                  {linkLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  )}
                  {isRtl ? 'إلغاء الربط' : 'Unlink'}
                </button>
                <button type="submit" disabled={linkLoading} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 flex items-center gap-2">
                  {linkLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  )}
                  {isRtl ? 'تأكيد الربط' : 'Confirm Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                {isRtl ? 'إنشاء مجموعة جديدة' : 'Create New Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-4">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative group">
                  {newGroupAvatar ? (
                    <img src={newGroupAvatar} alt="Group Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                  )}
                  <label className={`absolute bottom-0 ${isRtl ? 'left-0' : 'right-0'} w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors`}>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGroupAvatarUpload(e, setNewGroupAvatar)} disabled={uploadingGroupAvatar} />
                    {uploadingGroupAvatar ? (
                      <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </label>
                </div>
                <span className="text-xs text-gray-500 mt-2">{isRtl ? 'صورة المجموعة (اختياري)' : 'Group Picture (Optional)'}</span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">{isRtl ? 'اسم المجموعة' : 'Group Name'}</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder={isRtl ? 'أدخل اسم المجموعة...' : 'Enter group name...'}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRtl ? 'اختيار الأعضاء' : 'Select Members'}</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
                  {contacts.filter(c => !c.is_group).map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                      <input
                        type="checkbox"
                        checked={newGroupMembers.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewGroupMembers([...newGroupMembers, c.id]);
                          else setNewGroupMembers(newGroupMembers.filter(id => id !== c.id));
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        {c.avatar ? (
                          <img src={c.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                            {c.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-800">{t(`common.${c.name}`, { defaultValue: c.name })}</span>
                      </div>
                    </label>
                  ))}
                  {contacts.filter(c => !c.is_group).length === 0 && (
                    <div className="text-center text-gray-500 text-sm p-4">{isRtl ? 'لا يوجد أعضاء متاحين.' : 'No members available.'}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-bold text-sm"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroupName.trim() || newGroupMembers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors font-bold text-sm flex items-center gap-2 shadow-sm"
                >
                  {creatingGroup ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  )}
                  {isRtl ? 'إنشاء' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Chat;
