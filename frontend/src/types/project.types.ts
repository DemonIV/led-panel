export interface Project {
  projectID?: number;
  projectName: string;
  projectType: 'shoe' | 'logo' | 'mixed';
  status: 'active' | 'completed' | 'archived';
  description?: string;
  assetCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Asset {
  assetID?: number;
  assetName: string;
  assetType: '2D_logo' | '3D_logo' | '3D_shoe' | 'solid' | 'text_machine';
  filePath: string;
  fileSize?: number;
  projectID: number;
  createdAt?: string;
}