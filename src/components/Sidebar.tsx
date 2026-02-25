'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, PhoneCall, MapPin, HandHeart, LogOut, X, BookUser } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

const menuItems = [
  { href: '/', label: 'Kişi Listesi', icon: ClipboardList },
  { href: '/arama-gecmisi', label: 'Tüm Arama/Notlar', icon: PhoneCall },
  { href: '/yardimlar', label: 'Tüm Yardımlar', icon: HandHeart },
  { href: '/mahalleler', label: 'Mahalleler', icon: MapPin },
  { href: '/referanslar', label: 'Referanslar', icon: BookUser },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const { user } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Overlay — sadece mobilde, sidebar açıkken */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-50 transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-30`}
      >
        <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Yardım Takip
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Otomasyon Sistemi</p>
          </div>
          {/* Mobilde kapatma butonu */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors md:hidden"
            aria-label="Menüyü kapat"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1.5 text-[17px] font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          {user && (
            <p className="text-sm text-gray-400 px-4 mb-2 truncate">{user.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[17px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={22} strokeWidth={1.8} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  )
}
