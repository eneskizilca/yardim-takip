'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, PhoneCall, MapPin, HandHeart, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

const menuItems = [
  { href: '/', label: 'Kişi Listesi', icon: ClipboardList },
  { href: '/arama-gecmisi', label: 'Tüm Arama/Notlar', icon: PhoneCall },
  { href: '/yardimlar', label: 'Tüm Yardımlar', icon: HandHeart },
  { href: '/mahalleler', label: 'Mahalleler', icon: MapPin },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-30">
      <div className="px-6 py-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
          Yardım Takip
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Otomasyon Sistemi</p>
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
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1.5 text-[17px] font-medium transition-colors ${
                isActive
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
  )
}
