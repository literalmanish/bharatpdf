export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security';

export interface ToolDef {
  id: string;
  name: string;
  shortDesc: string;
  category: ToolCategory;
  iconName: string;
  color: string; // accent color class
  bgColor: string;
  badge?: string;
  accept: string;
  multiple: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  pageCount?: number;
}
