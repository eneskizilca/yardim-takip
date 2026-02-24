'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import type { Kisi } from '@/lib/types'
import { X, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onSaved: () => void
  showToast: (message: string, type: 'success' | 'error') => void
  kisi?: Kisi
}

const fieldDefs = [
  { key: 'tc_no', label: 'TC Kimlik No', placeholder: '11 haneli TC kimlik numarası', maxLength: 11 as number | undefined },
  { key: 'ad', label: 'Ad *', placeholder: 'Adı girin', maxLength: undefined as number | undefined },
  { key: 'soyad', label: 'Soyad *', placeholder: 'Soyadı girin', maxLength: undefined as number | undefined },
  { key: 'telefon', label: 'Telefon', placeholder: '555 555 55 55', maxLength: undefined as number | undefined },
  { key: 'adres', label: 'Adres', placeholder: 'Açık adres', maxLength: undefined as number | undefined },
  { key: 'mahalle', label: 'Mahalle', placeholder: 'Mahalle adı', maxLength: undefined as number | undefined },
] as const

type FormKey = (typeof fieldDefs)[number]['key']

export default function KisiEkleModal({ onClose, onSaved, showToast, kisi }: Props) {
  const isEdit = !!kisi

  const [form, setForm] = useState<Record<FormKey, string>>({
    tc_no: kisi?.tc_no || '',
    ad: kisi?.ad || '',
    soyad: kisi?.soyad || '',
    telefon: kisi?.telefon || '',
    adres: kisi?.adres || '',
    mahalle: kisi?.mahalle || '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleChange(field: FormKey, value: string) {
    if (field === 'tc_no') {
      value = value.replace(/\D/g, '').slice(0, 11)
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.ad.trim() || !form.soyad.trim()) {
      showToast('Ad ve Soyad alanları zorunludur.', 'error')
      return
    }

    if (form.tc_no && form.tc_no.length !== 11) {
      showToast('TC Kimlik No 11 haneli olmalıdır.', 'error')
      return
    }

    try {
      setSaving(true)

      if (isEdit) {
        const { error } = await supabase
          .from('kisiler')
          .update({
            tc_no: form.tc_no.trim(),
            ad: form.ad.trim(),
            soyad: form.soyad.trim(),
            telefon: form.telefon.trim(),
            adres: form.adres.trim(),
            mahalle: form.mahalle.trim(),
          })
          .eq('id', kisi.id)
        if (error) throw error
        showToast('Kişi bilgileri güncellendi.', 'success')
      } else {
        const { error } = await supabase.from('kisiler').insert({
          tc_no: form.tc_no.trim(),
          ad: form.ad.trim(),
          soyad: form.soyad.trim(),
          telefon: form.telefon.trim(),
          adres: form.adres.trim(),
          mahalle: form.mahalle.trim(),
          cocuk_sayisi: 0,
          ramazan_kumanyasi: false,
          bot_mont: false,
        })
        if (error) throw error
        showToast('Kişi başarıyla eklendi.', 'success')
      }

      onSaved()
      onClose()
    } catch (err: unknown) {
      showToast((isEdit ? 'Güncelleme' : 'Ekleme') + ' başarısız: ' + getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true)

      await supabase.from('cocuklar').delete().eq('ebeveyn_id', kisi!.id)
      await supabase.from('arama-gecmisleri').delete().eq('kisi_id', kisi!.id)
      await supabase.from('yardimlar').delete().eq('kisi_id', kisi!.id)

      const { error } = await supabase.from('kisiler').delete().eq('id', kisi!.id)
      if (error) throw error

      showToast('Kişi ve ilişkili kayıtlar silindi.', 'success')
      onSaved()
      onClose()
    } catch (err: unknown) {
      showToast('Silme başarısız: ' + getErrorMessage(err), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Kişi Bilgilerini Düzenle' : 'Yeni Kişi Ekle'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldDefs.map(({ key, label, placeholder, maxLength }) => (
            <div key={key}>
              <label className="block text-base font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                inputMode={key === 'tc_no' ? 'numeric' : undefined}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={placeholder}
                maxLength={maxLength}
              />
              {key === 'tc_no' && form.tc_no.length > 0 && form.tc_no.length < 11 && (
                <p className="text-sm text-amber-600 mt-1">{form.tc_no.length}/11 hane</p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl text-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-gray-200 mt-6 pt-5">
            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-base font-medium mb-3">
                  Bu kişi ve tüm ilişkili verileri (çocuklar, arama geçmişi) kalıcı olarak silinecek. Emin misiniz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-base font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-base hover:bg-gray-50 transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 w-full py-3 text-red-500 border border-red-200 rounded-xl text-lg font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 size={20} />
                Kişiyi Sil
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
