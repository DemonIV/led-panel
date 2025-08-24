export interface AspectRule {
  ruleID?: number;
  tipAdi: string;
  minRatio: number;
  maxRatio: number;
  masterWidth: number;
  masterHeight: number;
  isActive?: boolean;
  createdAt?: string;
}