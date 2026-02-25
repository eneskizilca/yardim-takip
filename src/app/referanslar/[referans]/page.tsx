'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import KisiTable from '@/components/KisiTable'

export default function ReferansDetayPage() {
    const params = useParams()
    const referans = decodeURIComponent(params.referans as string)

    return (
        <div>
            <div className="mb-5">
                <Link
                    href="/referanslar"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-base md:text-lg font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Referanslara Dön
                </Link>
            </div>
            <KisiTable referans={referans} />
        </div>
    )
}
