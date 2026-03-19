import { ChevronDown, Menu, X, Lock, LogOut, Plus, Trash2, Edit, Save, FileText, Image as ImageIcon, Newspaper, Maximize, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';

type Page = 'home' | 'about' | 'news' | 'gallery' | 'documents' | 'admin';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>('reglamento');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [news, setNews] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
    if (token) setIsAdminLoggedIn(true);
  }, [token]);

  const fetchData = async () => {
    try {
      const [newsRes, docsRes, galleryRes] = await Promise.all([
        fetch(`${API_URL}/news`),
        fetch(`${API_URL}/documents`),
        fetch(`${API_URL}/gallery`)
      ]);
      const [newsData, docsData, galleryData] = await Promise.all([
        newsRes.json(),
        docsRes.json(),
        galleryRes.json()
      ]);
      setNews(newsData);
      setDocuments(docsData);
      setGallery(galleryData);
      if (docsData.length > 0) setSelectedDoc(docsData[0].id);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Nosotros', path: '/about' },
    { name: 'Noticias', path: '/news' },
    { name: 'Galería', path: '/gallery' },
    { name: 'Documentos', path: '/documents', hasDropdown: true },
    ...(isAdminLoggedIn ? [{ name: 'Panel Admin', path: '/admin' }] : []),
  ];

  const getAbsoluteUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('localhost:5000') && !API_URL.includes('localhost')) {
      return url.replace(/https?:\/\/localhost:5000/, new URL(API_URL).origin);
    }
    return url;
  };

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<'news' | 'docs' | 'gallery' | null>('news');

  // Hero Carousel Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      if (data.success) {
        setIsAdminLoggedIn(true);
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setShowLogin(false);
        setLoginForm({ user: '', password: '' });
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  const deleteNews = async (id: number) => {
    const res = await fetch(`${API_URL}/news/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchData();
  };

  const deleteDoc = async (id: string) => {
    const res = await fetch(`${API_URL}/documents/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchData();
  };

  const deleteGallery = async (id: number) => {
    const res = await fetch(`${API_URL}/gallery/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchData();
  };

  const [newNews, setNewNews] = useState({ title: '', desc: '', content: '', tag: 'Política', img: '' });
  const [newDoc, setNewDoc] = useState({ title: '', desc: '', version: '', id: '', pdfUrl: '' });
  const [newGallery, setNewGallery] = useState({ title: '', desc: '', img: '' });

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress('Subiendo...');
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setUploadProgress(null);
      return data.url;
    } catch (err) {
      setUploadProgress('Error en subida');
      return null;
    }
  };

  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);

  const addNews = async () => {
    if (!newNews.title || !newNews.content) {
      alert('Faltan datos obligatorios (Título o Contenido)');
      return;
    }
    const isEditing = editingNewsId !== null;
    try {
      const url = isEditing ? `${API_URL}/news/${editingNewsId}` : `${API_URL}/news`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newNews, date: isEditing ? newNews.date : new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) })
      });
      if (res.ok) {
        fetchData();
        setNewNews({ title: '', desc: '', content: '', tag: 'Política', img: '' });
        setEditingNewsId(null);
        setActiveSection(null); // Minimize
        alert('Noticia guardada con éxito');
      } else {
        const errData = await res.json();
        alert('Error al guardar: ' + (errData.error || 'Problema en el servidor'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  const addDoc = async () => {
    if (!newDoc.title || !newDoc.id) {
      alert('Faltan datos (Título o ID)');
      return;
    }
    const isEditing = editingDocId !== null;
    const url = isEditing ? `${API_URL}/documents/${editingDocId}` : `${API_URL}/documents`;
    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDoc)
      });
      if (res.ok) {
        fetchData();
        setNewDoc({ title: '', desc: '', version: '', id: '', pdfUrl: '' });
        setEditingDocId(null);
        setActiveSection(null); // Minimize
        alert('Documento guardado con éxito');
      } else {
        const errData = await res.json();
        alert('Error al guardar documento: ' + (errData.error || 'Problema en el servidor'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar documento');
    }
  };

  const addGallery = async () => {
    if (!newGallery.title || !newGallery.img) {
      alert('Faltan datos (Título o Imagen)');
      return;
    }
    const isEditing = editingGalleryId !== null;
    const url = isEditing ? `${API_URL}/gallery/${editingGalleryId}` : `${API_URL}/gallery`;
    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGallery)
      });
      if (res.ok) {
        fetchData();
        setNewGallery({ title: '', desc: '', img: '' });
        setEditingGalleryId(null);
        setActiveSection(null); // Minimize
        alert('Galería actualizada con éxito');
      } else {
        const errData = await res.json();
        alert('Error en galería: ' + (errData.error || 'Problema en el servidor'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión en galería');
    }
  };

  const renderLogin = () => (
    <div className="flex w-full items-center justify-center py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-[#006BB6]">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Acceso Administrativo</h2>
          <p className="mt-2 text-slate-600">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700">Usuario</label>
            <input 
              type="text" 
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#006BB6] focus:outline-none"
              value={loginForm.user}
              onChange={(e) => setLoginForm({ ...loginForm, user: e.target.value })}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">Contraseña</label>
            <input 
              type="password" 
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#006BB6] focus:outline-none"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-sm font-bold text-red-500">{loginError}</p>}
          <div className="flex gap-4 pt-4">
            <button 
              type="submit"
              className="w-full rounded-xl bg-[#006BB6] py-3 font-bold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105 active:scale-95"
            >
              Entrar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  const renderAdmin = () => (
    <section className="bg-slate-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-[#006BB6] sm:text-4xl md:text-6xl">PANEL DE CONTROL</h2>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">Gestiona el contenido de la plataforma oficial</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-red-50 px-6 py-3 font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* News Management */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <button 
              onClick={() => setActiveSection(activeSection === 'news' ? null : 'news')}
              className="w-full flex items-center justify-between p-8 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Newspaper className="h-8 w-8 text-[#006BB6]" />
                <h3 className="text-2xl font-black text-slate-900">
                  {editingNewsId ? 'Editar Noticia' : 'Gestión de Noticias'}
                </h3>
              </div>
              <ChevronDown className={`h-6 w-6 transition-transform ${activeSection === 'news' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {activeSection === 'news' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  {editingNewsId && (
                    <button 
                      onClick={() => {
                        setEditingNewsId(null);
                        setNewNews({ title: '', desc: '', content: '', tag: 'Política', img: '' });
                      }}
                      className="mb-4 text-sm font-bold text-red-500 hover:underline"
                    >
                      Cancelar Edición
                    </button>
                  )}
            
                  <div className="mb-10 grid grid-cols-1 gap-6 rounded-2xl bg-slate-50 p-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Título de la Noticia</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newNews.title}
                        onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Etiqueta (Tag)</label>
                      <div className="mt-1 flex flex-col gap-2">
                        <select 
                          className="w-full rounded-xl border border-slate-200 px-4 py-2"
                          value={['Política', 'Educación', 'Economía', 'Transparencia', 'Social'].includes(newNews.tag) ? newNews.tag : 'Otro'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== 'Otro') setNewNews({ ...newNews, tag: val });
                            else setNewNews({ ...newNews, tag: '' });
                          }}
                        >
                          <option value="Política">Política</option>
                          <option value="Educación">Educación</option>
                          <option value="Economía">Economía</option>
                          <option value="Transparencia">Transparencia</option>
                          <option value="Social">Social</option>
                          <option value="Otro">Otro (Personalizar...)</option>
                        </select>
                        {!['Política', 'Educación', 'Economía', 'Transparencia', 'Social'].includes(newNews.tag) && (
                          <input 
                            type="text"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2"
                            placeholder="Escribe etiqueta personalizada"
                            value={newNews.tag}
                            onChange={(e) => setNewNews({ ...newNews, tag: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Imagen</label>
                      <div className="mt-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
                          value={newNews.img}
                          onChange={(e) => setNewNews({ ...newNews, img: e.target.value })}
                          placeholder="https://... o sube una"
                        />
                        <label className="flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200">
                          <ImageIcon className="h-5 w-5 text-slate-600" />
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) setNewNews({ ...newNews, img: url });
                            }
                          }} />
                        </label>
                      </div>
                      {uploadProgress && <p className="mt-1 text-xs text-blue-500">{uploadProgress}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Descripción Corta</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newNews.desc}
                        onChange={(e) => setNewNews({ ...newNews, desc: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Contenido Completo</label>
                      <textarea 
                        rows={4}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newNews.content}
                        onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        onClick={addNews}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-transform hover:scale-[1.02] ${editingNewsId ? 'bg-orange-500' : 'bg-[#006BB6]'}`}
                      >
                        {editingNewsId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {editingNewsId ? 'Guardar Cambios' : 'Publicar Noticia'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {news.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <img src={item.img} className="h-12 w-12 rounded-lg object-cover" />
                          <div>
                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.date} • {item.tag}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setActiveSection('news');
                              setEditingNewsId(item.id);
                              setNewNews({ ...item });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-[#006BB6]"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteNews(item.id)}
                            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Documents Management */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <button 
              onClick={() => setActiveSection(activeSection === 'docs' ? null : 'docs')}
              className="w-full flex items-center justify-between p-8 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-[#006BB6]" />
                <h3 className="text-2xl font-black text-slate-900">
                  {editingDocId ? 'Editar Documento' : 'Gestión de Documentos'}
                </h3>
              </div>
              <ChevronDown className={`h-6 w-6 transition-transform ${activeSection === 'docs' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {activeSection === 'docs' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  {editingDocId && (
                    <button 
                      onClick={() => {
                        setEditingDocId(null);
                        setNewDoc({ title: '', desc: '', version: '', id: '', pdfUrl: '' });
                      }}
                      className="mb-4 text-sm font-bold text-red-500 hover:underline"
                    >
                      Cancelar Edición
                    </button>
                  )}

                  <div className="mb-10 grid grid-cols-1 gap-6 rounded-2xl bg-slate-50 p-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Título del Documento</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">ID Único (slug)</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newDoc.id}
                        onChange={(e) => setNewDoc({ ...newDoc, id: e.target.value })}
                        placeholder="ej: estatuto-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Versión / Año</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newDoc.version}
                        onChange={(e) => setNewDoc({ ...newDoc, version: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Documento PDF</label>
                      <div className="mt-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
                          value={newDoc.pdfUrl}
                          onChange={(e) => setNewDoc({ ...newDoc, pdfUrl: e.target.value })}
                          placeholder="URL o sube un archivo"
                        />
                        <label className="flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200">
                          <Plus className="h-5 w-5 text-slate-600" />
                          <input type="file" className="hidden" accept="application/pdf" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) setNewDoc({ ...newDoc, pdfUrl: url });
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Descripción</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newDoc.desc}
                        onChange={(e) => setNewDoc({ ...newDoc, desc: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        onClick={addDoc}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-transform hover:scale-[1.02] ${editingDocId ? 'bg-orange-500' : 'bg-[#006BB6]'}`}
                      >
                        {editingDocId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {editingDocId ? 'Guardar Cambios' : 'Subir Documento'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {documents.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.version} • {item.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setActiveSection('docs');
                              setEditingDocId(item.id);
                              setNewDoc({ ...item });
                            }}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-[#006BB6]"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteDoc(item.id)}
                            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gallery Management */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <button 
              onClick={() => setActiveSection(activeSection === 'gallery' ? null : 'gallery')}
              className="w-full flex items-center justify-between p-8 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-[#006BB6]" />
                <h3 className="text-2xl font-black text-slate-900">
                  {editingGalleryId ? 'Editar Galería' : 'Gestión de Galería'}
                </h3>
              </div>
              <ChevronDown className={`h-6 w-6 transition-transform ${activeSection === 'gallery' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {activeSection === 'gallery' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  {editingGalleryId && (
                    <button 
                      onClick={() => {
                        setEditingGalleryId(null);
                        setNewGallery({ title: '', desc: '', img: '' });
                      }}
                      className="mb-4 text-sm font-bold text-red-500 hover:underline"
                    >
                      Cancelar Edición
                    </button>
                  )}

                  <div className="mb-10 grid grid-cols-1 gap-6 rounded-2xl bg-slate-50 p-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Título de la Imagen</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newGallery.title}
                        onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Imagen</label>
                      <div className="mt-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
                          value={newGallery.img}
                          onChange={(e) => setNewGallery({ ...newGallery, img: e.target.value })}
                          placeholder="URL o sube una"
                        />
                        <label className="flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200">
                          <ImageIcon className="h-5 w-5 text-slate-600" />
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) setNewGallery({ ...newGallery, img: url });
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Descripción</label>
                      <input 
                        type="text" 
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                        value={newGallery.desc}
                        onChange={(e) => setNewGallery({ ...newGallery, desc: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button 
                        onClick={addGallery}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-transform hover:scale-[1.02] ${editingGalleryId ? 'bg-orange-500' : 'bg-[#006BB6]'}`}
                      >
                        {editingGalleryId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {editingGalleryId ? 'Guardar Cambios' : 'Añadir a Galería'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {gallery.map((item) => (
                      <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100">
                        <img src={item.img} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <button 
                            onClick={() => {
                              setActiveSection('gallery');
                              setEditingGalleryId(item.id);
                              setNewGallery({ ...item });
                            }}
                            className="rounded-full bg-white p-2 text-slate-600 hover:text-[#006BB6]"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteGallery(item.id)}
                            className="rounded-full bg-white p-2 text-slate-600 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );

  const renderHome = () => (
    <>
      <section className="relative h-[400px] md:h-[600px] overflow-hidden bg-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentHeroSlide === 0 && (
              <motion.div 
                key="slide1"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -30 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center gap-6 md:flex-row md:gap-14"
              >
                <div className="relative h-32 w-32 sm:h-48 sm:w-48 md:h-72 md:w-72">
                  <motion.img 
                    animate={{ rotateY: [0, 5, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    src="/assets/logo.png" 
                    alt="Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col text-center md:text-left">
                  <h1 className="text-4xl font-black tracking-tighter text-[#006BB6] sm:text-6xl md:text-8xl">
                    COOPERACIÓN
                  </h1>
                  <h1 className="mt-[-5px] text-4xl font-black tracking-tighter text-[#006BB6] sm:text-6xl md:text-8xl md:mt-[-10px]">
                    POPULAR
                  </h1>
                </div>
              </motion.div>
            )}

            {currentHeroSlide === 1 && (
              <motion.div 
                key="slide2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center px-4 text-center"
              >
                <h2 className="max-w-4xl text-5xl font-black tracking-tighter text-[#006BB6] sm:text-7xl md:text-9xl">
                  JUSTICIA Y <span className="text-[#E31E24]">IGUALDAD</span>
                </h2>
                <p className="mt-6 text-xl font-bold uppercase tracking-[0.2em] text-slate-400 md:text-3xl">
                  Unidos por un futuro transparente
                </p>
              </motion.div>
            )}

            {currentHeroSlide === 2 && (
              <motion.div 
                key="slide3"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center px-4 text-center"
              >
                <h2 className="max-w-4xl text-5xl font-black tracking-tighter text-[#006BB6] sm:text-7xl md:text-9xl">
                  COMPROMISO <span className="text-[#00A651]">NACIONAL</span>
                </h2>
                <p className="mt-6 text-xl font-bold uppercase tracking-[0.2em] text-slate-400 md:text-3xl">
                  Transformando el desarrollo del Perú
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Indicators */}
        <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <button
               key={i}
               onClick={() => setCurrentHeroSlide(i)}
               className={`h-2 rounded-full transition-all duration-500 ${currentHeroSlide === i ? 'w-12 bg-[#006BB6]' : 'w-3 bg-slate-200 hover:bg-slate-300'}`}
            />
          ))}
        </div>
      </section>



      {/* Featured News Preview with Carousel */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Últimas Noticias
              </h2>
              <p className="mt-2 text-slate-600">Mantente informado sobre nuestras actividades.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden gap-2 md:flex">
                {news.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentNewsIndex(idx)}
                    className={`h-2 rounded-full transition-all ${currentNewsIndex === idx ? 'w-8 bg-[#006BB6]' : 'w-2 bg-slate-300'}`}
                  ></button>
                ))}
              </div>
              <Link 
                to="/news"
                className="font-bold text-[#006BB6] hover:underline"
              >
                Ver todas →
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap justify-center gap-4 md:gap-10">
              {news.slice(currentNewsIndex, currentNewsIndex + 2).map((item, idx, arr) => (
                <div 
                  key={item.id || idx}
                  className={`${arr.length === 1 ? 'w-full max-w-[800px]' : 'w-full md:w-[calc(50%-1rem)] max-w-[450px]'} cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl`}
                  onClick={() => {
                      setSelectedArticle(item);
                      window.location.href = '/news';
                    }}
                  >
                    <div className={`${arr.length === 1 ? 'aspect-[21/9]' : 'aspect-[16/7]'} w-full overflow-hidden bg-slate-100`}>
                      <img src={item.img} className="h-full w-full object-cover transition-transform hover:scale-105" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-6 md:p-10">
                      <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-[#006BB6] md:text-base">
                        {item.tag}
                      </span>
                      <h3 className={`${arr.length === 1 ? 'text-2xl md:text-5xl' : 'text-xl md:text-3xl'} line-clamp-2 font-black leading-tight text-slate-900`}>
                        {item.title}
                      </h3>
                      <p className="mt-4 line-clamp-3 text-slate-600 md:text-xl">
                        {item.desc}
                      </p>
                      <p className="mt-4 hidden text-sm text-slate-500 md:block">{item.date}</p>
                    </div>
                </div>
                ))}

            </div>
            
            {/* Nav Arrows */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button 
                onClick={() => setCurrentNewsIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-full bg-white p-2 shadow-md hover:bg-slate-50 disabled:opacity-30"
                disabled={currentNewsIndex === 0}
              >
                <ChevronDown className="h-5 w-5 rotate-90 text-slate-600" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(news.length / 2) }).map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${Math.floor(currentNewsIndex / 2) === i ? 'w-4 bg-[#006BB6]' : 'w-1.5 bg-slate-200'}`}></div>
                ))}
              </div>
              <button 
                onClick={() => setCurrentNewsIndex((prev) => (prev + 2 < news.length ? prev + 2 : 0))}
                className="rounded-full bg-white p-2 shadow-md hover:bg-slate-50"
              >
                <ChevronDown className="h-5 w-5 -rotate-90 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Documents Carousel */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Documentos Oficiales
              </h2>
              <p className="mt-2 text-slate-600">Accede y descarga nuestra documentación institucional.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden gap-2 md:flex">
                {documents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentDocIndex(idx)}
                    className={`h-2 rounded-full transition-all ${currentDocIndex === idx ? 'w-8 bg-[#E31E24]' : 'w-2 bg-slate-200'}`}
                  ></button>
                ))}
              </div>
              <Link 
                to="/documents"
                className="font-bold text-[#006BB6] hover:underline"
              >
                Ver todos →
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap justify-center gap-4 md:gap-10">
              {documents.slice(currentDocIndex, currentDocIndex + 2).map((doc, idx, arr) => (
                <div 
                  key={doc.id || idx}
                  className={`${arr.length === 1 ? 'w-full max-w-[1000px] flex flex-col md:flex-row' : 'w-full md:w-[calc(50%-1rem)] max-w-[400px] flex flex-col'} overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl transition-all hover:shadow-2xl`}
                >
                    {/* PDF Visualizer */}
                    <div className={`${arr.length === 1 ? 'w-full md:w-1/2 h-[280px] md:h-[500px]' : 'w-full h-[180px] md:h-[300px]'} relative bg-slate-100 group/pdf`}>
                      <iframe 
                        src={getAbsoluteUrl(doc.pdfUrl) + "#view=FitH&toolbar=0&navpanes=0&scrollbar=1"} 
                        className="h-full w-full border-none"
                        title={doc.title}
                      ></iframe>
                      {/* Fullscreen Overlay Button */}
                      <a 
                        href={getAbsoluteUrl(doc.pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover/pdf:opacity-100"
                        title="Ver pantalla completa"
                      >
                        <Maximize className="h-5 w-5" />
                      </a>
                    </div>

                    <div className={`${arr.length === 1 ? 'w-full md:w-1/2' : 'w-full'} p-8 md:p-12 flex flex-col justify-center`}>
                      <div className="mb-6 hidden h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <FileText className="h-8 w-8" />
                      </div>
                      <span className="text-xs font-bold text-red-500 uppercase md:text-sm">{doc.version}</span>
                      <h3 className={`${arr.length === 1 ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} mt-3 line-clamp-2 font-black text-slate-900`}>
                        {doc.title}
                      </h3>
                      <p className="mt-4 line-clamp-3 text-slate-600">{doc.desc}</p>
                      
                      <div className="mt-8 flex flex-wrap gap-4">
                        <a 
                          href={getAbsoluteUrl(doc.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full bg-[#006BB6] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        >
                          Descargar PDF <ChevronDown className="h-4 w-4 -rotate-90" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => setCurrentDocIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                disabled={currentDocIndex === 0}
              >
                <ChevronDown className="h-5 w-5 rotate-90" />
              </button>
              <button 
                onClick={() => setCurrentDocIndex((prev) => (prev + 2 < documents.length ? prev + 2 : 0))}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <ChevronDown className="h-5 w-5 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Carousel */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Nuestra Galería
              </h2>
              <p className="mt-2 text-slate-600">Momentos destacados de nuestra labor partidaria y social.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden gap-2 md:flex">
                {gallery.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentGalleryIndex(idx)}
                    className={`h-2 rounded-full transition-all ${currentGalleryIndex === idx ? 'w-8 bg-[#FFD700]' : 'w-2 bg-slate-200'}`}
                  ></button>
                ))}
              </div>
              <Link 
                to="/gallery"
                className="font-bold text-[#006BB6] hover:underline"
              >
                Ver galería →
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap justify-center gap-4 md:gap-10">
              {gallery.slice(currentGalleryIndex, currentGalleryIndex + 2).map((item, idx, arr) => (
                <div 
                  key={item.id || idx}
                  className={`group relative ${arr.length === 1 ? 'aspect-[21/9] w-full max-w-[1000px]' : 'aspect-square w-full md:w-[calc(50%-1rem)] max-w-[450px]'} overflow-hidden rounded-3xl shadow-2xl`}
                >
                    <img src={item.img} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100 transition-opacity">
                      <div className="absolute bottom-0 p-6 md:p-12">
                        <p className={`${arr.length === 1 ? 'text-3xl md:text-6xl' : 'text-xl md:text-3xl'} font-black text-white`}>{item.title}</p>
                        {arr.length === 1 && <p className="mt-4 text-xl text-white/70">{item.desc}</p>}
                      </div>
                    </div>
                    </div>
                ))}

            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => setCurrentGalleryIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-full bg-white p-2 shadow-md hover:bg-slate-50 disabled:opacity-30"
                disabled={currentGalleryIndex === 0}
              >
                <ChevronDown className="h-5 w-5 rotate-90 text-slate-600" />
              </button>
              <button 
                onClick={() => setCurrentGalleryIndex((prev) => (prev + 2 < gallery.length ? prev + 2 : 0))}
                className="rounded-full bg-white p-2 shadow-md hover:bg-slate-50"
              >
                <ChevronDown className="h-5 w-5 -rotate-90 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderNews = () => {
    if (selectedArticle) {
      return (
        <section className="bg-white py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setSelectedArticle(null)}
              className="mb-8 flex items-center gap-2 font-bold text-[#006BB6] hover:underline"
            >
              ← Volver a noticias
            </button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="mb-4 inline-block rounded-full bg-slate-100 px-4 py-1 text-sm font-bold text-[#006BB6]">
                {selectedArticle.tag}
              </span>
              <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-5xl">
                {selectedArticle.title}
              </h2>
              <p className="mt-4 text-sm font-medium text-slate-400">{selectedArticle.date}</p>
              
              <div className="my-10 aspect-video overflow-hidden rounded-3xl shadow-2xl">
                <img 
                  src={selectedArticle.img} 
                  alt={selectedArticle.title} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="prose prose-lg max-w-none text-slate-700">
                {selectedArticle.content.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="mb-6 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
              
            </motion.div>
          </div>
        </section>
      );
    }

    return (
      <section className="bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-3xl font-black tracking-tighter text-[#006BB6] sm:text-4xl md:text-6xl">NOTICIAS</h2>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">Actualidad, eventos y comunicados oficiales</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {news.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2.5rem)] max-w-[400px] flex flex-col group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-all hover:shadow-2xl"
                onClick={() => setSelectedArticle(item)}
              >
                <div className="h-64 overflow-hidden">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-[#006BB6]">{item.tag}</span>
                  <h3 className="text-xl font-black leading-tight tracking-tighter text-slate-900 md:text-2xl line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm text-slate-600 line-clamp-3 flex-grow">
                    {item.desc}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <span className="text-xs font-medium text-slate-400">{item.date}</span>
                    <button className="text-sm font-bold text-[#006BB6] hover:underline">
                      Leer más →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };
  const renderAbout = () => (
    <section className="bg-slate-50 py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Quienes Somos & Historia */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">¿Quiénes Somos?</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
                Somos un grupo de ciudadanos comprometidos con el desarrollo y el bienestar de nuestra comunidad. Nuestro partido está basado en los principios de justicia, igualdad y transparencia.
              </p>
            </div>
            
            <div className="mt-10 text-center sm:mt-12">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Nuestra Historia</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
                El partido político Cooperación Popular, nace con el propósito de generar espacios para que la ciudadanía pueda proponer, participar y fiscalizar las acciones del Estado ante la resolución de los principales problemas del país.
              </p>
            </div>
          </div>

          {/* Mision & Vision */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:p-12">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Nuestra Misión</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
                El partido político Cooperación Popular, busca forjar una comunidad basada en la justicia, la honradez y el desarrollo, que honre los derechos humanos y las libertades fundamentales. Asimismo, rechazamos enérgicamente la corrupción dado que perjudica al desarrollo de los pueblos del Perú, por ello, promovemos la participación de los ciudadanos como mecanismo de control y como contribución ciudadana a la resolución de los problemas del país.
              </p>
            </div>

            <div className="mt-10 text-center sm:mt-12">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Nuestra Visión</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
                Institucionalizar la participación ciudadana como propuesta para hacer frente a los principales problemas del país, asimismo, fortalecer la democracia con un enfoque descentralizado para tener un Estado más eficiente y equitativo. Además, contribuir con la integración nacional entre el Estado y las organizaciones sociales, promoviendo el diálogo como mecanismo para alcanzar consensos que permitan mejorar las condiciones sociales de las personas más vulnerables.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const renderGallery = () => (
    <section className="bg-slate-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="text-3xl font-black tracking-tighter text-[#006BB6] sm:text-4xl md:text-6xl">GALERÍA</h2>
          <p className="mt-4 text-lg text-slate-600 md:text-xl">Imágenes de nuestras actividades y encuentros con la comunidad</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-200 shadow-md"
            >
              <img
                src={item.img}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FFD100]">{item.desc}</span>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );


  const renderDocuments = () => {
    return (
      <section className="bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-3xl font-black tracking-tighter text-[#006BB6] sm:text-4xl md:text-6xl">DOCUMENTOS</h2>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">Consulta y descarga nuestros documentos oficiales y reglamentos</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2rem)] max-w-[400px] flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl transition-all hover:shadow-2xl"
              >
                  {/* PDF Visualizer */}
                  <div className="relative h-[250px] md:h-[350px] bg-slate-100 group/pdf">
                    <iframe 
                      src={getAbsoluteUrl(doc.pdfUrl) + "#view=FitH&toolbar=0&navpanes=0&scrollbar=0"} 
                      className="h-full w-full border-none pointer-events-none"
                      title={doc.title}
                    ></iframe>
                    {/* Fullscreen Overlay Button */}
                    <a 
                      href={getAbsoluteUrl(doc.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/pdf:opacity-100"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#006BB6] shadow-xl">
                        <Maximize className="h-6 w-6" />
                      </div>
                    </a>
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    <span className="text-xs font-bold text-red-500 uppercase">{doc.version || '1.0'}</span>
                    <h3 className="mt-3 text-xl font-black text-slate-900 line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="mt-4 text-sm text-slate-600 line-clamp-3 flex-grow">{doc.desc}</p>
                    
                    <div className="mt-8">
                      <a 
                        href={getAbsoluteUrl(doc.pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#006BB6] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      >
                        Descargar PDF <ChevronDown className="h-4 w-4 -rotate-90" />
                      </a>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const NotFound = () => (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-8 rounded-full bg-slate-100 p-8 text-slate-400">
        <AlertCircle className="h-20 w-20" />
      </motion.div>
      <h1 className="text-8xl font-black tracking-tighter text-[#006BB6]">404</h1>
      <h2 className="mt-4 text-3xl font-bold text-slate-800">Página no encontrada</h2>
      <p className="mt-6 max-w-md text-slate-500">Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" className="mt-10 rounded-full bg-[#006BB6] px-10 py-4 font-bold text-white shadow-xl hover:bg-[#005a99]">
        Regresar al Inicio
      </Link>
    </div>
  );

  const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
      <div className="min-h-screen bg-white font-['Outfit',sans-serif]">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden"><img src="/assets/logo.png" alt="Logo" className="h-full w-full object-contain" /></div>
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-black tracking-tighter text-[#006BB6]">COOPERACIÓN</span>
                  <span className="text-xl font-black tracking-tighter text-[#006BB6]">POPULAR</span>
                </div>
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative rounded-full px-5 py-2 text-sm font-bold transition-all ${location.pathname === link.path ? 'text-[#006BB6]' : 'text-slate-600 hover:text-[#006BB6]'}`}
                  >
                    {link.name}
                    {location.pathname === link.path && (
                      <motion.div layoutId="navUnderline" className="absolute bottom-0 left-5 right-5 h-0.5 bg-[#006BB6]" />
                    )}
                  </Link>
                ))}
                {isAdminLoggedIn && (
                  <button onClick={handleLogout} className="ml-4 flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100">
                    <LogOut className="h-4 w-4" /> Salir
                  </button>
                )}
              </nav>
              <button className="md:hidden text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                 {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="border-t border-slate-100 bg-white md:hidden p-4">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className={`block p-4 font-bold rounded-lg ${location.pathname === link.path ? 'bg-slate-50 text-[#006BB6]' : 'text-slate-600 hover:bg-slate-50'}`}>{link.name}</Link>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>
        <main>{children}</main>
        <footer className="border-t border-slate-200 bg-[#F8F8F8] pt-16 pb-12">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
             © 2024 Cooperación Popular. Todos los derechos reservados.
           </div>
        </footer>
      </div>
    );
  };

  const AdminRoute = () => {
    if (!isAdminLoggedIn) return <Layout>{renderLogin()}</Layout>;
    return <Layout>{renderAdmin()}</Layout>;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout>{renderHome()}</Layout>} />
        <Route path="/about" element={<Layout>{renderAbout()}</Layout>} />
        <Route path="/news" element={<Layout>{renderNews()}</Layout>} />
        <Route path="/gallery" element={<Layout>{renderGallery()}</Layout>} />
        <Route path="/documents" element={<Layout>{renderDocuments()}</Layout>} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
