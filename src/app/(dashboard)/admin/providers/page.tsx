'use client';

/**
 * Admin Providers Page - MercuryOS Design System
 *
 * ADMIN ONLY: Manage API providers for the perks portal
 * - List providers with status badges
 * - Set default provider
 * - Add/edit/delete providers
 * - Mercury OS styling with Bridge Blue (#0038FF)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Plus,
  Star,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Button, Card } from '@/components/ui';

interface Provider {
  id: string;
  name: string;
  slug: string;
  api_url: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface ProviderFormData {
  name: string;
  slug: string;
  api_url: string;
  api_token: string;
}

/**
 * Admin Providers Page
 */
export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      setProviders(data.providers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSetDefault = async (providerId: string) => {
    setActionLoading(providerId);
    try {
      const res = await fetch(`/api/providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (provider: Provider) => {
    setActionLoading(provider.id);
    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !provider.is_active }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    setActionLoading(providerId);
    try {
      const res = await fetch(`/api/providers/${providerId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setActionLoading(null);
    }
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setIsModalOpen(true);
  };

  const openEditModal = (provider: Provider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const handleSubmit = async (formData: ProviderFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingProvider
        ? `/api/providers/${editingProvider.id}`
        : '/api/providers';
      const method = editingProvider ? 'PATCH' : 'POST';

      const body: Record<string, string> = {
        name: formData.name,
        slug: formData.slug,
        api_url: formData.api_url,
      };
      if (formData.api_token) {
        body.api_token = formData.api_token;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      await fetchProviders();
      closeModal();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Admin Header - Mercury OS style */}
      <div className="flex items-center gap-4 rounded-xl bg-amber-50/80 border border-amber-200/60 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
          <Shield className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-amber-900 text-[14px]">Admin Only</h2>
          <p className="text-[13px] text-amber-700">
            Manage API providers and credentials
          </p>
        </div>
      </div>

      {/* Page Header - MercuryOS style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0038FF] to-[#0030E0]">
              <Database className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              API Providers
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 max-w-2xl">
            Switch between providers to display perks from different GetProven accounts
          </p>
        </div>

        {/* Add Provider Button */}
        <Button
          onClick={openAddModal}
          className="bg-gradient-to-br from-[#0038FF] to-[#0030E0] text-white hover:shadow-lg hover:shadow-[#0038FF]/25"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <p className="text-[14px] text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setError(null); fetchProviders(); }}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 text-[#0038FF] animate-spin" />
            <span className="text-[14px] text-gray-500">Loading providers...</span>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && providers.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 py-16 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0038FF]/10 to-[#0038FF]/5 mb-5">
            <Database className="h-8 w-8 text-[#0038FF]/60" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2">
            No providers configured
          </h3>
          <p className="text-[13px] text-gray-500 text-center max-w-sm mb-6">
            Providers connect to GetProven API endpoints to fetch perks data. Add a provider to get started.
          </p>
          <Button onClick={openAddModal} className="bg-gradient-to-br from-[#0038FF] to-[#0030E0] text-white hover:shadow-lg hover:shadow-[#0038FF]/25">
            <Plus className="h-4 w-4" />
            Add your first provider
          </Button>
        </div>
      )}

      {/* Providers Table */}
      {!isLoading && providers.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                    API URL
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((provider) => (
                  <tr
                    key={provider.id}
                    className={`hover:bg-gray-50/50 transition-colors ${!provider.is_active ? 'opacity-60' : ''}`}
                  >
                    {/* Provider Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-gray-900">
                          {provider.name}
                        </span>
                        {provider.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0038FF]/10 text-[#0038FF] text-[11px] font-medium">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <code className="font-mono text-[12px] bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {provider.slug}
                      </code>
                    </td>

                    {/* API URL */}
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-gray-600 truncate block max-w-[250px]" title={provider.api_url}>
                        {provider.api_url}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {provider.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[12px] font-medium">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!provider.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(provider.id)}
                            disabled={actionLoading === provider.id}
                            title="Set as default"
                            className="text-[#0038FF] hover:text-[#0030E0] hover:bg-[#0038FF]/10"
                          >
                            {actionLoading === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(provider)}
                          disabled={actionLoading === provider.id}
                          title={provider.is_active ? 'Deactivate' : 'Activate'}
                          className={provider.is_active ? 'text-gray-500 hover:text-gray-700' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {provider.is_active ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(provider)}
                          title="Edit"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {!provider.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(provider.id)}
                            disabled={actionLoading === provider.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gray-50/50 border-gray-200/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
            <Database className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-gray-700">About Providers</p>
            <p className="text-[13px] text-gray-500 mt-1">
              The <strong>default provider</strong> is used for all portal API calls.
              API tokens are securely stored and never exposed in responses.
            </p>
          </div>
        </div>
      </Card>

      {/* Provider Modal */}
      {isModalOpen && (
        <ProviderModal
          provider={editingProvider}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ProviderModal({
  provider,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  provider: Provider | null;
  onClose: () => void;
  onSubmit: (data: ProviderFormData) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<ProviderFormData>({
    name: provider?.name || '',
    slug: provider?.slug || '',
    api_url: provider?.api_url || 'https://bridge.getproven.com/api/ext/v1',
    api_token: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(!!provider);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.api_url.trim()) {
      setError('API URL is required');
      return;
    }
    if (!provider && !formData.api_token.trim()) {
      setError('API Token is required for new providers');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save provider');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-[16px] font-semibold text-gray-900">
            {provider ? 'Edit Provider' : 'Add New Provider'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Customer X Perks"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0038FF]/20 focus:border-[#0038FF] transition-all"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g., customer-x-perks"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#0038FF]/20 focus:border-[#0038FF] transition-all"
            />
            <p className="mt-1 text-[12px] text-gray-500">
              Unique identifier. Auto-generated from name.
            </p>
          </div>

          {/* API URL */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              API URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.api_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, api_url: e.target.value }))}
              placeholder="https://bridge.getproven.com/api/ext/v1"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#0038FF]/20 focus:border-[#0038FF] transition-all"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              API Token {!provider && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.api_token}
              onChange={(e) => setFormData((prev) => ({ ...prev, api_token: e.target.value }))}
              placeholder={provider ? 'Leave blank to keep current token' : 'Enter API token'}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#0038FF]/20 focus:border-[#0038FF] transition-all"
            />
            {provider && (
              <p className="mt-1 text-[12px] text-gray-500">
                Leave blank to keep the existing token.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-br from-[#0038FF] to-[#0030E0] text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {provider ? 'Save Changes' : 'Add Provider'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
