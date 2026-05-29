import React, { useState, Fragment } from 'react'
import { Combobox as HeadlessCombobox, Transition } from '@headlessui/react'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export function Combobox({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  error,
  containerClassName,
  className
}) {
  const [query, setQuery] = useState('')

  // Support either array of strings or array of { value, name } objects
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, name: opt } : opt
  )

  const filteredOptions = query === '' 
    ? normalizedOptions 
    : normalizedOptions.filter((option) =>
        option.name.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className={clsx('relative w-full', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </label>
      )}
      <HeadlessCombobox value={value} onChange={onChange}>
        <div className="relative">
          <HeadlessCombobox.Input
            className={clsx(
              'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 bg-white placeholder:text-slate-400 pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            displayValue={(val) => {
              const opt = normalizedOptions.find(o => o.value === val)
              return opt ? opt.name : ''
            }}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </HeadlessCombobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <HeadlessCombobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none border border-slate-100">
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none px-4 py-2 text-slate-500">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <HeadlessCombobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors',
                      active ? 'bg-brand text-white' : 'text-slate-900'
                    )
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span className={clsx('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                        {option.name}
                      </span>
                      {selected ? (
                        <span
                          className={clsx(
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                            active ? 'text-white' : 'text-brand'
                          )}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </HeadlessCombobox.Option>
              ))
            )}
          </HeadlessCombobox.Options>
        </Transition>
      </HeadlessCombobox>
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error.message || error}
        </p>
      )}
    </div>
  )
}
