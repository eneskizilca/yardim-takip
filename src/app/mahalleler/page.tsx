'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, MapPin, Users, Search } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import Link from 'next/link'

interface MahalleInfo {
  mahalle: string
  kisi_sayisi: number
}

export default function MahallelerPage() {
  const [mahalleler, setMahalleler] = useState<MahalleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTerm, setFilterTerm] = useState('')

  useEffect(() => {
    fetchMahalleler()
  }, [])

  async function fetchMahalleler() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('kisiler').select('mahalle')
      if (error) throw error

      const mahalleMap = new Map<string, number>()
        ; (data || []).forEach((item) => {
          const m = item.mahalle || 'Belirtilmemiş'
          mahalleMap.set(m, (mahalleMap.get(m) || 0) + 1)
        })

      const result = Array.from(mahalleMap.entries())
        .map(([mahalle, kisi_sayisi]) => ({ mahalle, kisi_sayisi }))
        .sort((a, b) => a.mahalle.localeCompare(b.mahalle, 'tr'))

      setMahalleler(result)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const filteredMahalleler = mahalleler.filter((m) => {
    if (!filterTerm) return true
    return m.mahalle.toLowerCase().includes(filterTerm.toLowerCase())
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
          onClick={fetchMahalleler}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-lg font-medium transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mahalleler</h2>

      {mahalleler.length > 0 && (
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              placeholder="Mahalle adı ile filtrele..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          {mahalleler.length > 0 && (
            <p className="text-gray-400 text-base mt-2">
              {filteredMahalleler.length} / {mahalleler.length} mahalle gösteriliyor (A-Z sıralı)
            </p>
          )}
        </div>
      )}

      {mahalleler.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">Kayıtlı mahalle bulunamadı.</p>
      ) : filteredMahalleler.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-12">Filtreyle eşleşen mahalle yok.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMahalleler.map((m) => (
            <Link
              key={m.mahalle}
              href={`/mahalleler/${encodeURIComponent(m.mahalle)}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-4 md:px-6 md:py-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <MapPin size={28} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">{m.mahalle}</h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-base mt-0.5">
                  <Users size={16} />
                  {m.kisi_sayisi} kişi
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
