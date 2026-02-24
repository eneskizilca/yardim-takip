'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { YardimDetay } from '@/lib/types'
import { Loader2, Calendar, User, HandHeart, Pencil, Trash2, Check, X } from 'lucide-react'
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

export default function TumYardimlarPage() {
  const [yardimlar, setYardimlar] = useState<YardimDetay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editIcerik, setEditIcerik] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    fetchYardimlar()
  }, [])

  async function fetchYardimlar() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('yardimlar')
        .select('*, kisiler(ad, soyad)')
        .order('tarih', { ascending: false })
      if (error) throw error
      setYardimlar((data as YardimDetay[]) || [])
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: number) {
    if (!editIcerik.trim()) {
      showToast('İçerik boş olamaz.', 'error')
      return
    }
    try {
      const { error } = await supabase
        .from('yardimlar')
        .update({ yardim_icerigi: editIcerik.trim() })
        .eq('id', id)
      if (error) throw error
      setYardimlar((prev) => prev.map((y) => (y.id === id ? { ...y, yardim_icerigi: editIcerik.trim() } : y)))
      setEditingId(null)
      showToast('Yardım kaydı güncellendi.', 'success')
    } catch (err: unknown) {
      showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      const { error } = await supabase.from('yardimlar').delete().eq('id', id)
      if (error) throw error
      setYardimlar((prev) => prev.filter((y) => y.id !== id))
      setDeletingId(null)
      showToast('Yardım kaydı silindi.', 'success')
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
          onClick={fetchYardimlar}
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
        <div className={`fixed top-6 right-6 z-60 px-6 py-3.5 rounded-xl shadow-lg text-white text-base font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <HandHeart size={28} className="text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-800">Tüm Yardımlar</h2>
      </div>

      {yardimlar.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">Kayıtlı yardım bulunmuyor.</p>
      ) : (
        <>
          <p className="text-gray-400 text-base mb-4">{yardimlar.length} kayıt</p>
          <div className="space-y-4">
            {yardimlar.map((yardim) => (
              <div key={yardim.id}>
                {editingId === yardim.id ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 space-y-3">
                    <div className="flex items-center gap-2 text-orange-700 font-semibold text-lg mb-1">
                      <User size={18} />
                      {yardim.kisiler?.ad} {yardim.kisiler?.soyad}
                    </div>
                    <textarea
                      value={editIcerik}
                      onChange={(e) => setEditIcerik(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(yardim.id)}
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
                ) : deletingId === yardim.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5">
                    <p className="text-red-700 text-base font-medium mb-1">
                      {yardim.kisiler?.ad} {yardim.kisiler?.soyad} &ndash; &quot;{yardim.yardim_icerigi.slice(0, 50)}{yardim.yardim_icerigi.length > 50 ? '...' : ''}&quot;
                    </p>
                    <p className="text-red-600 text-base mb-3">Bu yardım kaydını silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(yardim.id)}
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
                  <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 hover:shadow-sm transition-shadow group">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2 text-orange-700 font-semibold text-lg">
                        <User size={18} />
                        {yardim.kisiler?.ad} {yardim.kisiler?.soyad}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-gray-400 text-base">
                          <Calendar size={16} />
                          {formatTarih(yardim.tarih)}
                        </div>
                        <button
                          onClick={() => { setEditingId(yardim.id); setEditIcerik(yardim.yardim_icerigi); setDeletingId(null) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(yardim.id); setEditingId(null) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[17px] text-gray-700 leading-relaxed">{yardim.yardim_icerigi}</p>
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
