'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Kisi } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { Phone, Baby, UserPlus, Loader2, Search, Pencil, ArrowUpDown, Filter, HandHeart } from 'lucide-react'
import CocuklarModal from './CocuklarModal'
import AramaModal from './AramaModal'
import YardimModal from './YardimModal'
import KisiEkleModal from './KisiEkleModal'

interface Props {
  mahalle?: string
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 cursor-pointer ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={checked ? 'Evet — kapatmak için tıklayın' : 'Hayır — açmak için tıklayın'}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
            checked ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${checked ? 'text-green-600' : 'text-gray-400'}`}>
        {checked ? 'Evet' : 'Hayır'}
      </span>
    </div>
  )
}

type SortMode = 'newest' | 'az'

export default function KisiTable({ mahalle }: Props) {
  const [kisiler, setKisiler] = useState<Kisi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [mahalleFilter, setMahalleFilter] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [selectedKisiCocuk, setSelectedKisiCocuk] = useState<Kisi | null>(null)
  const [selectedKisiArama, setSelectedKisiArama] = useState<Kisi | null>(null)
  const [selectedKisiYardim, setSelectedKisiYardim] = useState<Kisi | null>(null)
  const [showKisiEkle, setShowKisiEkle] = useState(false)
  const [editKisi, setEditKisi] = useState<Kisi | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchKisiler = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase.from('kisiler').select('*')
      if (mahalle) {
        query = query.eq('mahalle', mahalle)
      }
      if (sortMode === 'newest') {
        query = query.order('created_at', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('ad', { ascending: true })
      }
      const { data, error } = await query
      if (error) throw error
      setKisiler(data || [])
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [mahalle, sortMode])

  useEffect(() => {
    fetchKisiler()
  }, [fetchKisiler])

  async function toggleField(kisi: Kisi, field: 'ramazan_kumanyasi' | 'bot_mont') {
    const newValue = !kisi[field]
    setKisiler((prev) => prev.map((k) => (k.id === kisi.id ? { ...k, [field]: newValue } : k)))

    try {
      const { error } = await supabase
        .from('kisiler')
        .update({ [field]: newValue })
        .eq('id', kisi.id)
      if (error) throw error
      showToast('Güncellendi.', 'success')
    } catch (err: unknown) {
      setKisiler((prev) => prev.map((k) => (k.id === kisi.id ? { ...k, [field]: !newValue } : k)))
      showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
    }
  }

  function handleCocukSayisiChanged(kisiId: string, newCount: number) {
    setKisiler((prev) => prev.map((k) => (k.id === kisiId ? { ...k, cocuk_sayisi: newCount } : k)))
  }

  const mahalleler = !mahalle
    ? Array.from(new Set(kisiler.map((k) => k.mahalle).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'tr')
      )
    : []

  const filteredKisiler = kisiler.filter((kisi) => {
    if (mahalleFilter && kisi.mahalle !== mahalleFilter) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      kisi.ad.toLowerCase().includes(term) ||
      kisi.soyad.toLowerCase().includes(term) ||
      kisi.tc_no.includes(term) ||
      kisi.telefon.includes(term) ||
      kisi.mahalle.toLowerCase().includes(term)
    )
  })

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
          onClick={fetchKisiler}
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
        <div
          className={`fixed top-6 right-6 z-60 px-6 py-3.5 rounded-xl shadow-lg text-white text-base font-medium ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          {mahalle ? `${mahalle} Mahallesi` : 'Kişi Listesi'}
        </h2>
        <button
          onClick={() => setShowKisiEkle(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-lg font-medium transition-colors"
        >
          <UserPlus size={22} />
          Yeni Kişi Ekle
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ad, soyad, TC veya telefon ile ara..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        {!mahalle && mahalleler.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              value={mahalleFilter}
              onChange={(e) => setMahalleFilter(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-colors min-w-[180px]"
            >
              <option value="">Tüm Mahalleler</option>
              {mahalleler.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => setSortMode(sortMode === 'newest' ? 'az' : 'newest')}
          className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          title="Sıralama değiştir"
        >
          <ArrowUpDown size={18} />
          {sortMode === 'newest' ? 'En Yeni Önce' : 'A-Z Sıralı'}
        </button>
      </div>

      {kisiler.length > 0 && (
        <p className="text-gray-400 text-base mb-3">
          {filteredKisiler.length} / {kisiler.length} kişi gösteriliyor
        </p>
      )}

      {filteredKisiler.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">
          {kisiler.length === 0 ? 'Kayıtlı kişi bulunamadı.' : 'Aramanızla eşleşen sonuç yok.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-3 text-sm font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Soyad</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">TC</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Telefon</th>
                {!mahalle && (
                  <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Mahalle</th>
                )}
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Çocuk</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Ramazan K.</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Bot/Mont</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Arama/Not</th>
                <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Yardımlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredKisiler.map((kisi, idx) => (
                <tr
                  key={kisi.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="py-4 px-3 text-center">
                    <button
                      onClick={() => setEditKisi(kisi)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Pencil size={17} />
                    </button>
                  </td>
                  <td className="py-4 px-4 text-[17px] font-medium text-gray-800">{kisi.ad}</td>
                  <td className="py-4 px-4 text-[17px] font-medium text-gray-800">{kisi.soyad}</td>
                  <td className="py-4 px-4 text-[17px] text-gray-600 font-mono tracking-wide">{kisi.tc_no}</td>
                  <td className="py-4 px-4 text-[17px] text-gray-600">{kisi.telefon}</td>
                  {!mahalle && (
                    <td className="py-4 px-4 text-[17px] text-gray-600">{kisi.mahalle}</td>
                  )}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setSelectedKisiCocuk(kisi)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-[17px] font-semibold transition-colors cursor-pointer"
                    >
                      <Baby size={18} />
                      {kisi.cocuk_sayisi}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <ToggleSwitch
                        checked={kisi.ramazan_kumanyasi}
                        onChange={() => toggleField(kisi, 'ramazan_kumanyasi')}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <ToggleSwitch
                        checked={kisi.bot_mont}
                        onChange={() => toggleField(kisi, 'bot_mont')}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setSelectedKisiArama(kisi)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-[17px] font-medium transition-colors cursor-pointer"
                    >
                      <Phone size={18} />
                      Görüntüle
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setSelectedKisiYardim(kisi)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-[17px] font-medium transition-colors cursor-pointer"
                    >
                      <HandHeart size={18} />
                      Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedKisiCocuk && (
        <CocuklarModal
          kisi={selectedKisiCocuk}
          onClose={() => setSelectedKisiCocuk(null)}
          onCocukSayisiChanged={handleCocukSayisiChanged}
          showToast={showToast}
        />
      )}

      {selectedKisiArama && (
        <AramaModal
          kisi={selectedKisiArama}
          onClose={() => setSelectedKisiArama(null)}
          showToast={showToast}
        />
      )}

      {selectedKisiYardim && (
        <YardimModal
          kisi={selectedKisiYardim}
          onClose={() => setSelectedKisiYardim(null)}
          showToast={showToast}
        />
      )}

      {showKisiEkle && (
        <KisiEkleModal
          onClose={() => setShowKisiEkle(false)}
          onSaved={fetchKisiler}
          showToast={showToast}
        />
      )}

      {editKisi && (
        <KisiEkleModal
          kisi={editKisi}
          onClose={() => setEditKisi(null)}
          onSaved={fetchKisiler}
          showToast={showToast}
        />
      )}
    </div>
  )
}
