import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/bridge/auth';
import { whitelistService } from '@/lib/api';
import { changelogService } from '@/lib/api/changelog-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/whitelist/upload
 * Upload CSV file to add whitelisted domains
 * ADMIN ONLY
 *
 * Body: multipart/form-data with 'file' field containing CSV
 * Returns: Raw API response verbatim
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No file provided', status: 400 } },
        { status: 400 }
      );
    }

    // File size limit: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB limit`, status: 400 } },
        { status: 400 }
      );
    }

    // Basic MIME type check (skip if browser didn't set type)
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_FILE_TYPE', message: `Invalid file type: ${file.type}. Please upload a CSV file.`, status: 400 } },
        { status: 400 }
      );
    }

    // Create new FormData for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    const result = await whitelistService.uploadCsv(apiFormData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.status }
      );
    }

    // Log to admin changelog
    await changelogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action: 'whitelist.upload_csv',
      entityType: 'whitelist',
      summary: `Uploaded whitelist CSV (${file.name})`,
      details: {
        fileName: file.name,
        fileSize: file.size,
        apiResponse: result.data,
      },
    });

    // Return raw API response verbatim
    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('[Admin Whitelist Upload] Error:', error);
    return NextResponse.json(
      { error: { code: 'UPLOAD_ERROR', message: 'Failed to process upload', status: 500 } },
      { status: 500 }
    );
  }
}
