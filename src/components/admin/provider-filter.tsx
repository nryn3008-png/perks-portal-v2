'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Database } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
}

interface ProviderFilterProps {
  value: string | null;
  onChange: (providerId: string | null) => void;
}

export function ProviderFilter({ value, onChange }: ProviderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/providers');
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProviders();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProvider = providers.find((p) => p.id === value);
  const displayLabel = selectedProvider ? selectedProvider.name : 'All Providers';

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
        <Database className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[13px] text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium
          border transition-all duration-150
          ${value
            ? 'border-[#0038FF]/20 bg-[#0038FF]/5 text-[#0038FF]'
            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
          }
        `}
      >
        <Database className="h-3.5 w-3.5" />
        <span>{displayLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
          {/* All Providers option */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`
              flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]
              transition-colors duration-100
              ${!value ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            {!value && <Check className="h-3.5 w-3.5 text-[#0038FF]" />}
            {value && <span className="w-3.5" />}
            <span>All Providers</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Provider options */}
          {providers.map((provider) => {
            const isSelected = value === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  onChange(provider.id);
                  setIsOpen(false);
                }}
                className={`
                  flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]
                  transition-colors duration-100
                  ${isSelected ? 'text-gray-900 bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}
                `}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-[#0038FF]" />}
                {!isSelected && <span className="w-3.5" />}
                <span>{provider.name}</span>
                {provider.is_default && (
                  <span className="ml-auto text-[11px] text-gray-400">(Default)</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
