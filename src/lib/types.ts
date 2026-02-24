export interface Kisi {
  id: string
  tc_no: string
  ad: string
  soyad: string
  telefon: string
  adres: string
  mahalle: string
  cocuk_sayisi: number
  ramazan_kumanyasi: boolean
  bot_mont: boolean
  created_at: string | null
}

export interface Cocuk {
  id: number
  ebeveyn_id: string
  yas: number
  cinsiyet: string
}

export interface AramaGecmisi {
  id: number
  kisi_id: string
  aciklama: string
  tarih: string
}

export interface Yardim {
  id: number
  kisi_id: string
  yardim_icerigi: string
  tarih: string
}

export interface YardimDetay {
  id: number
  kisi_id: string
  yardim_icerigi: string
  tarih: string
  kisiler: {
    ad: string
    soyad: string
  }
}

export interface AramaGecmisiDetay {
  id: number
  kisi_id: string
  aciklama: string
  tarih: string
  kisiler: {
    ad: string
    soyad: string
  }
}
