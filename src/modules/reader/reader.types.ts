export type ReaderPageView = {
  pageNumber: number;
  imagePath: string;
  blocks: {
    originalText: string;
    translatedText: string | null;
  }[];
};

