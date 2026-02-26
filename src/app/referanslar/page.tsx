'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, BookUser, Users, Search } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import Link from 'next/link'

interface ReferansInfo {
    referans: string
    kisi_sayisi: number
}

export default function ReferanslarPage() {
    const [referanslar, setReferanslar] = useState<ReferansInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterTerm, setFilterTerm] = useState('')

    useEffect(() => {
        fetchReferanslar()
    }, [])

    async function fetchReferanslar() {
        try {
            setLoading(true)
            setError(null)
            const { data, error } = await supabase.from('kisiler').select('referans')
            if (error) throw error

            const refMap = new Map<string, number>()
                ; (data || []).forEach((item) => {
                    const r = item.referans?.trim() || 'Belirtilmeyenler'
                    refMap.set(r, (refMap.get(r) || 0) + 1)
                })

            const result = Array.from(refMap.entries())
                .map(([referans, kisi_sayisi]) => ({ referans, kisi_sayisi }))
                .sort((a, b) => a.referans.localeCompare(b.referans, 'tr'))

            setReferanslar(result)
        } catch (err: unknown) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const filteredReferanslar = referanslar.filter((r) => {
        if (!filterTerm) return true
        return r.referans.toLowerCase().includes(filterTerm.toLowerCase())
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
                    onClick={fetchReferanslar}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-lg font-medium transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Referanslar</h2>

            {referanslar.length > 0 && (
                <div className="mb-5">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            placeholder="Referans adı ile filtrele..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base md:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <p className="text-gray-400 text-sm md:text-base mt-2">
                        {filteredReferanslar.length} / {referanslar.length} referans gösteriliyor (A-Z sıralı)
                    </p>
                </div>
            )}

            {referanslar.length === 0 ? (
                <p className="text-center text-gray-500 text-lg py-12">Kayıtlı referans bulunamadı.</p>
            ) : filteredReferanslar.length === 0 ? (
                <p className="text-center text-gray-500 text-lg py-12">Filtreyle eşleşen referans yok.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReferanslar.map((r) => (
                        <Link
                            key={r.referans}
                            href={`/referanslar/${encodeURIComponent(r.referans)}`}
                            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-4 md:px-6 md:py-5 hover:border-indigo-300 hover:shadow-md transition-all group"
                        >
                            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                <BookUser size={28} className="text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 truncate">{r.referans}</h3>
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm md:text-base mt-0.5">
                                    <Users size={16} />
                                    {r.kisi_sayisi} kişi
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
