import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    // 4秒後に自動削除
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const typeStyles = {
    success: 'bg-gray-800 text-white',
    error: 'bg-gray-800 text-white',
    info: 'bg-gray-800 text-white'
  }

  const typeIcons = {
    success: '●',
    error: '●',
    info: '●'
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* トースト表示エリア */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${typeStyles[toast.type]} px-6 py-4 rounded-lg shadow-lg max-w-md flex items-start gap-3 animate-in slide-in-from-top-2 duration-300`}
          >
            <span className="text-lg">{typeIcons[toast.type]}</span>
            <div className="flex-1">
              <div className="whitespace-pre-line text-sm">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}