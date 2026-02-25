'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Kisi, Yardim } from '@/lib/types'
import { X, Plus, Loader2, Calendar, Pencil, Trash2, Check } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

interface Props {
  kisi: Kisi
  onClose: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

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

export default function YardimModal({ kisi, onClose, showToast }: Props) {
  const [yardimlar, setYardimlar] = useState<Yardim[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [icerik, setIcerik] = useState('')
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editIcerik, setEditIcerik] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchYardimlar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchYardimlar() {
    try {
      const { data, error } = await supabase
        .from('yardimlar')
        .select('*')
        .eq('kisi_id', kisi.id)
        .order('tarih', { ascending: false })
      if (error) throw error
      setYardimlar(data || [])
    } catch (err: unknown) {
      showToast('Yardımlar yüklenemedi: ' + getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!icerik.trim()) {
      showToast('Lütfen yardım içeriğini girin.', 'error')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('yardimlar')
        .insert({ kisi_id: kisi.id, yardim_icerigi: icerik.trim() })
      if (error) throw error

      showToast('Yardım kaydı eklendi.', 'success')
      setShowForm(false)
      setIcerik('')
      fetchYardimlar()
    } catch (err: unknown) {
      showToast('Yardım eklenemedi: ' + getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(yardim: Yardim) {
    setEditingId(yardim.id)
    setEditIcerik(yardim.yardim_icerigi)
    setDeletingId(null)
  }

  async function handleUpdate(yardimId: number) {
    if (!editIcerik.trim()) {
      showToast('İçerik boş olamaz.', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('yardimlar')
        .update({ yardim_icerigi: editIcerik.trim() })
        .eq('id', yardimId)
      if (error) throw error

      setYardimlar((prev) =>
        prev.map((y) => (y.id === yardimId ? { ...y, yardim_icerigi: editIcerik.trim() } : y))
      )
      setEditingId(null)
      showToast('Yardım kaydı güncellendi.', 'success')
    } catch (err: unknown) {
      showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  async function handleDelete(yardimId: number) {
    try {
      const { error } = await supabase.from('yardimlar').delete().eq('id', yardimId)
      if (error) throw error

      setYardimlar((prev) => prev.filter((y) => y.id !== yardimId))
      setDeletingId(null)
      showToast('Yardım kaydı silindi.', 'success')
    } catch (err: unknown) {
      showToast('Silme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-xl md:max-w-lg md:mx-4 p-6 md:max-h-[85vh] flex flex-col rounded-t-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {kisi.ad} {kisi.soyad} &ndash; Yardımlar
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : yardimlar.length === 0 && !showForm ? (
            <p className="text-gray-500 text-lg text-center py-6">Kayıtlı yardım bulunmuyor.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {yardimlar.map((yardim) => (
                <div key={yardim.id}>
                  {editingId === yardim.id ? (
                    <div className="bg-blue-50 rounded-xl px-5 py-4 space-y-3">
                      <textarea
                        value={editIcerik}
                        onChange={(e) => setEditIcerik(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(yardim.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Check size={16} /> Kaydet
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-base hover:bg-gray-50 transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : deletingId === yardim.id ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                      <p className="text-red-700 text-base mb-3">Bu yardım kaydını silmek istediğinize emin misiniz?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(yardim.id)}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-base font-medium hover:bg-red-700 transition-colors"
                        >
                          Evet, Sil
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-base hover:bg-gray-50 transition-colors"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl px-5 py-3.5 group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          {formatTarih(yardim.tarih)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(yardim)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => { setDeletingId(yardim.id); setEditingId(null) }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[17px] text-gray-800 leading-relaxed">{yardim.yardim_icerigi}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm ? (
          <div className="border-t border-gray-200 pt-5 mt-2 space-y-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Yardım İçeriği</label>
              <textarea
                value={icerik}
                onChange={(e) => setIcerik(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Yapılan yardımı yazın..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Ekleniyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => { setShowForm(false); setIcerik('') }}
                className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl text-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-lg hover:border-orange-400 hover:text-orange-600 transition-colors mt-2"
          >
            <Plus size={20} />
            Yardım Ekle
          </button>
        )}
      </div>
    </div>
  )
}
