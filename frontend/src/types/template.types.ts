// frontend/src/types/template.types.ts
export interface Template {
  templateID?: number;
  templateName: string;
  templateType: 'shoe_in_out' | 'transition' | 'logo_intro' | 'logo_outro';
  duration: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}