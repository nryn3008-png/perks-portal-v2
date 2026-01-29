'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  logo?: string | null;
  verified?: boolean;
}

export function ClientsGrid({ clients }: { clients: Client[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = clients.length > 12;
  const visible = expanded ? clients : clients.slice(0, 12);
  const hiddenCount = clients.length - 12;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visible.map((client) => (
          <div
            key={client.id}
            className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center p-4">
              {client.logo ? (
                <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm mb-2">
                  <Image
                    src={client.logo}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100 mb-2">
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-medium text-gray-700 text-center line-clamp-2">
                  {client.name}
                </span>
                {client.verified && (
                  <BadgeCheck
                    className="h-4 w-4 text-[#0038FF] flex-shrink-0"
                    aria-label="Verified"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-[13px] text-[#0038FF] hover:text-[#0030E0] font-medium transition-colors cursor-pointer"
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              And {hiddenCount} more client{hiddenCount !== 1 ? 's' : ''}
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </>
  );
}
