import { google } from 'googleapis';

export interface DriveUploadResult {
  fileId: string;
  fileUrl: string;
  downloadUrl: string;
  fileName: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime: string;
}

export class GoogleDriveService {
  private drive: any;
  private auth: any;

  constructor(accessToken: string) {
    this.auth = new google.auth.OAuth2();
    this.auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    fileBuffer: Buffer, 
    fileName: string, 
    mimeType: string,
    folderId?: string
  ): Promise<DriveUploadResult> {
    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType: mimeType,
      body: fileBuffer,
    };

    try {
      const response = await this.drive.files.create({
        resource: metadata,
        media: media,
        fields: 'id,webViewLink,webContentLink',
      });

      // Make file publicly viewable
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        fileId: response.data.id,
        fileUrl: response.data.webViewLink,
        downloadUrl: response.data.webContentLink,
        fileName: fileName,
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentFolderId?: string): Promise<string> {
    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    try {
      const response = await this.drive.files.create({
        resource: metadata,
        fields: 'id',
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Find or create a folder
   */
  async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      // Search for existing folder
      const query = parentFolderId 
        ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;

      const searchResponse = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      if (searchResponse.data.files.length > 0) {
        return searchResponse.data.files[0].id;
      }

      // Create folder if it doesn't exist
      return await this.createFolder(folderName, parentFolderId);
    } catch (error) {
      console.error('Error finding or creating folder:', error);
      throw new Error('Failed to find or create folder');
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId?: string, pageSize: number = 100): Promise<DriveFile[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)',
        orderBy: 'createdTime desc',
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, thumbnailLink, createdTime',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Update file permissions
   */
  async updateFilePermissions(fileId: string, role: 'reader' | 'writer' | 'owner', type: 'user' | 'group' | 'anyone'): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: role,
          type: type,
        },
      });
    } catch (error) {
      console.error('Error updating file permissions:', error);
      throw new Error('Failed to update file permissions');
    }
  }

  /**
   * Setup hostel superapp folder structure
   */
  async setupHostelFolders(): Promise<{ main: string; posts: string; chatFiles: string; documents: string }> {
    try {
      const mainFolderId = await this.findOrCreateFolder('Hostel SuperApp');
      const postsFolderId = await this.findOrCreateFolder('Posts', mainFolderId);
      const chatFilesFolderId = await this.findOrCreateFolder('Chat Files', mainFolderId);
      const documentsFolderId = await this.findOrCreateFolder('Documents', mainFolderId);

      return {
        main: mainFolderId,
        posts: postsFolderId,
        chatFiles: chatFilesFolderId,
        documents: documentsFolderId,
      };
    } catch (error) {
      console.error('Error setting up hostel folders:', error);
      throw new Error('Failed to setup hostel folders');
    }
  }
}