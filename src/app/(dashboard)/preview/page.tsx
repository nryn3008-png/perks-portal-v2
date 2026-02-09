/**
 * Preview Index — Lists all available UI previews
 *
 * URL: /preview
 *
 * Allows stakeholders to browse restricted/gated pages
 * without needing specific access states.
 */

import Link from 'next/link';
import { Eye, ShieldX, Mail, Scan } from 'lucide-react';

const PREVIEWS = [
  {
    title: 'Access Restricted (Work Email)',
    description: 'Page shown when a user\'s work email domain doesn\'t match any partner VC portfolio.',
    href: '/preview/access-restricted',
    icon: ShieldX,
  },
  {
    title: 'Access Restricted (Personal Email)',
    description: 'Page shown when a user only has a personal email — prompts them to connect a work email.',
    href: '/preview/access-restricted-personal',
    icon: Mail,
  },
  {
    title: 'Access Gate Animation',
    description: 'Full 8-second domain scanning animation → granted screen. Forces the animation to play.',
    href: '/preview/access-gate',
    icon: Scan,
  },
];

export default function PreviewIndexPage() {
  return (
    <div className="max-w-2xl mx-auto pt-12 pb-16 px-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
          <Eye className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0D1531]">UI Previews</h1>
          <p className="text-[13px] text-[#676C7E]">
            Preview access-restricted and gated pages
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PREVIEWS.map((preview) => (
          <Link
            key={preview.href}
            href={preview.href}
            className="flex items-start gap-4 rounded-xl border border-[#ECEDF0] bg-white p-5 hover:border-[#0038FF]/30 hover:shadow-sm transition-all duration-150 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2F3F5] group-hover:bg-[#0038FF]/10 transition-colors duration-150">
              <preview.icon className="h-5 w-5 text-[#81879C] group-hover:text-[#0038FF] transition-colors duration-150" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#0D1531] group-hover:text-[#0038FF] transition-colors duration-150">
                {preview.title}
              </h2>
              <p className="text-[13px] text-[#676C7E] mt-0.5">
                {preview.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
