'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Kisi, Cocuk } from '@/lib/types'
import { X, Plus, Loader2, Pencil, Trash2, Check } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'

interface Props {
  kisi: Kisi
  onClose: () => void
  onCocukSayisiChanged: (kisiId: string, newCount: number) => void
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function CocuklarModal({ kisi, onClose, onCocukSayisiChanged, showToast }: Props) {
  const [cocuklar, setCocuklar] = useState<Cocuk[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [yas, setYas] = useState('')
  const [cinsiyet, setCinsiyet] = useState('Erkek')
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editYas, setEditYas] = useState('')
  const [editCinsiyet, setEditCinsiyet] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCocuklar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCocuklar() {
    try {
      const { data, error } = await supabase
        .from('cocuklar')
        .select('*')
        .eq('ebeveyn_id', kisi.id)
        .order('yas', { ascending: true })
      if (error) throw error
      setCocuklar(data || [])
    } catch (err: unknown) {
      showToast('Çocuklar yüklenemedi: ' + getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function syncCocukSayisi() {
    const { data } = await supabase
      .from('cocuklar')
      .select('id')
      .eq('ebeveyn_id', kisi.id)
    const count = data?.length || 0
    await supabase.from('kisiler').update({ cocuk_sayisi: count }).eq('id', kisi.id)
    onCocukSayisiChanged(kisi.id, count)
  }

  async function handleAdd() {
    if (!yas || isNaN(Number(yas)) || Number(yas) < 0) {
      showToast('Lütfen geçerli bir yaş girin.', 'error')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('cocuklar')
        .insert({ ebeveyn_id: kisi.id, yas: Number(yas), cinsiyet })
      if (error) throw error

      await syncCocukSayisi()
      await fetchCocuklar()
      showToast('Çocuk başarıyla eklendi.', 'success')
      setShowForm(false)
      setYas('')
      setCinsiyet('Erkek')
    } catch (err: unknown) {
      showToast('Çocuk eklenemedi: ' + getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(cocuk: Cocuk) {
    setEditingId(cocuk.id)
    setEditYas(String(cocuk.yas))
    setEditCinsiyet(cocuk.cinsiyet)
    setDeletingId(null)
  }

  async function handleUpdate(cocukId: number) {
    if (!editYas || isNaN(Number(editYas)) || Number(editYas) < 0) {
      showToast('Lütfen geçerli bir yaş girin.', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('cocuklar')
        .update({ yas: Number(editYas), cinsiyet: editCinsiyet })
        .eq('id', cocukId)
      if (error) throw error

      setCocuklar((prev) =>
        prev.map((c) => (c.id === cocukId ? { ...c, yas: Number(editYas), cinsiyet: editCinsiyet } : c))
      )
      setEditingId(null)
      showToast('Çocuk bilgisi güncellendi.', 'success')
    } catch (err: unknown) {
      showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  async function handleDelete(cocukId: number) {
    try {
      const { error } = await supabase.from('cocuklar').delete().eq('id', cocukId)
      if (error) throw error

      setCocuklar((prev) => prev.filter((c) => c.id !== cocukId))
      setDeletingId(null)
      await syncCocukSayisi()
      showToast('Çocuk kaydı silindi.', 'success')
    } catch (err: unknown) {
      showToast('Silme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {kisi.ad} {kisi.soyad} &ndash; Çocuklar
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
          ) : cocuklar.length === 0 && !showForm ? (
            <p className="text-gray-500 text-lg text-center py-6">Kayıtlı çocuk bulunmuyor.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {cocuklar.map((cocuk) => (
                <div key={cocuk.id}>
                  {editingId === cocuk.id ? (
                    <div className="bg-blue-50 rounded-xl px-5 py-4 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Yaş</label>
                          <input
                            type="number"
                            value={editYas}
                            onChange={(e) => setEditYas(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max="18"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Cinsiyet</label>
                          <select
                            value={editCinsiyet}
                            onChange={(e) => setEditCinsiyet(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Erkek">Erkek</option>
                            <option value="Kız">Kız</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(cocuk.id)}
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
                  ) : deletingId === cocuk.id ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                      <p className="text-red-700 text-base mb-3">Bu çocuk kaydını silmek istediğinize emin misiniz?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(cocuk.id)}
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
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3.5 group">
                      <span className="text-lg text-gray-700">
                        {cocuk.cinsiyet === 'Erkek' ? '👦' : '👧'} {cocuk.cinsiyet}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-800">{cocuk.yas} yaş</span>
                        <button
                          onClick={() => startEdit(cocuk)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(cocuk.id); setEditingId(null) }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm ? (
          <div className="border-t border-gray-200 pt-5 mt-2 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-base font-medium text-gray-700 mb-1">Yaş</label>
                <input
                  type="number"
                  value={yas}
                  onChange={(e) => setYas(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Yaş"
                  min="0"
                  max="18"
                />
              </div>
              <div className="flex-1">
                <label className="block text-base font-medium text-gray-700 mb-1">Cinsiyet</label>
                <select
                  value={cinsiyet}
                  onChange={(e) => setCinsiyet(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Erkek">Erkek</option>
                  <option value="Kız">Kız</option>
                </select>
              </div>
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
                onClick={() => { setShowForm(false); setYas(''); setCinsiyet('Erkek') }}
                className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl text-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-lg hover:border-blue-400 hover:text-blue-600 transition-colors mt-2"
          >
            <Plus size={20} />
            Çocuk Ekle
          </button>
        )}
      </div>
    </div>
  )
}
