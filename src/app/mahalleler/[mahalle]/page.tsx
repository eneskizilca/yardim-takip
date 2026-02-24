'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import KisiTable from '@/components/KisiTable'

export default function MahalleDetayPage() {
  const params = useParams()
  const mahalle = decodeURIComponent(params.mahalle as string)

  return (
    <div>
      <div className="mb-5">
        <Link
          href="/mahalleler"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-lg font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          Mahallelere Dön
        </Link>
      </div>
      <KisiTable mahalle={mahalle} />
    </div>
  )
}
