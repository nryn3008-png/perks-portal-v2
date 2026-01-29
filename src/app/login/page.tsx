/**
 * API Key Login Page
 *
 * Shown ONLY on non-Bridge domains (localhost, vercel.app, etc.)
 * where cookie-based Bridge session auth is unavailable.
 *
 * Users paste their Bridge API key to authenticate.
 * The key is validated server-side and stored as an HttpOnly cookie.
 *
 * This page is never shown on *.brdg.app — those domains redirect
 * to Bridge login directly via middleware.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    if (!apiKey.trim()) return;

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid API key');
        return;
      }

      // Redirect to home on success
      router.push('/');
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-50/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-50/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div
        className="
          w-full max-w-md
          rounded-2xl overflow-hidden
          bg-white/70 backdrop-blur-xl
          border border-white/20
          shadow-[0_8px_32px_rgba(0,0,0,0.08)]
        "
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none rounded-2xl" />

        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0038FF]/10 mb-4">
              <svg
                className="w-6 h-6 text-[#0038FF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Perks Portal
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Development / External Access
            </p>
          </div>

          {/* Instructions */}
          <p className="text-[13px] text-gray-500 mb-6 text-center leading-relaxed">
            Paste your Bridge API key to authenticate.
            <br />
            <a
              href="https://app.brdg.app/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0038FF] hover:text-[#0030E0] transition-colors"
            >
              Get your API key from Bridge Settings
            </a>
          </p>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="sr-only">
                Bridge API Key
              </label>
              <input
                id="api-key"
                type="password"
                placeholder="Bridge API Key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className={`
                  w-full px-4 py-3 rounded-xl
                  text-sm text-gray-900 placeholder-gray-400
                  bg-gray-50/80 border
                  ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200/60 focus:ring-[#0038FF]/20 focus:border-[#0038FF]/40'}
                  focus:outline-none focus:ring-2
                  transition-all duration-150
                `}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Connect button */}
            <Button
              onClick={handleConnect}
              isLoading={isLoading}
              disabled={!apiKey.trim()}
              size="lg"
              className="w-full rounded-xl"
            >
              Connect
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-gray-400 text-center mt-6">
            Your API key is stored securely as an HttpOnly cookie
          </p>
        </div>
      </div>
    </div>
  );
}
