"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TranslationObservabilityPanel } from "@/components/translation-observability-panel";

type ChapterItem = {
  id: string;
  title: string;
  originalFileName: string;
  totalPages: number;
  createdAt: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  processedPages: number;
  failedPages: number;
  progress: number;
};

export function HomeClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadChapters(): Promise<void> {
    const response = await fetch("/api/chapters", { cache: "no-store" });
    const payload = (await response.json()) as { chapters?: ChapterItem[]; error?: { message?: string } };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "No se pudieron cargar capitulos");
    }

    setChapters(payload.chapters ?? []);
  }

  useEffect(() => {
    loadChapters().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Error cargando capitulos");
    });

    const intervalId = window.setInterval(() => {
      loadChapters().catch(() => undefined);
    }, 4_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const canUpload = useMemo(() => !!file && !uploading, [file, uploading]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!file) {
      setErrorMessage("Selecciona un archivo CBZ o CBR.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        chapterId?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.chapterId) {
        throw new Error(payload.error?.message ?? "No se pudo procesar la carga");
      }

      setTitle("");
      setFile(null);
      await loadChapters();
      router.push(`/reader/${payload.chapterId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error subiendo archivo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="layout-root">
      <TranslationObservabilityPanel />

      <section className="panel">
        <h1>Manga Translator AI</h1>
        <p>Sube un archivo CBZ o CBR para iniciar la traduccion automatica por pagina.</p>

        <form className="form-grid" onSubmit={handleUpload}>
          <label className="form-field">
            <span>Titulo del capitulo</span>
            <input
              type="text"
              value={title}
              placeholder="Opcional"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Archivo</span>
            <input
              type="file"
              accept=".cbz,.cbr"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button type="submit" disabled={!canUpload}>
            {uploading ? "Subiendo..." : "Subir y traducir"}
          </button>
        </form>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <section className="panel">
        <h2>Capitulos recientes</h2>
        {chapters.length === 0 ? <p>Aun no hay capitulos cargados.</p> : null}

        <div className="chapter-list">
          {chapters.map((chapter) => (
            <article key={chapter.id} className="chapter-card">
              <div>
                <h3>{chapter.title}</h3>
                <p>{chapter.originalFileName}</p>
              </div>

              <div className="chapter-meta">
                <span className={`status-chip status-${chapter.status.toLowerCase()}`}>{chapter.status}</span>
                <span>{chapter.progress}%</span>
                <span>
                  {chapter.processedPages}/{chapter.totalPages}
                </span>
              </div>

              <Link href={`/reader/${chapter.id}`}>Abrir lector</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}