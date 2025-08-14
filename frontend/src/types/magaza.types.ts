export interface Magaza {
  magazaID?: number;
  sehir: string;
  magazaAdi: string;
  ledSayisi?: number;
  ledTipleri?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MagazaWithLeds extends Magaza {
  leds?: Array<any>;
}