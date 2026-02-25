'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AramaGecmisiDetay } from '@/lib/types'
import { Loader2, Calendar, User, Pencil, Trash2, Check, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

function formatTarih(tarih: string): string {
  return new Date(tarih).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AramaGecmisiPage() {
  const [aramalar, setAramalar] = useState<AramaGecmisiDetay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAciklama, setEditAciklama] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    fetchAramalar()
  }, [])

  async function fetchAramalar() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('arama-gecmisleri')
        .select('*, kisiler(ad, soyad)')
        .order('tarih', { ascending: false })
      if (error) throw error
      setAramalar((data as AramaGecmisiDetay[]) || [])
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: number) {
    if (!editAciklama.trim()) {
      showToast('Açıklama boş olamaz.', 'error')
      return
    }
    try {
      const { error } = await supabase
        .from('arama-gecmisleri')
        .update({ aciklama: editAciklama.trim() })
        .eq('id', id)
      if (error) throw error
      setAramalar((prev) => prev.map((a) => (a.id === id ? { ...a, aciklama: editAciklama.trim() } : a)))
      setEditingId(null)
      showToast('Not güncellendi.', 'success')
    } catch (err: unknown) {
      showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      const { error } = await supabase.from('arama-gecmisleri').delete().eq('id', id)
      if (error) throw error
      setAramalar((prev) => prev.filter((a) => a.id !== id))
      setDeletingId(null)
      showToast('Not silindi.', 'success')
    } catch (err: unknown) {
      showToast('Silme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={36} />
        <span className="ml-3 text-lg text-gray-500">Yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={fetchAramalar}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-lg font-medium transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 left-4 right-4 md:left-auto md:right-6 z-60 px-6 py-3.5 rounded-xl shadow-lg text-white text-base font-medium text-center md:text-left ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tüm Arama/Notlar</h2>

      {aramalar.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">Kayıtlı arama notu bulunmuyor.</p>
      ) : (
        <>
          <p className="text-gray-400 text-base mb-4">{aramalar.length} kayıt</p>
          <div className="space-y-4">
            {aramalar.map((arama) => (
              <div key={arama.id}>
                {editingId === arama.id ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg mb-1">
                      <User size={18} />
                      {arama.kisiler?.ad} {arama.kisiler?.soyad}
                    </div>
                    <textarea
                      value={editAciklama}
                      onChange={(e) => setEditAciklama(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(arama.id)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Check size={16} /> Kaydet
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-base hover:bg-gray-50 transition-colors"
                      >
                        <X size={16} /> İptal
                      </button>
                    </div>
                  </div>
                ) : deletingId === arama.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5">
                    <p className="text-red-700 text-base font-medium mb-1">
                      {arama.kisiler?.ad} {arama.kisiler?.soyad} &ndash; &quot;{arama.aciklama.slice(0, 50)}{arama.aciklama.length > 50 ? '...' : ''}&quot;
                    </p>
                    <p className="text-red-600 text-base mb-3">Bu notu silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(arama.id)}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-base font-medium hover:bg-red-700 transition-colors"
                      >
                        Evet, Sil
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-base hover:bg-gray-50 transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 md:px-6 md:py-5 hover:shadow-sm transition-shadow group">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2.5">
                      <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
                        <User size={18} />
                        {arama.kisiler?.ad} {arama.kisiler?.soyad}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-gray-400 text-base">
                          <Calendar size={16} />
                          {formatTarih(arama.tarih)}
                        </div>
                        <button
                          onClick={() => { setEditingId(arama.id); setEditAciklama(arama.aciklama); setDeletingId(null) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(arama.id); setEditingId(null) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[17px] text-gray-700 leading-relaxed">{arama.aciklama}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
