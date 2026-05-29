import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className={clsx(
                'relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full',
                width
              )}>
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-100">
                  <div>
                    <Dialog.Title as="h2" className="text-base font-semibold text-slate-900">
                      {title}
                    </Dialog.Title>
                    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

