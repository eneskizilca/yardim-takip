'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-40 md:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Menüyü aç"
                >
                    <Menu size={24} />
                </button>
                <h1 className="ml-3 text-lg font-bold text-gray-800 tracking-tight">Yardım Takip</h1>
            </header>

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="pt-14 md:pt-0 ml-0 md:ml-64 min-h-screen bg-white px-4 md:px-10 py-5 md:pt-5 md:pb-8 overflow-x-hidden">
                {children}
            </main>
        </>
    )
}
