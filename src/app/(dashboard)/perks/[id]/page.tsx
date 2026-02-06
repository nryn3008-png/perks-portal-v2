import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Check,
  ChevronRight,
  Gift,
  Shield,
  Info,
} from 'lucide-react';
import { CopyButton, OfferCard } from '@/components/perks';
import { RedeemButton } from '@/components/perks/redeem-button';
import { getDefaultProvider } from '@/lib/providers';
import { createClientFromProvider, createPerksService, createVendorsService } from '@/lib/api';
import { findSimilarPerks } from '@/lib/similarity';
import { resolveAuthWithAccounts } from '@/lib/bridge/auth';
import { accessService } from '@/lib/api/access-service';
import type { GetProvenDeal, GetProvenVendor } from '@/types';

/**
 * Mercury OS-Inspired Offer Detail Page
 *
 * Design Philosophy:
 * - Fluid, modeless experience with horizontal flows
 * - Glassmorphic cards with backdrop blur and soft shadows
 * - Intent-driven layout - content responds to context
 * - Generous whitespace and breathing room
 * - Subtle animations and micro-interactions
 * - Focus on content, minimal chrome
 */

interface OfferDetailPageProps {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function formatValue(value: number | null): string {
  if (!value) return '';
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDiscount(discount: number | null, discountType: string | null): string | null {
  if (!discount) return null;
  if (discountType === 'percentage') {
    return `${discount}%`;
  }
  return `$${discount.toLocaleString()}`;
}

function hasRedemptionDetails(offer: GetProvenDeal): boolean {
  return !!(
    offer.redeem_steps ||
    offer.coupon_code ||
    offer.contact_email ||
    offer.details_url
  );
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
 * Mercury Value Pill - Compact value display
 */
function ValuePill({
  label,
  value,
  variant = 'default'
}: {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'accent';
}) {
  const variants = {
    default: 'from-gray-50 to-gray-100/80 text-gray-700',
    success: 'from-emerald-50 to-emerald-100/80 text-emerald-700',
    accent: 'from-indigo-50 to-indigo-100/80 text-indigo-700',
  };

  return (
    <div className={`
      min-w-[140px] px-4 py-4 rounded-2xl
      bg-gradient-to-r ${variants[variant]}
      border border-white/60
      shadow-sm
    `}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-60">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

/**
 * Color Label Badge - Matches OfferCard styling
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
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[color]}`}
    >
      {text}
    </span>
  );
}

/**
 * Mercury Badge - Minimal tag display (for deal type)
 */
function MercuryBadge({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'subtle';
}) {
  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${variant === 'subtle'
        ? 'bg-gray-100/80 text-gray-600'
        : 'bg-white/80 text-gray-700 border border-gray-200/50 shadow-sm'
      }
    `}>
      {children}
    </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;

  // Get provider from database
  const provider = await getDefaultProvider();
  if (!provider) {
    notFound();
  }

  // Access check — redirect to /perks if not granted (shows restricted page there)
  const { authenticated, user } = await resolveAuthWithAccounts();
  if (!authenticated || !user) {
    redirect('/perks');
  }
  const access = await accessService.resolveAccess(user, provider.id);
  if (!access.granted) {
    redirect('/perks');
  }

  const client = createClientFromProvider(provider);
  const perksService = createPerksService(client, provider.api_token);
  const vendorsService = createVendorsService(client, provider.api_token);

  const result = await perksService.getOfferById(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const offer = result.data;
  const discountDisplay = formatDiscount(offer.discount, offer.discount_type);
  const showRedemption = hasRedemptionDetails(offer);
  const hasTerms = offer.terms_and_conditions_text || offer.terms_and_conditions;

  // Fetch related data
  let vendor: GetProvenVendor | null = null;
  let relatedPerks: GetProvenDeal[] = [];
  let similarPerks: GetProvenDeal[] = [];
  let vendorMap: Record<number, { logo: string | null; name: string; primaryService: string | null }> = {};

  if (offer.vendor_id) {
    const [vendorResult, allPerksResult, allVendorsResult] = await Promise.all([
      vendorsService.getVendorById(String(offer.vendor_id)),
      perksService.getOffers(1, 1000),
      vendorsService.getVendors(1, 1000),
    ]);

    if (vendorResult.success && vendorResult.data) {
      vendor = vendorResult.data;
    }

    if (allVendorsResult.success && allVendorsResult.data) {
      for (const v of allVendorsResult.data.data) {
        vendorMap[v.id] = {
          logo: v.logo,
          name: v.name,
          primaryService: v.primary_service,
        };
      }
    }

    if (allPerksResult.success && allPerksResult.data) {
      const allPerks = allPerksResult.data.data;
      relatedPerks = allPerks.filter(
        (perk) => perk.vendor_id === offer.vendor_id && perk.id !== offer.id
      );
      similarPerks = findSimilarPerks(offer, allPerks, 6, vendorMap);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Ambient Background - Mercury OS gradient mesh */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-50/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-50/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back Navigation - Minimal */}
        <Link
          href="/perks"
          className="
            inline-flex items-center gap-2 mb-8
            text-sm font-medium text-gray-500
            hover:text-gray-900
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2
            rounded-lg px-2 py-1 -ml-2
          "
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Perks</span>
        </Link>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">

            {/* Hero Section - Mercury OS Module */}
            <GlassCard className="p-8">
              {/* Vendor Identity */}
              <div className="flex items-center gap-4 mb-6">
                {vendor?.logo ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-lg ring-1 ring-black/5">
                    <Image
                      src={vendor.logo}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-lg">
                    <Gift className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  {vendor && (
                    <h2 className="text-lg font-semibold text-gray-900">{vendor.name}</h2>
                  )}
                  {vendor?.primary_service && (
                    <p className="text-sm text-gray-500">{vendor.primary_service}</p>
                  )}
                </div>

                {/* Deal type indicator */}
                {offer.deal_type && (
                  <MercuryBadge variant="subtle">
                    {offer.deal_type.replace('_', ' ').toUpperCase()}
                  </MercuryBadge>
                )}
              </div>

              {/* Offer Title */}
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                {offer.name}
              </h1>

              {/* Investment Levels */}
              {offer.investment_levels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {offer.investment_levels.map((level) => (
                    <ColorLabel key={level.name} text={level.name} color="grey" />
                  ))}
                </div>
              )}

              {/* Value Metrics - Mercury OS Flow */}
              {(discountDisplay || offer.estimated_value || offer.old_price) && (
                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200/50">
                  {discountDisplay && (
                    <ValuePill
                      label="Discount"
                      value={`${discountDisplay} off`}
                      variant="success"
                    />
                  )}

                  {offer.estimated_value && offer.estimated_value > 0 && (
                    <ValuePill
                      label="Estimated Value"
                      value={formatValue(offer.estimated_value)}
                      variant="accent"
                    />
                  )}

                  {(offer.old_price || offer.new_price) && (
                    <div className="flex items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/80 border border-white/60 shadow-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 opacity-60">Price</p>
                        <div className="flex items-baseline gap-2">
                          {offer.old_price && (
                            <span className="text-lg text-gray-400 line-through">${offer.old_price.toLocaleString()}</span>
                          )}
                          {offer.new_price && (
                            <span className="text-xl font-bold text-gray-900">${offer.new_price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Offer Details Card - Combined sections with dividers */}
            {(offer.description || hasTerms) && (
              <GlassCard className="overflow-hidden">
                {/* About this Offer Section */}
                {offer.description && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-xl bg-indigo-50">
                        <Info className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">What you get</h2>
                    </div>
                    <div
                      className="prose prose-gray prose-sm max-w-none text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: offer.description }}
                    />
                  </div>
                )}

                {/* Divider */}
                {offer.description && hasTerms && (
                  <div className="border-t border-gray-200/60" />
                )}

                {/* Terms and Conditions Section - Collapsible */}
                {hasTerms && (
                  <details className="group">
                    <summary className="
                      flex items-center justify-between p-6 cursor-pointer
                      hover:bg-gray-50/80 transition-colors duration-200
                      list-none
                      [&::-webkit-details-marker]:hidden
                    ">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gray-100">
                          <Shield className="w-5 h-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Terms and Conditions</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      {offer.terms_and_conditions_text && (
                        <div
                          className="prose prose-gray prose-sm max-w-none text-gray-600 mb-4"
                          dangerouslySetInnerHTML={{ __html: offer.terms_and_conditions_text }}
                        />
                      )}
                      {offer.terms_and_conditions && (
                        <a
                          href={offer.terms_and_conditions}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#0038FF] hover:text-[#0030E0] font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Full Terms
                        </a>
                      )}
                    </div>
                  </details>
                )}
              </GlassCard>
            )}
          </div>

          {/* Redemption Sidebar - Mercury Floating Panel */}
          <aside className="lg:self-start">
            <FloatingPanel>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Redeem this Offer</h3>

                {showRedemption && (
                  <div className="space-y-4 mb-6">
                    {/* Coupon Code */}
                    {offer.coupon_code && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                          Promo Code
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="
                            flex-1 px-4 py-4 rounded-xl
                            bg-gray-900 text-white
                            font-mono text-sm font-medium
                            shadow-inner
                          ">
                            {offer.coupon_code}
                          </code>
                          <CopyButton text={offer.coupon_code} />
                        </div>
                      </div>
                    )}

                    {/* Redeem Steps */}
                    {offer.redeem_steps && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                          How to Redeem
                        </label>
                        <div
                          className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: offer.redeem_steps }}
                        />
                      </div>
                    )}

                    {/* Contact Email */}
                    {offer.contact_email && (
                      <MercuryButton href={`mailto:${offer.contact_email}`} variant="secondary" className="w-full">
                        <Mail className="w-4 h-4" />
                        {offer.contact_email}
                      </MercuryButton>
                    )}

                    {/* Details URL */}
                    {offer.details_url && (
                      <MercuryButton href={offer.details_url} variant="ghost" className="w-full">
                        <ExternalLink className="w-4 h-4" />
                        View on vendor site
                      </MercuryButton>
                    )}
                  </div>
                )}

                {/* Primary CTA — with redemption click tracking */}
                <RedeemButton
                  getprovenLink={offer.getproven_link}
                  offerId={offer.id}
                  offerName={offer.name}
                  vendorName={vendor?.name ?? 'Unknown'}
                  estimatedValue={offer.estimated_value}
                />

                <p className="text-xs text-center text-gray-500 mt-4">
                  Opens on GetProven to complete redemption
                </p>

                {/* Who Can Redeem - Eligibility */}
                {offer.applicable_to_type && (
                  <div className="mt-6 pt-6 border-t border-gray-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Who Can Redeem</span>
                    </div>
                    <p className="text-sm text-gray-600">{offer.applicable_to_type}</p>
                  </div>
                )}
              </div>
            </FloatingPanel>
          </aside>
        </div>

        {/* Related Perks - Same cards as main perks listing */}
        {relatedPerks.length > 0 && vendor && (
          <section className="mt-16">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">More from {vendor.name}</h2>
              <p className="text-sm text-gray-500 mt-1">This vendor has {relatedPerks.length} more {relatedPerks.length === 1 ? 'perk' : 'perks'}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPerks.map((perk) => (
                <OfferCard
                  key={perk.id}
                  offer={perk}
                  vendorLogo={vendor.logo}
                  vendorName={vendor.name}
                  vendorPrimaryService={vendor.primary_service}
                />
              ))}
            </div>
          </section>
        )}

        {/* Similar Perks - Same cards as main perks listing */}
        {similarPerks.length > 0 && (
          <section className="mt-16">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Similar Deals</h2>
              <p className="text-sm text-gray-500 mt-1">Similar deals in this category</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarPerks.map((perk) => {
                const perkVendor = vendorMap[perk.vendor_id];
                return (
                  <OfferCard
                    key={perk.id}
                    offer={perk}
                    vendorLogo={perkVendor?.logo}
                    vendorName={perkVendor?.name}
                    vendorPrimaryService={perkVendor?.primaryService}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
