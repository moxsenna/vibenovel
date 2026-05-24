import React from 'react'

interface BottomNavBarProps {
  activePage?: 'home' | 'write' | 'collection' | 'profile'
  onNavigate?: (page: string) => void
}

const NAV_ITEMS = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'write', icon: 'edit_note', label: 'Menulis', filled: true },
  { id: 'collection', icon: 'auto_stories', label: 'Koleksi' },
  { id: 'profile', icon: 'person', label: 'Profil' }
]

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage = 'home', onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container/90 backdrop-blur-lg border-t border-outline-variant/10 shadow-[0_-4px_12px_rgba(0,0,0,0.5)] rounded-t-xl">
    {NAV_ITEMS.map((item) => {
      const isActive = activePage === item.id
      return (
        <button
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
          className={`flex flex-col items-center justify-center transition-colors p-2 ${
            isActive
              ? 'text-primary bg-primary-container/20 rounded-xl px-4 py-1 translate-y-[-2px]'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined mb-1"
            style={item.filled && isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {item.icon}
          </span>
          <span className={`text-label-md text-[10px] ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
        </button>
      )
    })}
  </nav>
)
