"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { POLLING_INTERVAL_MS } from "@/shared/constants";
import { TranslationObservabilityPanel } from "@/components/translation-observability-panel";

type ChapterStatus = {
  chapterId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalPages: number;
  processedPages: number;
  failedPages: number;
  progress: number;
};

type ChapterPageItem = {
  id: string;
  pageNumber: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
};

type ReaderPage = {
  pageId: string;
  pageNumber: number;
  pageStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  imageUrl: string;
  blocks: {
    id: string;
    originalText: string;
    translatedText: string | null;
    isManuallyEdited: boolean;
  }[];
};

type ReaderClientProps = {
  chapterId: string;
};

export function ReaderClient({ chapterId }: ReaderClientProps) {
  const [status, setStatus] = useState<ChapterStatus | null>(null);
  const [pages, setPages] = useState<ChapterPageItem[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState<ReaderPage | null>(null);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [loadingPage, setLoadingPage] = useState(false);
  const [retryPanelOpen, setRetryPanelOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPageItem = pages[selectedPageIndex] ?? null;

  const fetchChapterStatus = useCallback(async () => {
    const response = await fetch(`/api/chapters/${chapterId}/status`, { cache: "no-store" });
    const payload = (await response.json()) as ChapterStatus & { error?: { message?: string } };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "No se pudo consultar estado del capitulo");
    }

    setStatus(payload);
  }, [chapterId]);

  const fetchPages = useCallback(async () => {
    const response = await fetch(`/api/chapters/${chapterId}/pages`, { cache: "no-store" });
    const payload = (await response.json()) as {
      pages?: ChapterPageItem[];
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "No se pudieron cargar paginas");
    }

    setPages(payload.pages ?? []);
  }, [chapterId]);

  const fetchReaderPage = useCallback(async (pageId: string) => {
    setLoadingPage(true);

    try {
      const response = await fetch(`/api/pages/${pageId}`, { cache: "no-store" });
      const payload = (await response.json()) as ReaderPage & { error?: { message?: string } };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "No se pudo cargar la pagina");
      }

      setSelectedPage(payload);
      setEditedTexts(Object.fromEntries(payload.blocks.map((block) => [block.id, block.translatedText ?? ""])));
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchChapterStatus(), fetchPages()]).catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Error inicial");
    });
  }, [fetchChapterStatus, fetchPages]);

  useEffect(() => {
    if (!selectedPageItem) {
      return;
    }

    fetchReaderPage(selectedPageItem.id).catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Error cargando pagina");
    });
  }, [selectedPageItem, fetchReaderPage]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchChapterStatus().catch(() => undefined);
      fetchPages().catch(() => undefined);
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchChapterStatus, fetchPages]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setSelectedPageIndex((previous) => Math.max(0, previous - 1));
      }

      if (event.key === "ArrowRight") {
        setSelectedPageIndex((previous) => Math.min(pages.length - 1, previous + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pages.length]);

  const canGoPrevious = selectedPageIndex > 0;
  const canGoNext = selectedPageIndex < pages.length - 1;

  const headerStatus = useMemo(() => {
    if (!status) {
      return "Cargando estado...";
    }

    return `${status.status} - ${status.progress}% (${status.processedPages}/${status.totalPages})`;
  }, [status]);

  async function saveBlock(blockId: string): Promise<void> {
    try {
      const response = await fetch(`/api/text-blocks/${blockId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          translatedText: editedTexts[blockId] ?? ""
        })
      });

      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "No se pudo guardar bloque");
      }

      if (selectedPageItem) {
        await fetchReaderPage(selectedPageItem.id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error guardando bloque");
    }
  }

  async function retryPage(overwriteManualEdits: boolean): Promise<void> {
    if (!selectedPageItem) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${selectedPageItem.id}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ overwriteManualEdits })
      });

      const payload = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "No se pudo reintentar la pagina");
      }

      setRetryPanelOpen(false);
      await Promise.all([fetchChapterStatus(), fetchPages(), fetchReaderPage(selectedPageItem.id)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error reintentando pagina");
    }
  }

  return (
    <main className="layout-root">
      <TranslationObservabilityPanel />

      <section className="panel">
        <div className="reader-header">
          <div>
            <h1>Lector de capitulo</h1>
            <p>{headerStatus}</p>
          </div>

          <Link href="/">Volver al inicio</Link>
        </div>

        <div className="page-grid">
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelectedPageIndex(index)}
              className={index === selectedPageIndex ? "page-chip active" : "page-chip"}
            >
              <span>#{page.pageNumber}</span>
              <small>{page.status}</small>
            </button>
          ))}
        </div>

        <div className="pagination-row">
          <button type="button" onClick={() => setSelectedPageIndex((v) => Math.max(0, v - 1))} disabled={!canGoPrevious}>
            Anterior
          </button>
          <input
            type="number"
            min={1}
            max={pages.length || 1}
            value={pages.length ? selectedPageIndex + 1 : 1}
            onChange={(event) => {
              const target = Number(event.target.value);
              if (Number.isNaN(target)) {
                return;
              }

              const normalized = Math.min(Math.max(1, target), pages.length || 1);
              setSelectedPageIndex(normalized - 1);
            }}
          />
          <button type="button" onClick={() => setSelectedPageIndex((v) => Math.min(pages.length - 1, v + 1))} disabled={!canGoNext}>
            Siguiente
          </button>
        </div>

        {selectedPageItem?.errorMessage ? <p className="error-text">{selectedPageItem.errorMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="app-grid">
        <article className="panel">
          <h2>Texto pagina {selectedPage?.pageNumber ?? "-"}</h2>
          <p>Estado: {selectedPage?.pageStatus ?? "-"}</p>

          <button type="button" onClick={() => setRetryPanelOpen((open) => !open)}>
            Reintentar pagina
          </button>

          {retryPanelOpen ? (
            <div className="retry-panel">
              <p>Como deseas reintentar la traduccion?</p>
              <button type="button" onClick={() => retryPage(false)}>
                Conservar ediciones manuales
              </button>
              <button type="button" onClick={() => retryPage(true)}>
                Sobrescribir ediciones manuales
              </button>
            </div>
          ) : null}

          <div className="text-block-list">
            {selectedPage?.blocks.map((block) => (
              <div key={block.id} className="text-row">
                <strong>Original</strong>
                <p>{block.originalText}</p>
                <strong>Traducido</strong>
                <textarea
                  value={editedTexts[block.id] ?? ""}
                  onChange={(event) =>
                    setEditedTexts((previous) => ({
                      ...previous,
                      [block.id]: event.target.value
                    }))
                  }
                />

                <div className="block-actions">
                  {block.isManuallyEdited ? <span className="manual-chip">Editado manualmente</span> : null}
                  <button type="button" onClick={() => saveBlock(block.id)}>
                    Guardar bloque
                  </button>
                </div>
              </div>
            ))}

            {!selectedPage && !loadingPage ? <p>Selecciona una pagina para comenzar.</p> : null}
            {loadingPage ? <p>Cargando pagina...</p> : null}
          </div>
        </article>

        <article className="panel">
          <h2>Imagen de pagina</h2>
          {selectedPage ? (
            <Image
              src={`${selectedPage.imageUrl}?t=${selectedPage.pageStatus}-${selectedPage.pageNumber}`}
              alt={`Pagina ${selectedPage.pageNumber}`}
              className="reader-image"
              width={1200}
              height={1600}
              unoptimized
            />
          ) : (
            <div className="page-image">Sin pagina seleccionada</div>
          )}
        </article>
      </section>
    </main>
  );
}