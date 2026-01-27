import { NextRequest, NextResponse } from 'next/server';
import { whitelistService } from '@/lib/api';

/**
 * POST /api/admin/whitelist/upload
 * Upload CSV file to add whitelisted domains
 * ADMIN ONLY
 *
 * Body: multipart/form-data with 'file' field containing CSV
 * Returns: Raw API response verbatim
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No file provided', status: 400 } },
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

    // Return raw API response verbatim
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Admin Whitelist Upload] Error:', error);
    return NextResponse.json(
      { error: { code: 'UPLOAD_ERROR', message: 'Failed to process upload', status: 500 } },
      { status: 500 }
    );
  }
}
