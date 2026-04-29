import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded, onChildChanged, onChildRemoved, set, onValue, update, remove, get, onDisconnect } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyDNfkk58ypA9gB-tck-LGvqQj6Ykx7B5UU",
  authDomain: "stogramm-4714f.firebaseapp.com",
  databaseURL: "https://stogramm-4714f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stogramm-4714f",
  storageBucket: "stogramm-4714f.firebasestorage.app",
  messagingSenderId: "419607284431",
  appId: "1:419607284431:web:9b60588531e711373e85ba"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

function App() {
  const [recordingTime, setRecordingTime] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unreadChats, setUnreadChats] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [profileImage, setProfileImage] = useState(null);
  const [chatBackground, setChatBackground] = useState('#0f0f0f');
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [groupMembers, setGroupMembers] = useState(null);
  const [typingStatus, setTypingStatus] = useState({});
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('#ff6b6b');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [contextMenuState, setContextMenuState] = useState({ visible: false, x: 0, y: 0, messageId: null, text: null, isOwn: false });
  const [chatMenuState, setChatMenuState] = useState({ visible: false, x: 0, y: 0, chatId: null, chatName: null });
  const [iconColor, setIconColor] = useState('#ffffff');
  const [chatTransition, setChatTransition] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [defaultReaction, setDefaultReaction] = useState('❤️');
  const [reactions, setReactions] = useState({});
  const [showPlusButton, setShowPlusButton] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [userDescription, setUserDescription] = useState('');
  const [userLanguage, setUserLanguage] = useState('ru');
  const [profileSection, setProfileSection] = useState('main');
  const [privacySettings, setPrivacySettings] = useState({
    hideLastSeen: false,
    hideAvatar: false,
    hideDescription: false
  });

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchMoveX, setTouchMoveX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [touchStartChat, setTouchStartChat] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgFileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const messagesListenerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingListenerRef = useRef(null);
  const sendingRef = useRef(false);
  const contextMenuRef = useRef(null);
  const chatListRef = useRef(null);
  const swipeTrackRef = useRef(null);

  const tabs = ['chats', 'profile', 'groups'];
  const currentTabIndex = tabs.indexOf(activeTab);

  const themes = {
    dark: { bg: '#0f0f0f', cardBg: '#1a1a1a', text: '#ffffff', border: '#2c2c2c', name: 'Тёмная' },
    light: { bg: '#f5f5f5', cardBg: '#ffffff', text: '#1a1a1a', border: '#e0e0e0', name: 'Светлая' },
    gray: { bg: '#1e1e1e', cardBg: '#2a2a2a', text: '#e0e0e0', border: '#3a3a3a', name: 'Серая' }
  };

  const accentColors = [
    { name: 'Красный', value: '#ff6b6b' },
    { name: 'Синий', value: '#4d9eff' },
    { name: 'Зелёный', value: '#4caf50' },
    { name: 'Фиолетовый', value: '#9c27b0' },
    { name: 'Оранжевый', value: '#ff9800' },
    { name: 'Розовый', value: '#e91e63' }
  ];

  const iconColors = [
    { name: 'Белый', value: '#ffffff' },
    { name: 'Золотой', value: '#ffd700' },
    { name: 'Голубой', value: '#00bcd4' },
    { name: 'Лайм', value: '#cddc39' },
    { name: 'Коралловый', value: '#ff7f50' },
    { name: 'Мятный', value: '#00ff7f' }
  ];

  const availableReactions = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯'];

  const languages = [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' }
  ];

  const translations = {
    ru: {
      chats: 'Чаты', profile: 'Профиль', groups: 'Группы',
      online: 'онлайн', typing: 'печатает...',
      edit: '✏️ Изменить', delete: '🗑️ Удалить', cancel: '✖ Отмена',
      send: 'Отправить', message: 'Сообщение...', editMsg: 'Измените...',
      login: '📧 Войти', register: '📧 Зарегистрироваться', logout: '🚪 Выйти',
      noAccount: 'Нет аккаунта? Зарегистрироваться', hasAccount: 'Уже есть аккаунт? Войти',
      noChats: '📭 Нет диалогов', findUser: 'Найти пользователя', searchUser: 'Поиск пользователей',
      createGroup: 'Создать группу', groupName: 'Название',
      members: 'участников', create: '➕ Создать',
      bgChat: 'Фон чата', theme: 'Тема', accent: 'Цвет акцента',
      iconColor: 'Цвет иконок', reaction: 'Реакция по умолчанию',
      doubleTap: 'Двойное нажатие поставит эту реакцию',
      language: 'Язык', privacy: 'Конфиденциальность',
      hideLastSeen: 'Скрыть время захода',
      hideAvatar: 'Скрыть аватарку',
      hideDescription: 'Скрыть описание',
      description: 'Описание',
      save: 'Сохранить',
      wasRecently: 'был', minAgo: 'мин назад', hourAgo: 'ч назад', dayAgo: 'дн назад',
      edited: '(изменено)', participants: 'Участники', close: 'Закрыть',
      deleteChat: 'Удалить чат', createGroupTitle: 'Создать группу',
      selectMembers: 'Выберите участников', downloadApp: '📱 Скачать приложение',
      settings: 'Настройки чата', customBg: '🖼️ Своё',
      back: '← Назад'
    },
    en: {
      chats: 'Chats', profile: 'Profile', groups: 'Groups',
      online: 'online', typing: 'typing...',
      edit: '✏️ Edit', delete: '🗑️ Delete', cancel: '✖ Cancel',
      send: 'Send', message: 'Message...', editMsg: 'Edit...',
      login: '📧 Login', register: '📧 Register', logout: '🚪 Logout',
      noAccount: 'No account? Register', hasAccount: 'Have account? Login',
      noChats: '📭 No chats', findUser: 'Find user', searchUser: 'Search users',
      createGroup: 'Create group', groupName: 'Name',
      members: 'members', create: '➕ Create',
      bgChat: 'Chat background', theme: 'Theme', accent: 'Accent color',
      iconColor: 'Icon color', reaction: 'Default reaction',
      doubleTap: 'Double tap sets this reaction',
      language: 'Language', privacy: 'Privacy',
      hideLastSeen: 'Hide last seen', hideAvatar: 'Hide avatar',
      hideDescription: 'Hide description',
      description: 'Description', save: 'Save',
      wasRecently: 'was', minAgo: 'min ago', hourAgo: 'h ago', dayAgo: 'd ago',
      edited: '(edited)', participants: 'Participants', close: 'Close',
      deleteChat: 'Delete chat', createGroupTitle: 'Create Group',
      selectMembers: 'Select members', downloadApp: '📱 Download App',
      settings: 'Chat Settings', customBg: '🖼️ Custom',
      back: '← Back'
    }
  };

  const t = translations[userLanguage] || translations.ru;

  useEffect(() => {
    const savedUser = localStorage.getItem('stogramm_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({ uid: parsed.uid, name: parsed.name, email: parsed.email });
      loadChats(parsed.name);
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser({ uid: firebaseUser.uid, name: userData.username, email: firebaseUser.email });
          if (userData.description) setUserDescription(userData.description);
          if (userData.language) setUserLanguage(userData.language);
          if (userData.privacySettings) setPrivacySettings(userData.privacySettings);
          localStorage.setItem('stogramm_user', JSON.stringify({ uid: firebaseUser.uid, name: userData.username, email: firebaseUser.email }));
          const statusRef = ref(db, `status/${userData.username}`);
          await set(statusRef, { online: true, lastSeen: Date.now() });
          onDisconnect(statusRef).set({ online: false, lastSeen: Date.now() });
          loadChats(userData.username);
          if (userData.defaultReaction) setDefaultReaction(userData.defaultReaction);
        } else {
          setShowUsernamePrompt(true);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        if (!localStorage.getItem('stogramm_user')) setUser(null);
        setShowUsernamePrompt(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const statusRef = ref(db, 'status');
      const unsub = onValue(statusRef, (snap) => setOnlineUsers(snap.val() || {}));
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (currentChat && user && messages.length > 0) {
      update(ref(db, `readReceipts/${currentChat.id}/${user.name}`), { readAt: Date.now(), lastReadId: messages[messages.length - 1].id });
    }
  }, [messages, currentChat, user]);

  useEffect(() => {
    if (currentChat) {
      const unsub = onValue(ref(db, `readReceipts/${currentChat.id}`), (snap) => setReadReceipts(snap.val() || {}));
      const reactionsUnsub = onValue(ref(db, `reactions/${currentChat.id}`), (snap) => setReactions(snap.val() || {}));
      return () => { unsub(); reactionsUnsub(); };
    }
  }, [currentChat]);

  useEffect(() => {
    if (user && !showUsernamePrompt) {  
      const savedTheme = localStorage.getItem(`theme_${user.uid}`);
      const savedAccent = localStorage.getItem(`accent_${user.uid}`); 
      const savedIconColor = localStorage.getItem(`icon_${user.uid}`);
      if (savedTheme) setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedIconColor) setIconColor(savedIconColor);
      const savedBg = localStorage.getItem(`chat_bg_${user.uid}`);
      if (savedBg && savedBg !== 'undefined' && savedBg !== '#0f0f0f') setChatBackground(savedBg);
      loadProfileImage();
    }
  }, [user, showUsernamePrompt, loadProfileImage]);

  useEffect(() => { if (user) loadUnreadStatus(); }, [user, chats, loadUnreadStatus]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuState.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null, isOwn: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('touchstart', handleClickOutside); };
  }, [contextMenuState.visible]);

  const loadProfileImage = useCallback(async () => {
    if (!user) return;
    const snap = await get(ref(db, `users/${user.uid}/avatar`));
    if (snap.exists()) setProfileImage(snap.val());
  }, [user]);

const loadUnreadStatus = useCallback(() => {
    if (!user) return;
    const u = {};
    chats.forEach(c => {
      const last = parseInt(localStorage.getItem(`lastRead_${user.name}_${c.id}`) || '0');
      if ((c.timestamp || 0) > last && c.lastMessageSender && c.lastMessageSender !== user.name) u[c.id] = true;
    });
    setUnreadChats(u);
  }, [user, chats]);

  const changeTheme = (th) => { setTheme(th); localStorage.setItem(`theme_${user?.uid}`, th); };
  const changeAccent = (c) => { setAccentColor(c); localStorage.setItem(`accent_${user?.uid}`, c); };
  const changeIconColor = (c) => { setIconColor(c); localStorage.setItem(`icon_${user?.uid}`, c); };
  const getChatId = (u1, u2) => [u1, u2].sort().join('_');
  const getGroupId = () => 'group_' + Date.now();

  const scrollToBottom = (force = false) => {
    setTimeout(() => {
      const el = messagesContainerRef.current;
      if (el) {
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (force || near) el.scrollTop = el.scrollHeight;
      }
    }, 100);
  };

  const handleInputFocus = () => scrollToBottom(true);
  const focusInput = () => setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); scrollToBottom(true); } }, 100);

  

  // Плавный свайп с отслеживанием пальца
  const handleSwipeStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setSwiping(true);
  };
  
  const handleSwipeMove = (e) => {
    if (!swiping) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    setTouchMoveX(deltaX);
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
      e.preventDefault();
      if (swipeTrackRef.current) {
        const baseTranslate = -currentTabIndex * window.innerWidth;
        const newTranslate = baseTranslate + deltaX;
        swipeTrackRef.current.style.transition = 'none';
        swipeTrackRef.current.style.transform = `translateX(${newTranslate}px)`;
      }
    }
  };
  
  const handleSwipeEnd = (e) => {
    if (!swiping) return;
    setSwiping(false);
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentTabIndex > 0) setActiveTab(tabs[currentTabIndex - 1]);
      else if (deltaX < 0 && currentTabIndex < tabs.length - 1) setActiveTab(tabs[currentTabIndex + 1]);
    }
    if (swipeTrackRef.current) {
      swipeTrackRef.current.style.transition = 'transform 0.3s ease';
      swipeTrackRef.current.style.transform = `translateX(-${currentTabIndex * 100}%)`;
    }
  };

  // Свайп для выхода из экранов (поиск, настройки и т.д.)
  const handleBackSwipe = (e, callback) => {
    const endX = e.changedTouches[0].clientX;
    if (endX - touchStartChat > 70) {
      callback();
    }
  };

  const handleChatTouchStart = (e) => setTouchStartChat(e.touches[0].clientX);
  const handleChatTouchEnd = (e) => { if (e.changedTouches[0].clientX - touchStartChat > 70) closeChat(); };

  const handleBgUpload = (e) => {
    const f = e.target.files[0];
    if (f) { 
      try {
        const r = new FileReader(); 
        r.onloadend = () => { 
          const bg = r.result;
          setChatBackground(bg); 
          localStorage.setItem(`chat_bg_${user.uid}`, bg); 
          window.alert('Фон чата обновлён!');
        }; 
        r.readAsDataURL(f);
      } catch (err) {
        window.alert('Ошибка загрузки фона');
      }
    }
  };

 const handleImageUpload = async (e) => {
    const f = e.target.files[0];
    if (f && user) {
      try {
        // Показываем локально сразу
        setProfileImage(URL.createObjectURL(f));
        
        // Загружаем в Storage
        const avatarRef = storageRef(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarRef, f);
        const downloadUrl = await getDownloadURL(avatarRef);
        
        // Сохраняем URL в базе
        await set(ref(db, `users/${user.uid}/avatar`), downloadUrl);
        
        // Обновляем локально
        setProfileImage(downloadUrl);
        window.alert('Аватарка обновлена!');
      } catch (err) {
        console.error('Ошибка загрузки аватарки:', err);
        window.alert('Ошибка: ' + err.message);
      }
    }
  };

const sendPhoto = async (file) => {
    if (!currentChat || !user) {
      window.alert('Откройте чат');
      return;
    }
    
    const IMGBB_API_KEY = '07cad95a42b3b5bea0b29d211b32f60e';
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        await push(ref(db, `messages/${currentChat.id}`), {
          type: 'photo',
          photoUrl: data.data.url,
          sender: user.name,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        });
        
        await update(ref(db, `chats/${currentChat.id}`), { 
          lastMessage: '📷 Фото', 
          updatedAt: Date.now(), 
          lastMessageSender: user.name 
        });
        
        scrollToBottom(true);
      } else {
        window.alert('Ошибка загрузки фото');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      window.alert('Ошибка отправки фото');
    }
  };
    
    

  const getAvailableMembers = () => {
    const s = new Set();
    chats.forEach(c => {
      if (c.type === 'private') s.add(c.name);
      else if (c.members) c.members.forEach(m => s.add(m));
    });
    s.delete(user.name);
    return [...s];
  };

  const showChatMenu = (e, chatId, chatName) => {
    e.preventDefault(); e.stopPropagation();
    setChatMenuState({ visible: true, x: e.clientX, y: e.clientY, chatId, chatName });
  };

  const deleteChat = async (chatId, chatName) => {
    if (window.confirm(`Удалить чат с ${chatName}?`)) {
      await remove(ref(db, `messages/${chatId}`));
      await remove(ref(db, `chats/${chatId}`));
      await remove(ref(db, `reactions/${chatId}`));
      if (currentChat?.id === chatId) closeChat();
      loadChats(user.name);
    }
    setChatMenuState({ visible: false, x: 0, y: 0, chatId: null, chatName: null });
  };

  useEffect(() => {
    const h = (e) => { if (chatMenuState.visible && !e.target.closest('.context-menu')) setChatMenuState({ visible: false, x: 0, y: 0, chatId: null, chatName: null }); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [chatMenuState.visible]);

  const sendTypingStart = async () => {
    if (!currentChat) return;
    await set(ref(db, `typing/${currentChat.id}/${user.name}`), true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => { await remove(ref(db, `typing/${currentChat.id}/${user.name}`)); }, 2000);
  };

  const listenForTyping = (chatId) => {
    if (typingListenerRef.current) typingListenerRef.current();
    const unsub = onValue(ref(db, `typing/${chatId}`), (snap) => {
      const t = snap.val() || {};
      setTypingStatus(prev => ({ ...prev, [chatId]: Object.keys(t).filter(u => u !== user?.name) }));
    });
    typingListenerRef.current = unsub;
  };

  const loadChats = (name) => {
    onValue(ref(db, 'chats'), (snap) => {
      const all = snap.val() || {};
      const mine = [];
      for (let id in all) {
        const c = all[id];
        if (c.type === 'group' && c.members && c.members.includes(name)) {
          mine.push({ id, name: c.name, type: 'group', lastMessage: c.lastMessage || '', members: c.members, createdBy: c.createdBy, timestamp: c.updatedAt || 0, lastMessageSender: c.lastMessageSender || '' });
        } else if (id.includes(name)) {
          const comp = id.replace(name + '_', '').replace('_' + name, '');
          mine.push({ id, name: comp, type: 'private', lastMessage: c.lastMessage || '', timestamp: c.updatedAt || 0, lastMessageSender: c.lastMessageSender || '' });
        }
      }
      mine.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setChats(mine);
    });
  };

  const closeChat = () => {
    setChatTransition(true);
    setTimeout(() => {
      if (messagesListenerRef.current) { messagesListenerRef.current(); messagesListenerRef.current = null; }
      if (typingListenerRef.current) { typingListenerRef.current(); typingListenerRef.current = null; }
      setCurrentChat(null); setMessages([]); setInput(''); setEditingMessage(null); setChatTransition(false);
    }, 300);
  };

  const openChat = async (chatId, chatName, type = 'private', createdBy = null, members = null) => {
    if (currentChat?.id === chatId) return;
    if (messagesListenerRef.current) { messagesListenerRef.current(); messagesListenerRef.current = null; }
    const snap = await get(ref(db, `chats/${chatId}`));
    if (!snap.exists() && type === 'private') await set(ref(db, `chats/${chatId}`), { type: 'private', lastMessage: 'Нет сообщений', updatedAt: Date.now() });
    localStorage.setItem(`lastRead_${user.name}_${chatId}`, Date.now().toString());
    setUnreadChats(prev => { const n = { ...prev }; delete n[chatId]; return n; });
    setCurrentChat({ id: chatId, name: chatName, type, createdBy, members });
    setMessages([]); setInput(''); setEditingMessage(null); setReactions({});
    listenForTyping(chatId);
    const msgRef = ref(db, `messages/${chatId}`);
    const a = onChildAdded(msgRef, (s) => { setMessages(prev => prev.some(m => m.id === s.key) ? prev : [...prev, { id: s.key, ...s.val() }]); scrollToBottom(true); });
    const c = onChildChanged(msgRef, (s) => setMessages(prev => prev.map(m => m.id === s.key ? { ...m, ...s.val() } : m)));
    const r = onChildRemoved(msgRef, (s) => setMessages(prev => prev.filter(m => m.id !== s.key)));
    messagesListenerRef.current = () => { a(); c(); r(); };
    focusInput(); scrollToBottom(true);
  };

  const showGroupMembers = () => {
    if (currentChat?.type === 'group' && currentChat.members) {
      setGroupMembers(currentChat.members);
      setTimeout(() => setGroupMembers(null), 5000);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || sendingRef.current) return;
    sendingRef.current = true;
    try {
      if (editingMessage) {
        await update(ref(db, `messages/${currentChat.id}/${editingMessage.id}`), { text: input, edited: true });
        setEditingMessage(null); setInput(''); focusInput(); return;
      }
      const now = Date.now();
      await push(ref(db, `messages/${currentChat.id}`), { text: input, sender: user.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: now, edited: false });
      await update(ref(db, `chats/${currentChat.id}`), { lastMessage: input, updatedAt: now, lastMessageSender: user.name });
      localStorage.setItem(`lastRead_${user.name}_${currentChat.id}`, now.toString());
      setInput(''); focusInput();
    } finally { setTimeout(() => { sendingRef.current = false; }, 300); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim().length > 0) sendTypingStart();
  };

  const searchAndAddUser = async () => {
    const q = searchQuery.trim();
    if (!q) { window.alert('Введите имя'); return; }
    if (q === user?.name) { window.alert('Нельзя добавить себя'); return; }
    const users = (await get(ref(db, 'users'))).val() || {};
    const found = Object.entries(users).find(([, d]) => d.username === q);
    if (found) {
      const cid = getChatId(user.name, q);
      if (!(await get(ref(db, `chats/${cid}`))).exists()) await set(ref(db, `chats/${cid}`), { type: 'private', lastMessage: 'Нет сообщений', updatedAt: Date.now() });
      openChat(cid, q, 'private'); setActiveTab('chats'); setSearchQuery('');
    } else window.alert(`"${q}" не найден`);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !selectedMembers.length) { window.alert('Введите название и выберите участников'); return; }
    await set(ref(db, `chats/${getGroupId()}`), { type: 'group', name: newGroupName, members: [user.name, ...selectedMembers], createdBy: user.name, createdAt: Date.now(), lastMessage: 'Группа создана', updatedAt: Date.now() });
    setNewGroupName(''); setSelectedMembers([]); loadChats(user.name); setActiveTab('chats');
  };

  const register = async () => {
    if (!email || !password || !username) { window.alert('Заполните все поля'); return; }
    if (password.length < 6) { window.alert('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      const uc = await createUserWithEmailAndPassword(auth, email, password);
      await set(ref(db, `users/${uc.user.uid}`), { username: username.trim(), email, createdAt: Date.now(), defaultReaction: '❤️' });
      window.alert('Успешно!');
    } catch (e) { window.alert(e.code === 'auth/email-already-in-use' ? 'Email занят' : 'Ошибка'); }
    setLoading(false);
  };

  const login = async () => {
    if (!email || !password) { window.alert('Введите email и пароль'); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { window.alert('Неверный email или пароль'); }
    setLoading(false);
  };

  const saveUsername = async () => {
    if (!username.trim() || username.trim().length < 3) { window.alert('Минимум 3 символа'); return; }
    setLoading(true);
    try {
      const users = (await get(ref(db, 'users'))).val() || {};
      if (Object.values(users).some(u => u.username === username.trim())) { window.alert('Имя занято'); setLoading(false); return; }
      await set(ref(db, `users/${user.uid}`), { username: username.trim(), email: user.email, createdAt: Date.now(), defaultReaction: '❤️' });
      setUser(prev => ({ ...prev, name: username.trim() })); setShowUsernamePrompt(false); loadChats(username.trim());
    } catch { window.alert('Ошибка'); }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Выйти?')) {
      if (user) await set(ref(db, `status/${user.name}`), { online: false, lastSeen: Date.now() });
      localStorage.removeItem('stogramm_user');
      await signOut(auth); localStorage.clear(); setUser(null);
    }
  };

  const startEditing = (messageId, currentText) => {
    setInput(currentText); setEditingMessage({ id: messageId });
    setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null, isOwn: false });
    focusInput();
  };

  const cancelEditing = () => { setEditingMessage(null); setInput(''); };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Удалить?')) {
      await remove(ref(db, `messages/${currentChat.id}/${messageId}`));
      const messagesSnap = await get(ref(db, `messages/${currentChat.id}`));
      const msgs = messagesSnap.val() || {};
      const msgArr = Object.values(msgs).sort((a, b) => b.timestamp - a.timestamp);
      const lastMsg = msgArr[0];
      await update(ref(db, `chats/${currentChat.id}`), { 
        lastMessage: lastMsg ? (lastMsg.text || '📷 Фото') : 'Нет сообщений',
        lastMessageSender: lastMsg ? lastMsg.sender : '',
        updatedAt: lastMsg ? lastMsg.timestamp : Date.now()
      });
    }
    setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null, isOwn: false });
  };

  const handleReaction = async (messageId, reaction) => {
    if (!currentChat || !user) return;
    const reactionRef = ref(db, `reactions/${currentChat.id}/${messageId}/${user.name}`);
    const existingSnap = await get(reactionRef);
    if (existingSnap.exists() && existingSnap.val() === reaction) {
      await remove(reactionRef);
    } else {
      await set(reactionRef, reaction);
    }
    setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null, isOwn: false });
  };

  const showOwnMessageMenu = (e, messageId, text) => {
    e.preventDefault(); e.stopPropagation();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setContextMenuState({ visible: true, x, y, messageId, text, isOwn: true });
  };

  const showReactionMenu = (e, messageId) => {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (now - lastTap < 300) { setLastTap(0); handleReaction(messageId, defaultReaction); return; }
    setLastTap(now);
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setContextMenuState({ visible: true, x, y, messageId, text: null, isOwn: false });
  };

  const isMessageRead = (msg) => {
    if (!currentChat || msg.sender !== user.name) return false;
    if (currentChat.type === 'private') {
      const receipt = readReceipts[currentChat.name];
      return receipt && receipt.lastReadId && msg.id <= receipt.lastReadId;
    }
    if (currentChat.type === 'group' && currentChat.members) {
      return currentChat.members.some(m => { if (m === user.name) return false; const receipt = readReceipts[m]; return receipt && receipt.lastReadId && msg.id <= receipt.lastReadId; });
    }
    return false;
  };

  const getMessageReactions = (messageId) => {
    const msgReactions = reactions[messageId] || {};
    const counts = {};
    Object.values(msgReactions).forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    return counts;
  };

  const saveDefaultReaction = async (reaction) => { setDefaultReaction(reaction); if (user) await update(ref(db, `users/${user.uid}`), { defaultReaction: reaction }); };
  const saveLanguage = async (lang) => { setUserLanguage(lang); if (user) await update(ref(db, `users/${user.uid}`), { language: lang }); };
  const saveDescription = async (desc) => { 
    setUserDescription(desc);
    if (user) await update(ref(db, `users/${user.uid}`), { description: desc }); 
  };
  const savePrivacySettings = async () => { if (user) { await update(ref(db, `users/${user.uid}`), { privacySettings }); setProfileSection('main'); } };

 const formatLastSeen = (username) => {
    const userStatus = onlineUsers[username];
    if (!userStatus) return '';
    
    // Получаем настройки приватности пользователя
    const userPrivacy = privacySettings;
    
    if (userPrivacy.hideLastSeen) return t.offline;
    if (userStatus.online) return t.online;
    if (!userStatus.lastSeen) return t.offline;
    
    const diff = Date.now() - userStatus.lastSeen;
    if (diff < 60000) return `${t.wasRecently} ${t.online}`;
    if (diff < 3600000) return `${t.wasRecently} ${Math.floor(diff / 60000)} ${t.minAgo}`;
    if (diff < 86400000) return `${t.wasRecently} ${Math.floor(diff / 3600000)} ${t.hourAgo}`;
    return `${t.wasRecently} ${Math.floor(diff / 86400000)} ${t.dayAgo}`;
  };

  const isUserOnline = (username) => {
    if (privacySettings.hideLastSeen) return false;
    return onlineUsers[username]?.online || false;
  };

  const viewUserProfile = async (username) => {
    const usersSnap = await get(ref(db, 'users'));
    const users = usersSnap.val() || {};
    const foundUser = Object.values(users).find(u => u.username === username);
    if (foundUser) setViewedProfile({ username, ...foundUser });
  };

  const handleScrollChats = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop > lastScrollTop + 15) {
      // Скроллим вниз - показываем кнопку
      setShowPlusButton(true);
    } else if (scrollTop < lastScrollTop - 5) {
      // Скроллим вверх - скрываем кнопку
      setShowPlusButton(false);
    }
    setLastScrollTop(scrollTop);
  };

  const currentTheme = themes[theme];

  if (authLoading) {
    return (
      <div className="auth" style={{ background: currentTheme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}><h2 style={{ color: iconColor, fontSize: 32 }}>StoGramm</h2></div>
      </div>
    );
  }

  if (user && showUsernamePrompt) {
    return (
      <div className="auth" style={{ background: currentTheme.bg }}>
        <div className="auth-box" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, width: 320 }}>
          <h2 style={{ fontSize: 32, background: `linear-gradient(135deg, ${iconColor}, ${accentColor})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', marginBottom: 20 }}>StoGramm</h2>
          <p style={{ color: currentTheme.text + '99', marginBottom: 20, fontSize: 14 }}>Email {user.email} подтверждён ✅<br/>Придумайте имя:</p>
          <input type="text" placeholder="Имя" value={username} onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} autoFocus />
          <button onClick={saveUsername} disabled={loading}
            style={{ width: '100%', padding: 14, marginTop: 16, background: loading ? currentTheme.border : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 28, color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '...' : 'Продолжить'}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth" style={{ background: currentTheme.bg }}>
        <div className="auth-box" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, width: 320 }}>
          <h2 style={{ fontSize: 32, background: `linear-gradient(135deg, ${iconColor}, ${accentColor})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', marginBottom: 20 }}>StoGramm</h2>
          {isLogin ? (
            <>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <button onClick={login} disabled={loading}
                style={{ width: '100%', padding: 14, marginTop: 16, background: loading ? currentTheme.border : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 28, color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '...' : t.login}
              </button>
              <p onClick={() => setIsLogin(false)} style={{ marginTop: 16, color: accentColor, cursor: 'pointer', fontSize: 14, textAlign: 'center' }}>{t.noAccount}</p>
            </>
          ) : (
            <>
              <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <input type="password" placeholder="Пароль (мин. 6)" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <button onClick={register} disabled={loading}
                style={{ width: '100%', padding: 14, marginTop: 16, background: loading ? currentTheme.border : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 28, color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '...' : t.register}
              </button>
              <p onClick={() => setIsLogin(true)} style={{ marginTop: 16, color: accentColor, cursor: 'pointer', fontSize: 14, textAlign: 'center' }}>{t.hasAccount}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (viewedProfile) {
    return (
      <div className="chat-screen" style={{ background: currentTheme.bg }}
        onTouchStart={handleChatTouchStart}
        onTouchEnd={(e) => handleBackSwipe(e, () => setViewedProfile(null))}>
        <div className="chat-header" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
          <button className="back-btn" onClick={() => setViewedProfile(null)} style={{ color: accentColor }}>←</button>
          <span style={{ color: iconColor, fontWeight: 'bold' }}>{viewedProfile.username}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: currentTheme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {viewedProfile.avatar ? <img src={viewedProfile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 50, color: accentColor }}>{viewedProfile.username?.charAt(0).toUpperCase()}</span>}
          </div>
          <h2 style={{ color: iconColor }}>{viewedProfile.username}</h2>
          {viewedProfile.description && <p style={{ color: currentTheme.text + '99', textAlign: 'center' }}>{viewedProfile.description}</p>}
          <p style={{ color: isUserOnline(viewedProfile.username) ? '#4caf50' : currentTheme.text + '99' }}>
            {isUserOnline(viewedProfile.username) ? t.online : formatLastSeen(viewedProfile.username)}
          </p>
          {viewedProfile.username !== user.name && (
            <button onClick={async () => {
              const cid = getChatId(user.name, viewedProfile.username);
              if (!(await get(ref(db, `chats/${cid}`))).exists()) await set(ref(db, `chats/${cid}`), { type: 'private', lastMessage: 'Нет сообщений', updatedAt: Date.now() });
              openChat(cid, viewedProfile.username, 'private'); setViewedProfile(null); setActiveTab('chats');
            }}
            style={{ padding: '12px 30px', background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 30, color: '#fff', fontSize: 16, cursor: 'pointer' }}>💬 Написать</button>
          )}
        </div>
      </div>
    );
  }

  if (currentChat) {
    const typingUsers = typingStatus[currentChat.id] || [];
    const typingText = typingUsers.length > 0 ? `${typingUsers.join(', ')} ${t.typing}` : '';
    const companionStatus = currentChat.type === 'private' ? onlineUsers[currentChat.name] : null;
    const isOnline = isUserOnline(currentChat.name);
    
    return (
      <div className="chat-screen" style={{ 
        background: chatBackground, 
        animation: 'chatSlideIn 0.3s ease',
        transform: chatTransition ? 'translateX(100%)' : 'translateX(0)',
        opacity: chatTransition ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease'
      }} onTouchStart={handleChatTouchStart} onTouchEnd={handleChatTouchEnd}>
        <div className="chat-header" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
          <button className="back-btn" onClick={closeChat} style={{ color: accentColor }}>←</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }}
            onClick={() => currentChat.type === 'private' && viewUserProfile(currentChat.name)}>
            <span style={{ color: iconColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
              {currentChat.name}
              {isOnline && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#4caf50', display: 'inline-block' }}></span>}
              {currentChat.type === 'group' && ' 👥'}
            </span>
            {currentChat.type === 'private' && companionStatus && (
              <span style={{ fontSize: 11, color: isOnline ? '#4caf50' : currentTheme.text + '99' }}>{isOnline ? t.online : formatLastSeen(currentChat.name)}</span>
            )}
            {currentChat.type === 'group' && <span style={{ fontSize: 11, color: currentTheme.text + '99' }}>{currentChat.members?.length || 0} {t.members}</span>}
          </div>
        </div>
        {typingText && <div className="typing-indicator" style={{ color: accentColor }}>{typingText}</div>}
        {editingMessage && (
          <div className="editing-panel" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
            <span style={{ color: accentColor }}>{t.edit}</span>
            <button onClick={cancelEditing} style={{ color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}>{t.cancel}</button>
          </div>
        )}
        <div className="messages" ref={messagesContainerRef} style={{ paddingBottom: 20 }}>
  {messages.map(msg => {
    const isSent = msg.sender === user.name;
    const read = isMessageRead(msg);
    const msgReactions = getMessageReactions(msg.id);
    return (
      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
        <div className={`message ${isSent ? 'sent' : 'received'} ${msg.edited ? 'edited' : ''}`}
          onClick={(e) => { e.stopPropagation(); if (isSent) showOwnMessageMenu(e, msg.id, msg.text); else showReactionMenu(e, msg.id); }}
          style={isSent ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none' } : { background: `${currentTheme.cardBg}cc`, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
          {currentChat.type === 'group' && !isSent && <div style={{ fontSize: 11, color: accentColor, marginBottom: 2, fontWeight: 'bold' }}>{msg.sender}</div>}
          {msg.type === 'photo' || msg.type === 'video' ? (
            <img src={msg.photoUrl} alt="Фото" style={{ maxWidth: 250, maxHeight: 300, borderRadius: 12, cursor: 'pointer' }} onClick={() => setFullscreenImage(msg.photoUrl)} />
          ) : (
            <div>{msg.text}{msg.edited && <span className="edited-badge"> {t.edited}</span>}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
            {read && <span style={{ color: '#4caf50', fontSize: 12 }}>✓✓</span>}
            {isSent && !read && <span style={{ color: currentTheme.text + '77', fontSize: 12 }}>✓</span>}
            <span className="time" style={{ color: currentTheme.text + '99' }}>{msg.time}</span>
          </div>
        </div>
        {Object.keys(msgReactions).length > 0 && (
          <div style={{ marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Object.entries(msgReactions).map(([r, count]) => (
              <span key={r} style={{ background: currentTheme.cardBg, borderRadius: 12, padding: '2px 8px', fontSize: 13, cursor: 'pointer' }} onClick={() => handleReaction(msg.id, r)}>{r} {count > 1 && count}</span>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>
        {contextMenuState.visible && (
          <div ref={contextMenuRef} className="context-menu" style={{ position: 'fixed', left: Math.min(contextMenuState.x - 70, window.innerWidth - 280), top: Math.max(60, contextMenuState.y - 120), background: currentTheme.cardBg, borderRadius: 14, zIndex: 200, minWidth: contextMenuState.isOwn ? 160 : 280, maxWidth: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', padding: '8px 0' }}>
            {contextMenuState.isOwn ? (
              <>
                <div onClick={() => startEditing(contextMenuState.messageId, contextMenuState.text)} style={{ padding: '14px 20px', cursor: 'pointer', color: currentTheme.text }}>{t.edit}</div>
                <div onClick={() => handleDeleteMessage(contextMenuState.messageId)} style={{ padding: '14px 20px', cursor: 'pointer', color: accentColor }}>{t.delete}</div>
              </>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 12px', justifyContent: 'center' }}>
                {availableReactions.map(r => (
                  <span key={r} onClick={() => handleReaction(contextMenuState.messageId, r)} style={{ fontSize: 24, cursor: 'pointer', padding: 4, borderRadius: 8, userSelect: 'none' }}>{r}</span>
                ))}
              </div>
            )}
          </div>
        )}
    
<div className="input-area" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderTop: `0.5px solid ${currentTheme.border}`, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
  <input type="file" ref={photoInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={e => { if (e.target.files[0]) sendPhoto(e.target.files[0]); e.target.value = ''; }} />
  <button onClick={() => photoInputRef.current?.click()} style={{ background: 'none', border: 'none', color: accentColor, fontSize: 22, cursor: 'pointer', padding: 6, flexShrink: 0 }}>📎</button>
  <input ref={inputRef} value={input} onChange={handleInputChange} onFocus={handleInputFocus} onKeyPress={e => e.key === 'Enter' && sendMessage()}
    placeholder={editingMessage ? t.editMsg : t.message}
    style={{ background: currentTheme.bg, color: currentTheme.text, flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 25, border: 'none', fontSize: 15, outline: 'none' }} />
  <button onClick={sendMessage}
    style={{ padding: '8px 18px', height: 40, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', borderRadius: 25, fontSize: 14, cursor: 'pointer', fontWeight: 'bold', flexShrink: 0, whiteSpace: 'nowrap' }}>
    {t.send}
  </button>
</div>
        {fullscreenImage && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.95)', zIndex: 300,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setFullscreenImage(null)}
          >
            <div style={{ position: 'absolute', top: 40, right: 20, zIndex: 301 }}>
              <button onClick={() => setFullscreenImage(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 28, width: 44, height: 44, borderRadius: 22, cursor: 'pointer', marginBottom: 10, display: 'block' }}>✕</button>
              <a href={fullscreenImage} download
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 20, width: 44, height: 44, borderRadius: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>⬇</a>
            </div>
            <img src={fullscreenImage} alt="Полный размер" 
              style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
              onClick={(e) => e.stopPropagation()} />
          </div>
        )}
        {groupMembers && (
          <div className="group-members-popup">
            <div className="group-members-popup-content" style={{ background: currentTheme.cardBg }}>
              <h4 style={{ color: iconColor }}>{t.participants} ({groupMembers.length})</h4>
              {groupMembers.map((m, i) => {
                const memberOnline = isUserOnline(m);
                return (
                  <div key={i} style={{ color: currentTheme.text, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => viewUserProfile(m)}>👤 {m}</span>
                    {memberOnline ? <span style={{ color: '#4caf50', fontSize: 12 }}>{t.online}</span> : <span style={{ fontSize: 11, color: currentTheme.text + '77' }}>{formatLastSeen(m)}</span>}
                  </div>
                );
              })}
              <button onClick={() => setGroupMembers(null)} style={{ background: accentColor, color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 20, marginTop: 16, cursor: 'pointer' }}>{t.close}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Экран настроек (profileSection !== 'main')
  if (activeTab === 'profile' && profileSection !== 'main') {
    return (
      <div className="chat-screen" style={{ background: currentTheme.bg }}
        onTouchStart={handleChatTouchStart}
        onTouchEnd={(e) => handleBackSwipe(e, () => setProfileSection('main'))}>
        <div className="chat-header" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
          <button className="back-btn" onClick={() => setProfileSection('main')} style={{ color: accentColor }}>←</button>
          <span style={{ color: iconColor, fontWeight: 'bold' }}>
            {profileSection === 'settings' ? t.settings : profileSection === 'language' ? t.language : profileSection === 'reactions' ? t.reaction : t.privacy}
          </span>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {profileSection === 'settings' && (
            <div>
              <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>{t.bgChat}</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['#0f0f0f', '#1a1a2e', '#2d2d44', '#1e3a2e'].map(bg => (
                    <button key={bg} onClick={() => { setChatBackground(bg); localStorage.setItem(`chat_bg_${user.uid}`, bg); }} style={{ width: 50, height: 50, borderRadius: 25, background: bg, border: 'none', cursor: 'pointer' }}></button>
                  ))}
                  <button onClick={() => bgFileInputRef.current?.click()} style={{ padding: '0 16px', height: 50, borderRadius: 25, background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}`, cursor: 'pointer' }}>{t.customBg}</button>
                  <input type="file" ref={bgFileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBgUpload} />
                </div>
              </div>
              <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>{t.theme}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(themes).map(([k, th]) => (
                    <button key={k} onClick={() => changeTheme(k)} style={{ padding: '8px 16px', borderRadius: 30, background: th.bg, color: th.text, border: theme === k ? `2px solid ${accentColor}` : `1px solid ${currentTheme.border}`, cursor: 'pointer', fontWeight: theme === k ? 'bold' : 'normal' }}>{th.name}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>{t.accent}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {accentColors.map(c => (
                    <button key={c.value} onClick={() => changeAccent(c.value)} style={{ width: 40, height: 40, borderRadius: 20, background: c.value, border: accentColor === c.value ? `3px solid ${iconColor}` : 'none', cursor: 'pointer' }}></button>
                  ))}
                </div>
              </div>
              <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>{t.iconColor}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {iconColors.map(c => (
                    <button key={c.value} onClick={() => changeIconColor(c.value)} style={{ width: 40, height: 40, borderRadius: 20, background: c.value, border: iconColor === c.value ? `3px solid ${accentColor}` : 'none', cursor: 'pointer' }}></button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {profileSection === 'language' && (
            <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: iconColor }}>{t.language}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {languages.map(l => (
                  <button key={l.code} onClick={() => saveLanguage(l.code)} style={{ padding: '14px 20px', borderRadius: 16, background: userLanguage === l.code ? accentColor : currentTheme.bg, color: userLanguage === l.code ? '#fff' : currentTheme.text, border: 'none', cursor: 'pointer', fontSize: 16, textAlign: 'left' }}>{l.name}</button>
                ))}
              </div>
            </div>
          )}
          {profileSection === 'reactions' && (
            <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: iconColor }}>{t.reaction}</h3>
              <p style={{ fontSize: 12, color: currentTheme.text + '77', marginBottom: 12 }}>{t.doubleTap}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {availableReactions.map(r => (
                  <button key={r} onClick={() => saveDefaultReaction(r)} style={{ fontSize: 32, background: defaultReaction === r ? `${accentColor}30` : 'transparent', border: defaultReaction === r ? `2px solid ${accentColor}` : '2px solid transparent', borderRadius: 12, padding: '8px 12px', cursor: 'pointer' }}>{r}</button>
                ))}
              </div>
            </div>
          )}
          {profileSection === 'privacy' && (
            <div style={{ background: currentTheme.cardBg, borderRadius: 20, padding: 20 }}>
              <h3 style={{ marginBottom: 12, color: iconColor }}>{t.privacy}</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={privacySettings.hideLastSeen} onChange={e => setPrivacySettings({...privacySettings, hideLastSeen: e.target.checked})} />
                <span style={{ color: currentTheme.text }}>{t.hideLastSeen}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={privacySettings.hideAvatar} onChange={e => setPrivacySettings({...privacySettings, hideAvatar: e.target.checked})} />
                <span style={{ color: currentTheme.text }}>{t.hideAvatar}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={privacySettings.hideDescription} onChange={e => setPrivacySettings({...privacySettings, hideDescription: e.target.checked})} />
                <span style={{ color: currentTheme.text }}>{t.hideDescription}</span>
              </label>
              <button onClick={savePrivacySettings} style={{ padding: '12px 24px', background: accentColor, border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 16 }}>{t.save}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ background: currentTheme.bg, color: currentTheme.text }}>
      <div className="header" style={{ background: currentTheme.cardBg, borderBottom: `0.5px solid ${currentTheme.border}`, padding: '16px 20px', paddingTop: 'env(safe-area-inset-top, 24px)', minHeight: 70, textAlign: 'center', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: 18, color: iconColor }}>StoGramm</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0', background: currentTheme.bg }}>
        {tabs.map((tab, i) => (
          <div key={tab} onClick={() => { setActiveTab(tab); setProfileSection('main'); }} style={{ width: i === currentTabIndex ? 24 : 6, height: 6, borderRadius: 3, background: i === currentTabIndex ? accentColor : currentTheme.border, transition: 'all 0.3s ease', cursor: 'pointer' }} />
        ))}
      </div>
      <div className="main-content" onTouchStart={handleSwipeStart} onTouchMove={handleSwipeMove} onTouchEnd={handleSwipeEnd} style={{ overflow: 'hidden', position: 'relative' }}>
        <div ref={swipeTrackRef} style={{ display: 'flex', height: '100%', transition: 'transform 0.3s ease', transform: `translateX(-${currentTabIndex * 100}%)`, willChange: 'transform' }}>
          {/* Чаты */}
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }} onScroll={handleScrollChats}>
            <div className="chats" ref={chatListRef}>
              {chats.length === 0 && <div style={{ textAlign: 'center', padding: 60 }}><p style={{ color: currentTheme.text + '99' }}>{t.noChats}</p></div>}
              {chats.map(chat => {
                const isOnline = isUserOnline(chat.name);
                return (
                  <div key={chat.id} className="chat-item" onClick={() => openChat(chat.id, chat.name, chat.type, chat.createdBy, chat.members)} onContextMenu={e => showChatMenu(e, chat.id, chat.name)}
                    style={{ background: currentTheme.cardBg, padding: '14px 16px', marginBottom: 8, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ background: `${accentColor}20`, color: accentColor, width: 52, height: 52, borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {chat.type === 'group' ? '👥' : chat.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, background: '#4caf50', border: `2px solid ${currentTheme.cardBg}` }} />}
                      {unreadChats[chat.id] && <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: '#ff3b30', border: `2px solid ${currentTheme.cardBg}` }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: iconColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {chat.name}
                        {chat.type === 'private' && isOnline && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4caf50', display: 'inline-block' }}></span>}
                      </div>
                      <div style={{ fontSize: 12, color: unreadChats[chat.id] ? accentColor : currentTheme.text + '99', fontWeight: unreadChats[chat.id] ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chat.type === 'group' && chat.lastMessageSender && chat.lastMessageSender !== user.name && <span style={{ color: accentColor }}>{chat.lastMessageSender}: </span>}
                        {unreadChats[chat.id] && '● '}{chat.lastMessage}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {showPlusButton && activeTab === 'chats' && (
              <button onClick={() => setActiveTab('search')}
                style={{ position: 'fixed', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            )}
          </div>
          {/* Профиль */}
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: 100, height: 100, borderRadius: 50, background: currentTheme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', marginBottom: 16 }}>
                {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40, color: accentColor }}>{user.name.charAt(0).toUpperCase()}</span>}
                <span style={{ position: 'absolute', bottom: 0, right: 0, background: accentColor, width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</span>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
              <h2 style={{ marginBottom: 24, color: iconColor }}>{user.name}</h2>
              <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>{t.description}</h3>
                <input type="text" placeholder={t.description} value={userDescription} 
                  onChange={e => { saveDescription(e.target.value); }}
                  style={{ width: '100%', padding: 14, background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 30 }} />
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <button onClick={() => setProfileSection('settings')} style={{ width: '100%', padding: 16, background: currentTheme.cardBg, borderRadius: 16, border: 'none', color: currentTheme.text, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>⚙️ {t.settings}</button>
                <button onClick={() => setProfileSection('language')} style={{ width: '100%', padding: 16, background: currentTheme.cardBg, borderRadius: 16, border: 'none', color: currentTheme.text, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>🌐 {t.language}</button>
                <button onClick={() => setProfileSection('reactions')} style={{ width: '100%', padding: 16, background: currentTheme.cardBg, borderRadius: 16, border: 'none', color: currentTheme.text, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>❤️ {t.reaction}</button>
                <button onClick={() => setProfileSection('privacy')} style={{ width: '100%', padding: 16, background: currentTheme.cardBg, borderRadius: 16, border: 'none', color: currentTheme.text, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>🔒 {t.privacy}</button>
              </div>
                            {(!window.Capacitor || !window.Capacitor.isNativePlatform()) && (
  <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
    <h3 style={{ marginBottom: 12, color: iconColor }}>{t.downloadApp}</h3>
    <a 
      href="/stogramm.apk" 
      download="StoGramm.apk"
      style={{ 
        padding: '12px 24px', 
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, 
        color: '#fff', 
        border: 'none', 
        borderRadius: 30, 
        fontSize: 16, 
        cursor: 'pointer', 
        textDecoration: 'none', 
        display: 'inline-block' 
      }}
    >
      📱 Скачать APK
    </a>
  </div>
)}
              <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 30, background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}`, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>{t.logout}</button>
            </div>
          </div>
          {/* Группы */}
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 20 }}>
              <div style={{ background: currentTheme.cardBg, borderRadius: 24, padding: 24 }}>
                <h3 style={{ marginBottom: 20, color: iconColor }}>{t.createGroupTitle}</h3>
                <input type="text" placeholder={t.groupName} value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: 14, marginBottom: 20, background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 30 }} />
                <p style={{ color: currentTheme.text + '99', marginBottom: 12 }}>{t.selectMembers}:</p>
                <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20 }}>
                  {getAvailableMembers().map(m => {
                    const memberOnline = isUserOnline(m);
                    return (
                      <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedMembers.includes(m)} onChange={e => e.target.checked ? setSelectedMembers([...selectedMembers, m]) : setSelectedMembers(selectedMembers.filter(x => x !== m))} />
                        <span style={{ color: currentTheme.text }}>👤 {m}</span>
                        {memberOnline && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4caf50' }}></span>}
                      </label>
                    );
                  })}
                </div>
                <button onClick={createGroup} style={{ width: '100%', padding: 14, borderRadius: 30, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>{t.create}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Экран поиска */}
      {activeTab === 'search' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: currentTheme.bg, zIndex: 300, display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleChatTouchStart}
          onTouchEnd={(e) => handleBackSwipe(e, () => setActiveTab('chats'))}>
          <div className="chat-header" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
            <button className="back-btn" onClick={() => setActiveTab('chats')} style={{ color: accentColor }}>←</button>
            <span style={{ color: iconColor, fontWeight: 'bold' }}>{t.searchUser}</span>
          </div>
          <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
            <div style={{ background: currentTheme.cardBg, borderRadius: 24, padding: 24, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
              <h3 style={{ marginBottom: 20, color: iconColor, fontSize: 22 }}>{t.findUser}</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input type="text" placeholder="Username" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchAndAddUser()}
                  style={{ flex: 1, padding: 14, background: currentTheme.bg, color: currentTheme.text, border: `2px solid ${currentTheme.border}`, borderRadius: 30, fontSize: 16, minWidth: 0 }} autoFocus />
                <button onClick={searchAndAddUser} style={{ padding: '14px 20px', borderRadius: 30, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>🔍</button>
              </div>
              <p style={{ fontSize: 13, color: currentTheme.text + '77' }}>Введите имя пользователя для поиска</p>
            </div>
          </div>
        </div>
      )}
      <div className="bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', 
  padding: '8px 0 16px 0', 
  paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 8px)', 
  background: currentTheme.cardBg + 'cc', 
  backdropFilter: 'blur(10px)', 
  borderTop: `0.5px solid ${currentTheme.border}` 
}}>
        {tabs.map(tab => (
          <div key={tab} onClick={() => { setActiveTab(tab); setProfileSection('main'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 18px', borderRadius: 30, cursor: 'pointer', background: activeTab === tab ? accentColor + '20' : 'transparent' }}>
            <span style={{ fontSize: 22, color: activeTab === tab ? accentColor : iconColor }}>{tab === 'chats' ? '💬' : tab === 'profile' ? '👤' : '👥'}</span>
            <span style={{ fontSize: 10, color: activeTab === tab ? accentColor : currentTheme.text + '99' }}>{t[tab]}</span>
          </div>
        ))}
      </div>
      {chatMenuState.visible && (
        <div className="context-menu" style={{ position: 'fixed', left: chatMenuState.x - 70, top: chatMenuState.y - 80, background: currentTheme.cardBg, borderRadius: 14, zIndex: 1000, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div onClick={() => deleteChat(chatMenuState.chatId, chatMenuState.chatName)} style={{ padding: '14px 20px', cursor: 'pointer', color: accentColor }}>🗑️ {t.deleteChat}</div>
        </div>
      )}
    </div>
  );
}
export default App;