export interface LED {
  ledID?: number;
  ledKodu: string;
  enPx: number;
  boyPx: number;
  aspect?: number;
  masterTipi?: string;
  tip?: string;
  ozelDurum?: string;
  notlar?: string;
  aspectReel?: number;
  magazaID?: number;
  magazaAdi?: string;  // JOIN'den gelecek
  sehir?: string;      // JOIN'den gelecek
  createdAt?: string;
  updatedAt?: string;
}