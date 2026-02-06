import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ClientsGrid } from '@/components/vendors/clients-grid';
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Users,
  Calendar,
  Globe,
  Linkedin,
  Facebook,
  Twitter,
  Briefcase,
  Factory,
  Play,
  FileText,
  Mail,
  User,
  Database,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Phone,
  Gift,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cookies } from 'next/headers';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createVendorsService, createPerksService, getVendorIntropathCounts } from '@/lib/api';
import { OfferCard } from '@/components/perks';
import { VendorCard } from '@/components/vendors';
import { findSimilarVendors } from '@/lib/similarity';
import type { GetProvenDeal, GetProvenVendor, VendorIntropathData } from '@/types';

/**
 * Admin Vendor Detail Page - MercuryOS Design System
 *
 * Design Philosophy:
 * - Fluid, modeless experience with horizontal flows
 * - Glassmorphic cards with backdrop blur and soft shadows
 * - Intent-driven layout - content responds to context
 * - Generous whitespace and breathing room
 * - Subtle animations and micro-interactions
 *
 * ADMIN ONLY: View vendor details from GetProven API
 *
 * VENDOR PROFILE: name, logo, description, story, website, video, brochure,
 * services, industries, employee range, founded, social links
 *
 * CLIENTS SECTION: name, logo, verified badge (only if verified=true)
 * Hidden entirely if no clients exist
 *
 * CONTACT SECTION: avatar, full name, position, email CTA, phone
 * Only relevant roles (owner, contact_person)
 * Shows all contacts with complete contact information
 */

interface AdminVendorDetailPageProps {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format employee range for display
 */
function formatEmployeeRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    return `${min} - ${max}`;
  }
  if (min !== null) {
    return `${min}+`;
  }
  if (max !== null) {
    return `Up to ${max}`;
  }
  return null;
}

/**
 * Get YouTube embed URL from video URL
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// MERCURY OS COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mercury Glass Card - Frosted glass effect container
 */
function GlassCard({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/70 backdrop-blur-xl
        border border-white/20
        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
        ${hover ? 'transition-all duration-300 ease-out hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Mercury Floating Panel - For sidebar actions
 */
function FloatingPanel({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        sticky top-6
        rounded-3xl overflow-hidden
        bg-gradient-to-b from-white/80 to-white/60
        backdrop-blur-2xl
        border border-white/30
        shadow-[0_24px_64px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)_inset]
        ${className}
      `}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Mercury Button - Primary action button
 */
function MercuryButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  const variants = {
    primary: `
      bg-[#0038FF]
      text-white font-medium
      shadow-[0_4px_16px_rgba(0,56,255,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset]
      hover:bg-[#0030E0] hover:shadow-[0_8px_24px_rgba(0,56,255,0.4)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/80 backdrop-blur-sm
      text-gray-700 font-medium
      border border-gray-200/60
      shadow-sm
      hover:bg-white hover:shadow-md
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent
      text-gray-600 font-medium
      hover:bg-gray-100/80
      active:scale-[0.98]
    `,
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-4 rounded-full
        text-sm tracking-wide
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 focus-visible:ring-offset-2
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </a>
  );
}


/**
 * Color Label Badge - Consistent tag styling
 */
function ColorLabel({
  text,
  color = 'grey',
}: {
  text: string;
  color?: 'green' | 'blue' | 'grey';
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-[#0038FF]/10 text-[#0038FF]',
    grey: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[13px] font-medium ${styles[color]}`}>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminVendorDetailPage({ params }: AdminVendorDetailPageProps) {
  const { id } = await params;

  // Get provider from database
  const provider = await getDefaultProvider();
  if (!provider) {
    notFound();
  }

  const client = createClientFromProvider(provider);
  const vendorsService = createVendorsService(client, provider.api_token);
  const perksService = createPerksService(client, provider.api_token);

  // Fetch all vendor data in parallel (including perks and all vendors for similarity)
  const [vendorResult, clientsResult, contactsResult, allUsersResult, perksResult, allVendorsResult] = await Promise.all([
    vendorsService.getVendorById(id),
    vendorsService.getVendorClients(id),
    vendorsService.getVendorContacts(id),
    vendorsService.getAllVendorUsers(id),
    perksService.getOffers(1, 1000), // Fetch all perks to filter client-side
    vendorsService.getVendors(1, 1000), // Fetch all vendors for similarity
  ]);

  if (!vendorResult.success || !vendorResult.data) {
    notFound();
  }

  const vendor = vendorResult.data;
  const clients = clientsResult.success ? clientsResult.data : [];
  const contacts = contactsResult.success ? contactsResult.data : [];
  const allUsers = allUsersResult.success ? allUsersResult.data : [];

  // Fetch intropath counts from Bridge API using logged-in user's token
  // This ensures counts reflect the user's own network connections
  const cookieStore = await cookies();
  const userToken = cookieStore.get('authToken')?.value || cookieStore.get('bridge_api_key')?.value;
  const intropathData: VendorIntropathData = await getVendorIntropathCounts(vendor.website, userToken);

  // Filter perks for this vendor
  const allPerks: GetProvenDeal[] = perksResult.success ? perksResult.data.data : [];
  const vendorPerks = allPerks.filter((perk) => perk.vendor_id === vendor.id);

  // Find similar vendors (vendors with similar services/industries that have perks)
  const allVendors: GetProvenVendor[] = allVendorsResult.success ? allVendorsResult.data.data : [];
  const similarVendors = findSimilarVendors(vendor, allVendors, allPerks, 4);

  // Count perks per vendor for display
  const perksCountMap = new Map<number, number>();
  for (const perk of allPerks) {
    perksCountMap.set(perk.vendor_id, (perksCountMap.get(perk.vendor_id) || 0) + 1);
  }

  const employeeRange = formatEmployeeRange(vendor.employee_min, vendor.employee_max);
  const hasSocialLinks = vendor.linkedin || vendor.facebook || vendor.twitter;
  const hasClients = clients.length > 0;
  const hasContacts = contacts.length > 0;
  const hasAllUsers = allUsers.length > 0;
  const videoEmbedUrl = vendor.video ? getYouTubeEmbedUrl(vendor.video) : null;

  // Intropath data from Bridge API
  const hasIntropathData = intropathData.intropathCount !== null && intropathData.intropathCount > 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
        {/* Back Navigation - Minimal */}
        <Link
          href="/admin/vendors"
          className="
            inline-flex items-center gap-2
            text-sm font-medium text-gray-500
            hover:text-gray-900
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2
            rounded-xl px-2 py-1 -ml-2
          "
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendors</span>
        </Link>

        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">

            {/* Hero Section - Mercury OS Module */}
            <GlassCard className="p-6">
              {/* Vendor Identity */}
              <div className="flex items-start gap-4 mb-6">
                {vendor.logo ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg ring-1 ring-black/5 flex-shrink-0">
                    <Image
                      src={vendor.logo}
                      alt=""
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Building2 className="w-10 h-10 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Primary service */}
                  {(vendor.primary_service || vendor.services?.[0]?.name) && (
                    <p className="text-sm font-medium text-[#0038FF] mb-1">
                      {vendor.primary_service || vendor.services[0].name}
                    </p>
                  )}

                  {/* Name */}
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                    {vendor.name}
                  </h1>

                  {/* Vendor groups */}
                  {vendor.vendor_groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vendor.vendor_groups.map((group) => (
                        <span
                          key={group.name}
                          className="inline-flex rounded-full bg-[#0038FF]/10 px-3 py-1 text-xs font-medium text-[#0038FF]"
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Perks Badge & Intropath Badge */}
              <div className="pt-6 border-t border-gray-200/50 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0038FF]/5 border border-[#0038FF]/10">
                  <Gift className="h-4 w-4 text-[#0038FF]" />
                  <span className="text-sm font-medium text-[#0038FF]">
                    {vendorPerks.length} {vendorPerks.length === 1 ? 'perk' : 'perks'} available
                  </span>
                </div>

                {/* Bridge Intropath Badge - Warm Connections */}
                {hasIntropathData && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0038FF]/5 border border-[#0038FF]/10">
                    <Sparkles className="h-4 w-4 text-[#0038FF]" />
                    <span className="text-sm font-medium text-[#0038FF]">
                      {intropathData.intropathCount} warm {intropathData.intropathCount === 1 ? 'connection' : 'connections'}
                    </span>
                    {intropathData.orgProfileUrl && (
                      <a
                        href={intropathData.orgProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-[#0038FF] hover:text-[#0030E0] transition-colors"
                        title="View on Bridge"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Description Section */}
            {vendor.description && (
              <GlassCard className="overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    About
                  </h2>
                  <div
                    className="prose prose-gray prose-sm max-w-none text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: vendor.description }}
                  />
                </div>
              </GlassCard>
            )}

            {/* Story Section */}
            {vendor.story && (
              <GlassCard className="overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Vendor Story
                  </h2>
                  <div
                    className="prose prose-gray prose-sm max-w-none text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: vendor.story }}
                  />
                </div>
              </GlassCard>
            )}

            {/* Video Section */}
            {videoEmbedUrl && (
              <GlassCard className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-gray-100">
                      <Play className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Video</h2>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <iframe
                      src={videoEmbedUrl}
                      title={`${vendor.name} video`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Services Section */}
            {vendor.services.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((service) => (
                    <ColorLabel key={service.name} text={service.name} color="grey" />
                  ))}
                </div>
              </section>
            )}

            {/* Industries Section */}
            {vendor.industries.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-[#0038FF]/10">
                    <Factory className="h-5 w-5 text-[#0038FF]" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Industries Served</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vendor.industries.map((industry) => (
                    <ColorLabel key={industry.name} text={industry.name} color="blue" />
                  ))}
                </div>
              </section>
            )}

            {/* Clients Section - Only show if clients exist */}
            {hasClients && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
                </div>
                <ClientsGrid clients={clients} />
              </section>
            )}

            {/* Available Perks Section */}
            <section className="pt-6 border-t border-gray-200/50">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Available Perks</h2>
                <p className="text-sm text-gray-500 mt-2">Offers from {vendor.name}</p>
              </div>
              {vendorPerks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {vendorPerks.map((perk) => (
                    <OfferCard
                      key={perk.id}
                      offer={perk}
                      vendorLogo={vendor.logo}
                      vendorName={vendor.name}
                      vendorPrimaryService={vendor.primary_service || vendor.services?.[0]?.name}
                    />
                  ))}
                </div>
              ) : (
                <GlassCard className="!rounded-xl">
                  <div className="flex flex-col items-center justify-center py-16">
                    <Gift className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-[14px] text-gray-500">No perks listed for this vendor on GetProven.</p>
                  </div>
                </GlassCard>
              )}
            </section>

            {/* Similar Vendors Section - Only show if there are similar vendors */}
            {similarVendors.length > 0 && (
              <section className="pt-6 border-t border-gray-200/50">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Similar Vendors</h2>
                  <p className="text-sm text-gray-500 mt-2">Vendors offering similar services</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {similarVendors.map((similarVendor) => (
                    <VendorCard
                      key={similarVendor.id}
                      vendor={similarVendor}
                      basePath="/admin/vendors"
                      perksCount={perksCountMap.get(similarVendor.id) || 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Raw API Data - Collapsible */}
            <section className="pt-6 border-t border-gray-200/50">
              <details className="group">
                <summary className="
                  flex items-center justify-between cursor-pointer
                  hover:opacity-80 transition-opacity duration-200
                  list-none
                  [&::-webkit-details-marker]:hidden
                ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100">
                      <Database className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-semibold text-gray-900">Raw API Data</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-90" />
                </summary>

                <div className="mt-6 space-y-6">
                  {/* Visibility Flags */}
                  <GlassCard className="!rounded-xl">
                    <div className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        {vendor.is_visible ? (
                          <Eye className="h-4 w-4 text-gray-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        Visibility Flags
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <dt className="text-gray-500 font-medium">is_visible</dt>
                          <dd className="mt-2">
                            {vendor.is_visible ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">true</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-medium text-red-700">false</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">is_visible_non_whitelisted</dt>
                          <dd className="mt-2">
                            {vendor.is_visible_non_whitelisted ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">true</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-medium text-red-700">false</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </GlassCard>

                  {/* External Links & Marketing Assets */}
                  <GlassCard className="!rounded-xl">
                    <div className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                        External Links & Marketing Assets
                      </h3>
                      <dl className="space-y-3 text-[13px]">
                        <div>
                          <dt className="text-gray-500 font-medium">Website</dt>
                          <dd className="mt-2">
                            {vendor.website ? (
                              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.website}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">GetProven Link</dt>
                          <dd className="mt-2">
                            <a href={vendor.getproven_link} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                              {vendor.getproven_link}
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Brochure</dt>
                          <dd className="mt-2">
                            {vendor.brochure ? (
                              <a href={vendor.brochure} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.brochure}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Video</dt>
                          <dd className="mt-2">
                            {vendor.video ? (
                              <a href={vendor.video} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.video}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">LinkedIn</dt>
                          <dd className="mt-2">
                            {vendor.linkedin ? (
                              <a href={vendor.linkedin.startsWith('http') ? vendor.linkedin : `https://linkedin.com/company/${vendor.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.linkedin}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Facebook</dt>
                          <dd className="mt-2">
                            {vendor.facebook ? (
                              <a href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.facebook}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Twitter</dt>
                          <dd className="mt-2">
                            {vendor.twitter ? (
                              <a href={vendor.twitter.startsWith('http') ? vendor.twitter : `https://twitter.com/${vendor.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.twitter}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </GlassCard>

                  {/* All Vendor Data (API) */}
                  <GlassCard className="!rounded-xl">
                    <div className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        All Vendor Data (API)
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <dt className="text-gray-500 font-medium">ID</dt>
                          <dd className="text-gray-900 font-mono">{vendor.id}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Slug</dt>
                          <dd className="text-gray-900 font-mono">{vendor.slug}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Name</dt>
                          <dd className="text-gray-900">{vendor.name}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Primary Service</dt>
                          <dd className="text-gray-900">{vendor.primary_service || vendor.services?.[0]?.name || <span className="text-gray-400">-</span>}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Founded</dt>
                          <dd className="text-gray-900">{vendor.founded || <span className="text-gray-400">-</span>}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Employee Range</dt>
                          <dd className="text-gray-900">
                            {vendor.employee_min !== null || vendor.employee_max !== null ? (
                              <>min: {vendor.employee_min ?? 'null'}, max: {vendor.employee_max ?? 'null'}</>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </dd>
                        </div>
                        {vendor.services.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500 font-medium">Services</dt>
                            <dd className="flex flex-wrap gap-1 mt-2">
                              {vendor.services.map((s, idx) => (
                                <span key={idx} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-gray-700">{s.name}</span>
                              ))}
                            </dd>
                          </div>
                        )}
                        {vendor.industries.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500 font-medium">Industries</dt>
                            <dd className="flex flex-wrap gap-1 mt-2">
                              {vendor.industries.map((i, idx) => (
                                <span key={idx} className="inline-flex rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF]">{i.name}</span>
                              ))}
                            </dd>
                          </div>
                        )}
                        {vendor.vendor_groups.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500 font-medium">Vendor Groups</dt>
                            <dd className="flex flex-wrap gap-1 mt-2">
                              {vendor.vendor_groups.map((g, idx) => (
                                <span key={idx} className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">{g.name}</span>
                              ))}
                            </dd>
                          </div>
                        )}
                        {vendor.logo && (
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500 font-medium">Logo URL</dt>
                            <dd>
                              <a href={vendor.logo} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] break-all">
                                {vendor.logo}
                              </a>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </GlassCard>

                  {/* All Clients Data (API) */}
                  {hasClients && (
                    <GlassCard className="!rounded-xl overflow-hidden">
                      <div className="p-6 pb-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Database className="h-4 w-4 text-gray-400" />
                          All Clients Data (API)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead className="bg-gray-50/80 border-y border-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">ID</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Logo</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Description</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Verified</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {clients.map((client) => (
                              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-gray-500">{client.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                <td className="px-6 py-4">
                                  {client.logo ? (
                                    <a href={client.logo} target="_blank" rel="noopener noreferrer" className="text-[#0038FF] hover:text-[#0030E0] truncate block max-w-[150px]">
                                      {client.logo.split('/').pop()}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                                  {client.description || <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-6 py-4">
                                  {client.verified ? (
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-medium text-emerald-700">true</span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-gray-700">false</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </GlassCard>
                  )}

                  {/* All Vendor Users (API - Unfiltered) */}
                  {hasAllUsers && (
                    <GlassCard className="!rounded-xl overflow-hidden">
                      <div className="p-6 pb-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          All Vendor Users (API - Unfiltered)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead className="bg-gray-50/80 border-y border-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">ID</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Email</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Position</th>
                              <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-gray-500">Roles</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-gray-500">{user.id}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {user.avatar ? (
                                      <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        <Image
                                          src={user.avatar}
                                          alt=""
                                          width={24}
                                          height={24}
                                          className="h-full w-full object-cover"
                                          unoptimized
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100">
                                        <User className="h-3 w-3 text-gray-400" />
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-900">
                                      {user.first_name} {user.last_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4">
                                  {user.phone ? (
                                    <span className="flex items-center gap-1 text-gray-600">
                                      <Phone className="h-3 w-3" />
                                      {user.phone}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                  {user.position || <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {user.roles.map((role, idx) => (
                                      <span key={idx} className="inline-flex rounded-full bg-[#0038FF]/10 px-2 py-0.5 text-[12px] font-medium text-[#0038FF]">
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </details>
            </section>
          </div>

          {/* Sidebar - Mercury Floating Panel */}
          <aside className="lg:self-start">
            <FloatingPanel>
              <div className="p-6">
                {/* Bridge Warm Connections Section */}
                {hasIntropathData && (
                  <div className="mb-6 -mx-6 -mt-6 px-6 py-5 bg-gradient-to-br from-[#0038FF]/5 via-[#0038FF]/[0.03] to-indigo-50/40 border-b border-[#0038FF]/10">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0038FF] to-[#0030E0] shadow-lg shadow-[#0038FF]/25">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#0038FF]/70 mb-1">
                          Warm Connections
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {intropathData.intropathCount}
                        </p>
                        <p className="text-[13px] text-gray-600 mt-1">
                          People in your network who can introduce you
                        </p>
                        {intropathData.orgProfileUrl && (
                          <a
                            href={intropathData.orgProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[#0038FF]/10 text-[#0038FF] text-[12px] font-medium hover:bg-[#0038FF]/20 transition-colors"
                          >
                            <span>View on Bridge</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Quick Actions
                </h3>

                {/* Primary CTA - GetProven link */}
                <MercuryButton
                  href={vendor.getproven_link}
                  variant="primary"
                  className="w-full mb-4"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on GetProven
                </MercuryButton>

                {/* Website */}
                {vendor.website && (
                  <MercuryButton
                    href={vendor.website}
                    variant="secondary"
                    className="w-full mb-4"
                  >
                    <Globe className="h-4 w-4" />
                    Visit Website
                  </MercuryButton>
                )}

                {/* Brochure */}
                {vendor.brochure && (
                  <MercuryButton
                    href={vendor.brochure}
                    variant="ghost"
                    className="w-full mb-4"
                  >
                    <FileText className="h-4 w-4" />
                    View Brochure
                  </MercuryButton>
                )}

                {/* Contact Section - Only if contacts exist */}
                {hasContacts && (
                  <div className="border-t border-gray-200/50 pt-6 mt-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400 mb-4">
                      Key Contacts
                    </p>
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-start gap-2">
                          {/* Avatar */}
                          {contact.avatar ? (
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-white shadow-sm">
                              <Image
                                src={contact.avatar}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 ring-2 ring-white shadow-sm">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 truncate">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.position && (
                              <p className="text-[12px] text-gray-500 truncate">
                                {contact.position}
                              </p>
                            )}
                            {/* Contact CTAs */}
                            <div className="flex items-center gap-2 mt-2">
                              <a
                                href={`mailto:${contact.email}`}
                                className="inline-flex items-center gap-1 text-[12px] text-[#0038FF] hover:text-[#0030E0] transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </a>
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="inline-flex items-center gap-1 text-[12px] text-[#0038FF] hover:text-[#0030E0] transition-colors"
                                >
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {hasSocialLinks && (
                  <div className="border-t border-gray-200/50 pt-6 mt-6">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Connect
                    </p>
                    <div className="flex gap-2">
                      {vendor.linkedin && (
                        <a
                          href={vendor.linkedin.startsWith('http') ? vendor.linkedin : `https://linkedin.com/company/${vendor.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 hover:scale-105"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {vendor.facebook && (
                        <a
                          href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 hover:scale-105"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {vendor.twitter && (
                        <a
                          href={vendor.twitter.startsWith('http') ? vendor.twitter : `https://twitter.com/${vendor.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 hover:scale-105"
                          aria-label="Twitter"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Company info */}
                <div className="border-t border-gray-200/50 pt-6 mt-6">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400 mb-4">
                    Company Info
                  </p>
                  <dl className="space-y-4 text-[13px]">
                    {(vendor.primary_service || vendor.services?.[0]?.name) && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <dt className="text-[12px] text-gray-400">Primary Service</dt>
                          <dd className="font-medium text-gray-900 truncate">
                            {vendor.primary_service || vendor.services[0].name}
                          </dd>
                        </div>
                      </div>
                    )}
                    {employeeRange && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <dt className="text-[12px] text-gray-400">Employees</dt>
                          <dd className="font-medium text-gray-900">{employeeRange}</dd>
                        </div>
                      </div>
                    )}
                    {vendor.founded && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Calendar className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <dt className="text-[12px] text-gray-400">Founded</dt>
                          <dd className="font-medium text-gray-900">{vendor.founded}</dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </FloatingPanel>
          </aside>
        </div>
    </div>
  );
}
