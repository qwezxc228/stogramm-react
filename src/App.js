import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded, onChildChanged, onChildRemoved, set, onValue, update, remove, get } from 'firebase/database';
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
  const [contextMenuState, setContextMenuState] = useState({ visible: false, x: 0, y: 0, messageId: null, text: null });
  const [chatMenuState, setChatMenuState] = useState({ visible: false, x: 0, y: 0, chatId: null, chatName: null });
  const [iconColor, setIconColor] = useState('#ffffff');
  const [chatTransition, setChatTransition] = useState(false);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [touchStartChat, setTouchStartChat] = useState(0);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgFileInputRef = useRef(null);
  const messagesListenerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingListenerRef = useRef(null);
  const sendingRef = useRef(false);

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

  const tabs = ['chats', 'profile', 'groups', 'search'];
  const currentTabIndex = tabs.indexOf(activeTab);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists() && snapshot.val().username) {
          const userData = snapshot.val();
          setUser({ uid: firebaseUser.uid, name: userData.username, email: firebaseUser.email });
          loadChats(userData.username);
        } else {
          setShowUsernamePrompt(true);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
        setShowUsernamePrompt(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !showUsernamePrompt) {
      const savedTheme = localStorage.getItem(`theme_${user.uid}`);
      const savedAccent = localStorage.getItem(`accent_${user.uid}`);
      const savedIconColor = localStorage.getItem(`icon_${user.uid}`);
      if (savedTheme) setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedIconColor) setIconColor(savedIconColor);
      const savedBg = localStorage.getItem(`chat_bg_${user.uid}`);
      if (savedBg && savedBg !== 'undefined') setChatBackground(savedBg);
      loadProfileImage();
    }
  }, [user, showUsernamePrompt]);

  useEffect(() => { if (user) loadUnreadStatus(); }, [user, chats]);

  const loadProfileImage = async () => {
    if (!user) return;
    const snap = await get(ref(db, `users/${user.uid}/avatar`));
    if (snap.exists()) setProfileImage(snap.val());
  };

  const changeTheme = (t) => { setTheme(t); localStorage.setItem(`theme_${user?.uid}`, t); };
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

  const loadUnreadStatus = () => {
    if (!user) return;
    const u = {};
    chats.forEach(c => {
      const last = parseInt(localStorage.getItem(`lastRead_${user.name}_${c.id}`) || '0');
      if ((c.timestamp || 0) > last && c.lastMessageSender && c.lastMessageSender !== user.name) u[c.id] = true;
    });
    setUnreadChats(u);
  };

  const showChatMenu = (e, chatId, chatName) => {
    e.preventDefault(); e.stopPropagation();
    setChatMenuState({ visible: true, x: e.clientX, y: e.clientY, chatId, chatName });
  };

  const deleteChat = async (chatId, chatName) => {
    if (window.confirm(`Удалить чат с ${chatName}?`)) {
      await remove(ref(db, `messages/${chatId}`));
      await remove(ref(db, `chats/${chatId}`));
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
        if (c.type === 'group' && c.members?.includes(name)) {
          mine.push({ id, name: c.name, type: 'group', lastMessage: c.lastMessage || '', members: c.members, timestamp: c.updatedAt || 0, lastMessageSender: c.lastMessageSender || '' });
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
    setMessages([]); setInput(''); setEditingMessage(null);
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
      await set(ref(db, `users/${uc.user.uid}`), { username: username.trim(), email, createdAt: Date.now() });
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
      await set(ref(db, `users/${user.uid}`), { username: username.trim(), email: user.email, createdAt: Date.now() });
      setUser(prev => ({ ...prev, name: username.trim() })); setShowUsernamePrompt(false); loadChats(username.trim());
    } catch { window.alert('Ошибка'); }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Выйти?')) { await signOut(auth); localStorage.clear(); setUser(null); }
  };

  const startEditing = (messageId, currentText) => {
    setInput(currentText); setEditingMessage({ id: messageId });
    setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null }); focusInput();
  };

  const cancelEditing = () => { setEditingMessage(null); setInput(''); };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Удалить?')) await remove(ref(db, `messages/${currentChat.id}/${messageId}`));
    setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null });
  };

  const showContextMenu = (e, messageId, text) => {
    e.stopPropagation();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setContextMenuState({ visible: true, x, y, messageId, text });
  };

  useEffect(() => {
    const h = () => setContextMenuState({ visible: false, x: 0, y: 0, messageId: null, text: null });
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, []);

  const handleSwipeStart = (e) => { setTouchStartX(e.touches[0].clientX); setTouchStartY(e.touches[0].clientY); setSwiping(true); };
  const handleSwipeMove = (e) => { if (swiping && Math.abs(e.touches[0].clientX - touchStartX) > 30) e.preventDefault(); };
  const handleSwipeEnd = (e) => {
    if (!swiping) return; setSwiping(false);
    const d = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(d) > 50) {
      if (d > 0 && currentTabIndex > 0) setActiveTab(tabs[currentTabIndex - 1]);
      else if (d < 0 && currentTabIndex < tabs.length - 1) setActiveTab(tabs[currentTabIndex + 1]);
    }
  };

  const handleChatTouchStart = (e) => setTouchStartChat(e.touches[0].clientX);
  const handleChatTouchEnd = (e) => { if (e.changedTouches[0].clientX - touchStartChat > 70) closeChat(); };

  const handleBgUpload = (e) => {
    const f = e.target.files[0];
    if (f) { const r = new FileReader(); r.onloadend = () => { setChatBackground(r.result); localStorage.setItem(`chat_bg_${user.uid}`, r.result); }; r.readAsDataURL(f); }
  };

  const handleImageUpload = async (e) => {
    const f = e.target.files[0];
    if (f && user) {
      setProfileImage(URL.createObjectURL(f));
      const up = await uploadBytes(storageRef(storage, `avatars/${user.uid}`), f);
      await set(ref(db, `users/${user.uid}/avatar`), await getDownloadURL(up.ref));
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

  const currentTheme = themes[theme];

  if (user && showUsernamePrompt) {
    return (
      <div className="auth" style={{ background: currentTheme.bg }}>
        <div className="auth-box" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, width: 320 }}>
          <h2 style={{ fontSize: 32, background: `linear-gradient(135deg, ${iconColor}, ${accentColor})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', marginBottom: 20 }}>StoGramm</h2>
          <p style={{ color: currentTheme.text + '99', marginBottom: 20, fontSize: 14 }}>Email {user.email} подтверждён ✅<br/>Придумайте имя:</p>
          <input type="text" placeholder="Имя" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={e => e.key === 'Enter' && saveUsername()}
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
              <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && login()}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <button onClick={login} disabled={loading}
                style={{ width: '100%', padding: 14, marginTop: 16, background: loading ? currentTheme.border : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 28, color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '...' : '📧 Войти'}
              </button>
              <p onClick={() => setIsLogin(false)} style={{ marginTop: 16, color: accentColor, cursor: 'pointer', fontSize: 14, textAlign: 'center' }}>Нет аккаунта? Зарегистрироваться</p>
            </>
          ) : (
            <>
              <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <input type="password" placeholder="Пароль (мин. 6)" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && register()}
                style={{ width: '100%', padding: 14, margin: '8px 0', background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 28, fontSize: 16 }} />
              <button onClick={register} disabled={loading}
                style={{ width: '100%', padding: 14, marginTop: 16, background: loading ? currentTheme.border : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, border: 'none', borderRadius: 28, color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '...' : '📧 Зарегистрироваться'}
              </button>
              <p onClick={() => setIsLogin(true)} style={{ marginTop: 16, color: accentColor, cursor: 'pointer', fontSize: 14, textAlign: 'center' }}>Уже есть аккаунт? Войти</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (currentChat) {
    const typingUsers = typingStatus[currentChat.id] || [];
    const typingText = typingUsers.length > 0 ? `${typingUsers.join(', ')} печатает...` : '';
    return (
      <div className="chat-screen" style={{ background: chatBackground, animation: 'chatSlideIn 0.3s ease', transition: 'transform 0.3s ease, opacity 0.3s ease', transform: chatTransition ? 'translateX(100%)' : 'translateX(0)', opacity: chatTransition ? 0 : 1 }}
        onTouchStart={handleChatTouchStart} onTouchEnd={handleChatTouchEnd}>
        <div className="chat-header" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
          <button className="back-btn" onClick={closeChat} style={{ color: accentColor }}>←</button>
          <span onClick={showGroupMembers} style={{ cursor: currentChat.type === 'group' ? 'pointer' : 'default', color: iconColor, fontWeight: 'bold' }}>{currentChat.name} {currentChat.type === 'group' && '👥'}</span>
        </div>
        {typingText && <div className="typing-indicator" style={{ color: accentColor }}>{typingText}</div>}
        {editingMessage && (
          <div className="editing-panel" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderBottom: `0.5px solid ${currentTheme.border}` }}>
            <span style={{ color: accentColor }}>✏️ Редактирование</span>
            <button onClick={cancelEditing} style={{ color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}>✖ Отмена</button>
          </div>
        )}
        <div className="messages" ref={messagesContainerRef} style={{ paddingBottom: 20 }}>
          {messages.map(msg => {
            const isSent = msg.sender === user.name;
            return (
              <div key={msg.id} className={`message ${isSent ? 'sent' : 'received'} ${msg.edited ? 'edited' : ''}`}
                onClick={(e) => isSent && showContextMenu(e, msg.id, msg.text)}
                onTouchEnd={(e) => { if (isSent) { e.preventDefault(); showContextMenu(e, msg.id, msg.text); } }}
                style={isSent ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : { background: `${currentTheme.cardBg}cc` }}>
                <div>{msg.text}{msg.edited && <span className="edited-badge"> (изменено)</span>}</div>
                <div className="time" style={{ color: currentTheme.text + '99', marginTop: 4 }}>{msg.time}</div>
              </div>
            );
          })}
        </div>
        {contextMenuState.visible && (
          <div className="context-menu" style={{ position: 'fixed', left: contextMenuState.x - 70, top: contextMenuState.y - 80, background: currentTheme.cardBg, borderRadius: 14, zIndex: 200, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div onClick={() => startEditing(contextMenuState.messageId, contextMenuState.text)} style={{ padding: '14px 20px', cursor: 'pointer', color: currentTheme.text }}>✏️ Изменить</div>
            <div onClick={() => handleDeleteMessage(contextMenuState.messageId)} style={{ padding: '14px 20px', cursor: 'pointer', color: accentColor }}>🗑️ Удалить</div>
          </div>
        )}
        <div className="input-area" style={{ background: `${currentTheme.cardBg}cc`, backdropFilter: 'blur(10px)', borderTop: `0.5px solid ${currentTheme.border}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input ref={inputRef} value={input} onChange={handleInputChange} onFocus={handleInputFocus} onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder={editingMessage ? "Измените..." : "Сообщение..."}
            style={{ background: currentTheme.bg, color: currentTheme.text, flex: 1, padding: '12px 18px', borderRadius: 30, border: 'none', fontSize: 16, outline: 'none' }} />
          <button onClick={sendMessage}
            style={{ padding: '0 24px', height: 44, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', borderRadius: 30, fontSize: 18, cursor: 'pointer', fontWeight: 'bold' }}>
            📤
          </button>
        </div>
        {groupMembers && (
          <div className="group-members-popup">
            <div className="group-members-popup-content" style={{ background: currentTheme.cardBg }}>
              <h4 style={{ color: iconColor }}>Участники</h4>
              {groupMembers.map((m, i) => <div key={i} style={{ color: currentTheme.text, padding: 8 }}>👤 {m}</div>)}
              <button onClick={() => setGroupMembers(null)} style={{ background: accentColor, color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 20, marginTop: 16, cursor: 'pointer' }}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app" style={{ background: currentTheme.bg, color: currentTheme.text }}>
      <div className="header" style={{ background: currentTheme.cardBg, borderBottom: `0.5px solid ${currentTheme.border}`, padding: '16px 20px', textAlign: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: 18, color: iconColor }}>StoGramm</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0', background: currentTheme.bg }}>
        {tabs.map((tab, i) => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ width: i === currentTabIndex ? 24 : 6, height: 6, borderRadius: 3, background: i === currentTabIndex ? accentColor : currentTheme.border, transition: 'all 0.3s ease', cursor: 'pointer' }} />
        ))}
      </div>
      <div className="main-content" onTouchStart={handleSwipeStart} onTouchMove={handleSwipeMove} onTouchEnd={handleSwipeEnd} style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', height: '100%', transition: 'transform 0.3s ease', transform: `translateX(-${currentTabIndex * 100}%)` }}>
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div className="chats">
              {chats.length === 0 && <div style={{ textAlign: 'center', padding: 60 }}><p style={{ color: currentTheme.text + '99' }}>📭 Нет диалогов</p></div>}
              {chats.map(chat => (
                <div key={chat.id} className="chat-item" onClick={() => openChat(chat.id, chat.name, chat.type, chat.createdBy, chat.members)} onContextMenu={e => showChatMenu(e, chat.id, chat.name)}
                  style={{ background: currentTheme.cardBg, padding: '14px 16px', marginBottom: 8, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ background: `${accentColor}20`, color: accentColor, width: 52, height: 52, borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {chat.type === 'group' ? '👥' : chat.name.charAt(0).toUpperCase()}
                    </div>
                    {unreadChats[chat.id] && <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: '#ff3b30', border: `2px solid ${currentTheme.cardBg}` }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: iconColor }}>{chat.name}</div>
                    <div style={{ fontSize: 12, color: unreadChats[chat.id] ? accentColor : currentTheme.text + '99', fontWeight: unreadChats[chat.id] ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {unreadChats[chat.id] && '● '}{chat.lastMessage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: 100, height: 100, borderRadius: 50, background: currentTheme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', marginBottom: 16 }}>
                {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40, color: accentColor }}>{user.name.charAt(0).toUpperCase()}</span>}
                <span style={{ position: 'absolute', bottom: 0, right: 0, background: accentColor, width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</span>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
              <h2 style={{ marginBottom: 24, color: iconColor }}>{user.name}</h2>
              <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>Фон чата</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['#0f0f0f', '#1a1a2e', '#2d2d44', '#1e3a2e'].map(bg => (
                    <button key={bg} onClick={() => { setChatBackground(bg); localStorage.setItem(`chat_bg_${user.uid}`, bg); }} style={{ width: 50, height: 50, borderRadius: 25, background: bg, border: 'none', cursor: 'pointer' }}></button>
                  ))}
                  <button onClick={() => bgFileInputRef.current?.click()} style={{ padding: '0 16px', height: 50, borderRadius: 25, background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}`, cursor: 'pointer' }}>🖼️ Своё</button>
                  <input type="file" ref={bgFileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBgUpload} />
                </div>
              </div>
              <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>Тема</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(themes).map(([k, t]) => (
                    <button key={k} onClick={() => changeTheme(k)} style={{ padding: '8px 16px', borderRadius: 30, background: t.bg, color: t.text, border: theme === k ? `2px solid ${accentColor}` : `1px solid ${currentTheme.border}`, cursor: 'pointer', fontWeight: theme === k ? 'bold' : 'normal' }}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>Цвет акцента</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {accentColors.map(c => (
                    <button key={c.value} onClick={() => changeAccent(c.value)} style={{ width: 40, height: 40, borderRadius: 20, background: c.value, border: accentColor === c.value ? `3px solid ${iconColor}` : 'none', cursor: 'pointer' }}></button>
                  ))}
                </div>
              </div>
              <div style={{ width: '100%', background: currentTheme.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12, color: iconColor }}>Цвет иконок</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {iconColors.map(c => (
                    <button key={c.value} onClick={() => changeIconColor(c.value)} style={{ width: 40, height: 40, borderRadius: 20, background: c.value, border: iconColor === c.value ? `3px solid ${accentColor}` : 'none', cursor: 'pointer' }}></button>
                  ))}
                </div>
              </div>
              <button onClick={handleLogout} style={{ width: '100%', padding: 14, borderRadius: 30, background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}`, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🚪 Выйти</button>
            </div>
          </div>
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 20 }}>
              <div style={{ background: currentTheme.cardBg, borderRadius: 24, padding: 24 }}>
                <h3 style={{ marginBottom: 20, color: iconColor }}>Создать группу</h3>
                <input type="text" placeholder="Название" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: 14, marginBottom: 20, background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 30 }} />
                <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20 }}>
                  {getAvailableMembers().map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedMembers.includes(m)} onChange={e => e.target.checked ? setSelectedMembers([...selectedMembers, m]) : setSelectedMembers(selectedMembers.filter(x => x !== m))} />
                      <span style={{ color: currentTheme.text }}>👤 {m}</span>
                    </label>
                  ))}
                </div>
                <button onClick={createGroup} style={{ width: '100%', padding: 14, borderRadius: 30, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>➕ Создать</button>
              </div>
            </div>
          </div>
          <div style={{ minWidth: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ background: currentTheme.cardBg, borderRadius: 24, padding: 32, maxWidth: 340, textAlign: 'center' }}>
                <h3 style={{ marginBottom: 20, color: iconColor }}>Найти пользователя</h3>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <input type="text" placeholder="Имя" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchAndAddUser()}
                    style={{ flex: 1, padding: 14, background: currentTheme.bg, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: 30 }} />
                  <button onClick={searchAndAddUser} style={{ padding: '14px 20px', borderRadius: 30, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🔍</button>
                </div>
                <p style={{ fontSize: 12, color: currentTheme.text + '77' }}>Введите имя для поиска</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', background: currentTheme.cardBg + 'cc', backdropFilter: 'blur(10px)', borderTop: `0.5px solid ${currentTheme.border}` }}>
        {tabs.map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 20px', borderRadius: 30, cursor: 'pointer', background: activeTab === tab ? accentColor + '20' : 'transparent' }}>
            <span style={{ fontSize: 24, color: activeTab === tab ? accentColor : iconColor }}>{tab === 'chats' ? '💬' : tab === 'profile' ? '👤' : tab === 'groups' ? '👥' : '🔍'}</span>
            <span style={{ fontSize: 11, color: activeTab === tab ? accentColor : currentTheme.text + '99' }}>{tab === 'chats' ? 'Чаты' : tab === 'profile' ? 'Профиль' : tab === 'groups' ? 'Группы' : 'Поиск'}</span>
          </div>
        ))}
      </div>
      {chatMenuState.visible && (
        <div className="context-menu" style={{ position: 'fixed', left: chatMenuState.x - 70, top: chatMenuState.y - 80, background: currentTheme.cardBg, borderRadius: 14, zIndex: 1000, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div onClick={() => deleteChat(chatMenuState.chatId, chatMenuState.chatName)} style={{ padding: '14px 20px', cursor: 'pointer', color: accentColor }}>🗑️ Удалить чат</div>
        </div>
      )}
    </div>
  );
}

export default App;