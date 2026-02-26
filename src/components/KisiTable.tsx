'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Kisi, Cocuk } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { Phone, Baby, UserPlus, Loader2, Search, Pencil, ArrowUpDown, Filter, HandHeart, FileSpreadsheet, X, Trash2 } from 'lucide-react'
import XLSX from 'xlsx-js-style'
import CocuklarModal from './CocuklarModal'
import AramaModal from './AramaModal'
import YardimModal from './YardimModal'
import KisiEkleModal from './KisiEkleModal'

interface Props {
  mahalle?: string
  referans?: string
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-0.5">
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer ${checked ? 'bg-green-500' : 'bg-gray-300'
          }`}
        title={checked ? 'Evet — kapatmak için tıklayın' : 'Hayır — açmak için tıklayın'}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'
            }`}
        />
      </button>
      {label && (
        <span className={`text-sm font-medium md:text-xs ${checked ? 'text-green-600' : 'text-gray-400'}`}>
          {label}
        </span>
      )}
      {!label && (
        <span className={`hidden md:inline text-xs font-medium ${checked ? 'text-green-600' : 'text-gray-400'}`}>
          {checked ? 'Evet' : 'Hayır'}
        </span>
      )}
    </div>
  )
}

type SortMode = 'newest' | 'az'

export default function KisiTable({ mahalle, referans }: Props) {
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
  const [exporting, setExporting] = useState(false)
  const [filterRamazan, setFilterRamazan] = useState(false)
  const [filterBotMont, setFilterBotMont] = useState(false)
  const [referansKisi, setReferansKisi] = useState<Kisi | null>(null)
  const [editingReferans, setEditingReferans] = useState(false)
  const [editReferansValue, setEditReferansValue] = useState('')
  const [deletingReferans, setDeletingReferans] = useState(false)

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
        if (mahalle === 'Belirtilmemiş') {
          query = query.or('mahalle.is.null,mahalle.eq.')
        } else {
          query = query.eq('mahalle', mahalle)
        }
      }
      if (referans) {
        if (referans === 'Belirtilmeyenler') {
          query = query.or('referans.is.null,referans.eq.')
        } else {
          query = query.eq('referans', referans)
        }
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
  }, [mahalle, referans, sortMode])

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

      // Toggle true yapıldığında yardımlar tablosuna kayıt ekle
      if (newValue) {
        const yardimMetni = field === 'ramazan_kumanyasi'
          ? 'Ramazan kumanyası yardımı yapıldı.'
          : 'Bot/mont yardımı yapıldı.'
        await supabase
          .from('yardimlar')
          .insert({ kisi_id: kisi.id, yardim_icerigi: yardimMetni })
      }

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
    if (filterRamazan && kisi.ramazan_kumanyasi) return false
    if (filterBotMont && kisi.bot_mont) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      kisi.ad?.toLowerCase().includes(term) ||
      kisi.soyad?.toLowerCase().includes(term) ||
      (kisi.tc_no ?? '').includes(term) ||
      (kisi.telefon ?? '').includes(term) ||
      kisi.mahalle?.toLowerCase().includes(term)
    )
  })

  async function exportToExcel() {
    try {
      setExporting(true)

      // Tüm çocukları tek seferde çek
      const kisiIds = filteredKisiler.map((k) => k.id)
      let allCocuklar: Cocuk[] = []
      if (kisiIds.length > 0) {
        const { data } = await supabase
          .from('cocuklar')
          .select('*')
          .in('ebeveyn_id', kisiIds)
          .order('yas', { ascending: true })
        allCocuklar = data || []
      }

      // Çocukları ebeveyn_id'ye göre grupla
      const cocukMap = new Map<string, Cocuk[]>()
      allCocuklar.forEach((c) => {
        const list = cocukMap.get(c.ebeveyn_id) || []
        list.push(c)
        cocukMap.set(c.ebeveyn_id, list)
      })

      const rows = filteredKisiler.map((kisi, idx) => {
        const cocuklar = cocukMap.get(kisi.id) || []
        const cocukDetay = cocuklar.length > 0
          ? cocuklar.map((c) => `${c.yas} yaş ${c.cinsiyet}`).join(', ')
          : '-'

        return {
          'No': idx + 1,
          'Ad': kisi.ad || '',
          'Soyad': kisi.soyad || '',
          'TC': kisi.tc_no || '',
          'Telefon': kisi.telefon || '',
          'Mahalle': kisi.mahalle || '',
          'Adres': kisi.adres || '',
          'Çocuk': kisi.cocuk_sayisi ?? 0,
          'Çocuk Detayları': cocukDetay,
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // Adres sütunu genişliğini veriye göre hesapla
      const adresMaxLen = Math.max(5, ...rows.map((r) => (r['Adres'] || '').length))
      const adresWch = Math.min(adresMaxLen + 2, 60)

      const cocukDetayMaxLen = Math.max(5, ...rows.map((r) => (r['Çocuk Detayları'] || '').length))
      const cocukDetayWch = Math.min(cocukDetayMaxLen + 2, 60)

      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 3 },   // No
        { wch: 15 },  // Ad
        { wch: 15 },  // Soyad
        { wch: 12 },  // TC
        { wch: 12 },  // Telefon
        { wch: 15 },  // Mahalle
        { wch: adresWch },  // Adres (otomatik)
        { wch: 6 },  // Çocuk
        { wch: cocukDetayWch },  // Çocuk Detayları
      ]

      // Stil tanımları
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
        fill: { fgColor: { rgb: '2E7D32' } },
        alignment: { horizontal: 'center' as const, vertical: 'center' as const },
        border: {
          top: { style: 'thin' as const, color: { rgb: '1B5E20' } },
          bottom: { style: 'thin' as const, color: { rgb: '1B5E20' } },
          left: { style: 'thin' as const, color: { rgb: '1B5E20' } },
          right: { style: 'thin' as const, color: { rgb: '1B5E20' } },
        },
      }

      const evenRowStyle = {
        fill: { fgColor: { rgb: 'E8F5E9' } },
        border: {
          top: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          bottom: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          left: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          right: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
        },
        alignment: { vertical: 'center' as const },
      }

      const oddRowStyle = {
        fill: { fgColor: { rgb: 'FFFFFF' } },
        border: {
          top: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          bottom: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          left: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
          right: { style: 'thin' as const, color: { rgb: 'C8E6C9' } },
        },
        alignment: { vertical: 'center' as const },
      }

      // Hücrelere stil uygula
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      const colCount = range.e.c + 1

      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[addr]) ws[addr] = { v: '' }
          if (R === 0) {
            ws[addr].s = headerStyle
          } else {
            ws[addr].s = R % 2 === 0 ? evenRowStyle : oddRowStyle
          }
        }
      }

      // Satır yüksekliklerini ayarla
      ws['!rows'] = [{ hpt: 28 }]
      for (let i = 1; i <= range.e.r; i++) {
        ws['!rows'].push({ hpt: 22 })
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Kişi Listesi')
      XLSX.writeFile(wb, 'kisi-listesi.xlsx')
      showToast('Excel dosyası indirildi.', 'success')
    } catch (err: unknown) {
      showToast('Excel oluşturulamadı: ' + getErrorMessage(err), 'error')
    } finally {
      setExporting(false)
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
          className={`fixed top-6 left-4 right-4 md:left-auto md:right-6 z-60 px-6 py-3.5 rounded-xl shadow-lg text-white text-base font-medium text-center md:text-left ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header: Başlık + Butonlar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          {mahalle ? `${mahalle} Mahallesi` : referans ? `Referans: ${referans}` : 'Kişi Listesi'}
        </h2>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={exportToExcel}
            disabled={exporting || filteredKisiler.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm md:text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <span className="hidden sm:inline">{exporting ? 'Hazırlanıyor...' : "Excel'e Aktar"}</span>
            <span className="sm:hidden">{exporting ? '...' : 'Excel'}</span>
          </button>
          <button
            onClick={() => setShowKisiEkle(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm md:text-lg font-medium transition-colors"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Yeni Kişi Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>
      </div>

      {/* Arama + Filtre Çubuğu */}
      <div className="flex flex-col gap-2 md:flex-row md:gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ad, soyad, TC veya telefon ile ara..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base md:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex gap-2 md:gap-3">
          {!mahalle && mahalleler.length > 0 && (
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <select
                value={mahalleFilter}
                onChange={(e) => setMahalleFilter(e.target.value)}
                className="w-full md:w-auto pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm md:text-base font-medium text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-colors md:min-w-[180px]"
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
            className="flex items-center gap-2 px-3 md:px-4 py-3 border border-gray-200 rounded-xl text-sm md:text-base font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
            title="Sıralama değiştir"
          >
            <ArrowUpDown size={18} />
            <span className="hidden sm:inline">{sortMode === 'newest' ? 'En Yeni Önce' : 'A-Z Sıralı'}</span>
            <span className="sm:hidden">{sortMode === 'newest' ? 'Yeni' : 'A-Z'}</span>
          </button>
        </div>
      </div>

      {kisiler.length > 0 && (
        <p className="text-gray-400 text-sm md:text-base mb-3">
          {filteredKisiler.length} / {kisiler.length} kişi gösteriliyor
        </p>
      )}

      {filteredKisiler.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">
          {kisiler.length === 0 ? 'Kayıtlı kişi bulunamadı.' : 'Aramanızla eşleşen sonuç yok.'}
        </p>
      ) : (
        <>
          {/* === MASAÜSTÜ: Tablo Görünümü === */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ad</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Soyad</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">TC</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefon</th>
                  {!mahalle && (
                    <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mahalle</th>
                  )}
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Çocuk</th>
                  <th
                    className={`py-3 px-2 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer select-none transition-colors ${filterRamazan ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    onClick={() => setFilterRamazan((v) => !v)}
                    title={filterRamazan ? 'Filtreyi kaldır' : 'Almamışları göster'}
                  >
                    Ramazan K. {filterRamazan && '✕'}
                  </th>
                  <th
                    className={`py-3 px-2 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer select-none transition-colors ${filterBotMont ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    onClick={() => setFilterBotMont((v) => !v)}
                    title={filterBotMont ? 'Filtreyi kaldır' : 'Almamışları göster'}
                  >
                    Bot/Mont {filterBotMont && '✕'}
                  </th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Arama/Not</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Yardımlar</th>
                  <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ref</th>
                </tr>
              </thead>
              <tbody>
                {filteredKisiler.map((kisi, idx) => (
                  <tr
                    key={kisi.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                  >
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setEditKisi(kisi)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                    <td className="py-3 px-2 text-[15px] font-medium text-gray-800">{kisi.ad}</td>
                    <td className="py-3 px-2 text-[15px] font-medium text-gray-800">{kisi.soyad}</td>
                    <td className="py-3 px-2 text-[15px] text-gray-600 font-mono tracking-wide">{kisi.tc_no}</td>
                    <td className="py-3 px-2 text-[15px] text-gray-600">{kisi.telefon}</td>
                    {!mahalle && (
                      <td className="py-3 px-2 text-[15px] text-gray-600">{kisi.mahalle}</td>
                    )}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedKisiCocuk(kisi)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-[15px] font-semibold transition-colors cursor-pointer"
                      >
                        <Baby size={16} />
                        {kisi.cocuk_sayisi}
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={kisi.ramazan_kumanyasi}
                          onChange={() => toggleField(kisi, 'ramazan_kumanyasi')}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={kisi.bot_mont}
                          onChange={() => toggleField(kisi, 'bot_mont')}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedKisiArama(kisi)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-[15px] font-medium transition-colors cursor-pointer"
                      >
                        <Phone size={16} />
                        Görüntüle
                      </button>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedKisiYardim(kisi)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-[15px] font-medium transition-colors cursor-pointer"
                      >
                        <HandHeart size={16} />
                        Görüntüle
                      </button>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => { setReferansKisi(kisi); setEditingReferans(false); setDeletingReferans(false) }}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer font-bold text-sm ${kisi.referans ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                        title={kisi.referans || 'Referans yok'}
                      >
                        R
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* === MOBİL: Kart Görünümü === */}
          <div className="md:hidden space-y-3">
            {/* Mobil filtre butonları */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setFilterRamazan((v) => !v)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${filterRamazan
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
              >
                Ramazan K. {filterRamazan && '✕'}
              </button>
              <button
                onClick={() => setFilterBotMont((v) => !v)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${filterBotMont
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
              >
                Bot/Mont {filterBotMont && '✕'}
              </button>
            </div>

            {filteredKisiler.map((kisi) => (
              <div
                key={kisi.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                {/* Üst satır: Ad Soyad + Düzenle */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-800">
                    {kisi.ad} {kisi.soyad}
                  </h3>
                  <button
                    onClick={() => setEditKisi(kisi)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Bilgi satırları */}
                <div className="space-y-1 mb-3 text-sm text-gray-600">
                  {kisi.tc_no && (
                    <p className="font-mono tracking-wide">TC: {kisi.tc_no}</p>
                  )}
                  {kisi.telefon && (
                    <p>📞 {kisi.telefon}</p>
                  )}
                  {!mahalle && kisi.mahalle && (
                    <p>📍 {kisi.mahalle}</p>
                  )}
                </div>

                {/* Orta satır: Çocuk + Toggle'lar */}
                <div className="flex items-center gap-3 py-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedKisiCocuk(kisi)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Baby size={14} />
                    {kisi.cocuk_sayisi}
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-gray-400">Ramazan:</span>
                    <ToggleSwitch
                      checked={kisi.ramazan_kumanyasi}
                      onChange={() => toggleField(kisi, 'ramazan_kumanyasi')}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Bot:</span>
                    <ToggleSwitch
                      checked={kisi.bot_mont}
                      onChange={() => toggleField(kisi, 'bot_mont')}
                    />
                  </div>
                </div>

                {/* Alt satır: Aksiyon butonları */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedKisiArama(kisi)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Phone size={14} />
                    Arama/Not
                  </button>
                  <button
                    onClick={() => setSelectedKisiYardim(kisi)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <HandHeart size={14} />
                    Yardımlar
                  </button>
                  <button
                    onClick={() => { setReferansKisi(kisi); setEditingReferans(false); setDeletingReferans(false) }}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors font-bold text-sm ${kisi.referans ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                    title="Referans"
                  >
                    R
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Referans Popup */}
      {referansKisi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setReferansKisi(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl mx-4 p-6 max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReferansKisi(null)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-base">R</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {referansKisi.ad} {referansKisi.soyad}
              </h3>
            </div>

            {editingReferans ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editReferansValue}
                  onChange={(e) => setEditReferansValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Referans adı girin..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('kisiler').update({ referans: editReferansValue.trim() || null }).eq('id', referansKisi.id)
                        if (error) throw error
                        setKisiler((prev) => prev.map((k) => k.id === referansKisi.id ? { ...k, referans: editReferansValue.trim() || null } : k))
                        setReferansKisi({ ...referansKisi, referans: editReferansValue.trim() || null })
                        setEditingReferans(false)
                        showToast('Referans güncellendi.', 'success')
                      } catch (err: unknown) {
                        showToast('Güncelleme başarısız: ' + getErrorMessage(err), 'error')
                      }
                    }}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingReferans(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-base hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : deletingReferans ? (
              <div className="space-y-3">
                <p className="text-red-600 text-base">Referans bilgisini silmek istediğinize emin misiniz?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('kisiler').update({ referans: null }).eq('id', referansKisi.id)
                        if (error) throw error
                        setKisiler((prev) => prev.map((k) => k.id === referansKisi.id ? { ...k, referans: null } : k))
                        setReferansKisi({ ...referansKisi, referans: null })
                        setDeletingReferans(false)
                        showToast('Referans silindi.', 'success')
                      } catch (err: unknown) {
                        showToast('Silme başarısız: ' + getErrorMessage(err), 'error')
                      }
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-base font-medium hover:bg-red-700 transition-colors"
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={() => setDeletingReferans(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-base hover:bg-gray-50 transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-500 mb-1">Referans</p>
                  <p className="text-base text-gray-800 font-medium">
                    {referansKisi.referans || '—  Referans bilgisi girilmemiş.'}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setEditReferansValue(referansKisi.referans || ''); setEditingReferans(true); setDeletingReferans(false) }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={14} />
                    Düzenle
                  </button>
                  {referansKisi.referans && (
                    <button
                      onClick={() => { setDeletingReferans(true); setEditingReferans(false) }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Sil
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
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
