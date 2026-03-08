export type ExtractedPage = {
  pageNumber: number;
  imagePath: string;
};

export interface ArchiveExtractor {
  supports(fileName: string): boolean;
  extractPages(inputPath: string, outputDir: string): Promise<ExtractedPage[]>;
}

