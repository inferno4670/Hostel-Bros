import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleDriveService } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    // Get the session to check authentication and get access token
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string; // 'posts', 'chat-files', or 'documents'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;

    // Initialize Google Drive service
    const driveService = new GoogleDriveService(session.accessToken);

    // Setup folder structure and get appropriate folder ID
    const folders = await driveService.setupHostelFolders();
    
    let targetFolderId: string;
    switch (folder) {
      case 'posts':
        targetFolderId = folders.posts;
        break;
      case 'chat-files':
        targetFolderId = folders.chatFiles;
        break;
      case 'documents':
        targetFolderId = folders.documents;
        break;
      default:
        targetFolderId = folders.main;
    }

    // Upload file to Google Drive
    const uploadResult = await driveService.uploadFile(
      fileBuffer,
      fileName,
      file.type,
      targetFolderId
    );

    // Return the result
    return NextResponse.json({
      success: true,
      ...uploadResult,
    });

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please free up space in your Google Drive.' },
          { status: 413 }
        );
      }
      
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure Google Drive access is granted.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder'); // 'posts', 'chat-files', or 'documents'
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const driveService = new GoogleDriveService(session.accessToken);
    const folders = await driveService.setupHostelFolders();
    
    let targetFolderId: string;
    switch (folder) {
      case 'posts':
        targetFolderId = folders.posts;
        break;
      case 'chat-files':
        targetFolderId = folders.chatFiles;
        break;
      case 'documents':
        targetFolderId = folders.documents;
        break;
      default:
        targetFolderId = folders.main;
    }

    const files = await driveService.listFiles(targetFolderId, pageSize);

    return NextResponse.json({
      success: true,
      files,
    });

  } catch (error) {
    console.error('Error listing files from Google Drive:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    const driveService = new GoogleDriveService(session.accessToken);
    await driveService.deleteFile(fileId);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}