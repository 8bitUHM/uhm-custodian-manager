'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'fail'

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [type, setType] = useState<ToastType>('success')

  const showToast = (msg: string, toastType: ToastType) => {
    setMessage(msg)
    setType(toastType)
  }

  const closeToast = () => {
    setMessage(null)
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        closeToast()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    fail: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      iconBg: 'bg-red-100'
    }
  }

  const style = styles[type]
  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}
          >
            <div className={`${style.iconBg} p-2 rounded-full`}>
              <Icon className={`h-5 w-5 ${style.icon}`} />
            </div>
            <p className={`flex-1 ${style.text} font-medium`}>{message}</p>
            <button
              onClick={closeToast}
              className={`${style.text} hover:opacity-70 transition-opacity`}
              aria-label={`Close ${type} message`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
