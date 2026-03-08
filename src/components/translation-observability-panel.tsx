"use client";

import { useEffect, useState } from "react";

type ObservabilityPayload = {
  worker: {
    alive: boolean;
    lastHeartbeatAt: string | null;
  };
  queue: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    completed: number;
  };
};

export function TranslationObservabilityPanel() {
  const [payload, setPayload] = useState<ObservabilityPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadObservability(): Promise<void> {
      try {
        const response = await fetch("/api/observability/translation", { cache: "no-store" });
        const responsePayload = (await response.json()) as ObservabilityPayload & {
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(responsePayload.error?.message ?? "No se pudo cargar observabilidad");
        }

        setPayload(responsePayload);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Error de observabilidad");
      }
    }

    void loadObservability();
    const intervalId = window.setInterval(() => {
      void loadObservability();
    }, 2_000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!payload && !errorMessage) {
    return (
      <section className="panel observability-panel">
        <h2>Observabilidad de traduccion</h2>
        <p>Cargando metricas...</p>
      </section>
    );
  }

  return (
    <section className="panel observability-panel">
      <h2>Observabilidad de traduccion</h2>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {payload ? (
        <>
          <div className="obs-grid">
            <div>
              <strong>Worker</strong>
              <p className={payload.worker.alive ? "ok-text" : "error-text"}>{payload.worker.alive ? "Activo" : "No activo"}</p>
            </div>

            <div>
              <strong>Cola</strong>
              <p>
                wait: {payload.queue.waiting} | active: {payload.queue.active} | delayed: {payload.queue.delayed}
              </p>
              <p>
                failed: {payload.queue.failed} | completed: {payload.queue.completed}
              </p>
            </div>

            <div>
              <strong>Heartbeat</strong>
              <p>{payload.worker.lastHeartbeatAt ?? "sin heartbeat"}</p>
            </div>
          </div>

          {!payload.worker.alive && payload.queue.waiting > 0 ? (
            <p className="error-text">Hay jobs en espera y el worker no esta activo.</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
