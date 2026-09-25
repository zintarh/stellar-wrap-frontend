import html2canvas from "html2canvas";

const GENERATION_TIMEOUT_MS = 10_000;

export interface ShareImageExportOptions {
  onFallbackWarning?: () => void;
  format?: "square" | "stories";
}

export interface ShareImageExportResult {
  usedWorker: boolean;
  scale: number;
  durationMs: number;
}

/**
  * Scale is pinned to a constant factor (3) to ensure deterministic rendering
  * across all environments regardless of screen resolution, DPI, or mobile/desktop.
  */
function getCaptureScale(): number {
  return 3;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          "Image generation timed out after 10 seconds. Please try again.",
        ),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Freeze CSS animations, transitions, and keyframes on an element tree
 * to prevent half-rendered or mid-transition captures.
 */
function freezeAnimations(clone: HTMLElement): void {
  const freezeStyle = document.createElement("style");
  freezeStyle.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      animation-play-state: paused !important;
    }
  `;
  clone.appendChild(freezeStyle);

  const applyFreeze = (el: HTMLElement) => {
    el.style.setProperty("animation", "none", "important");
    el.style.setProperty("transition", "none", "important");
    el.style.setProperty("animation-play-state", "paused", "important");
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child instanceof HTMLElement) {
        applyFreeze(child);
      }
    }
  };
  applyFreeze(clone);
}

function processElementStyles(original: Element, cloned: Element): void {
  if (original instanceof HTMLElement && cloned instanceof HTMLElement) {
    const computed = window.getComputedStyle(original);

    const colorProperties = [
      "backgroundColor",
      "color",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
    ];

    colorProperties.forEach((prop) => {
      const kebabProp = prop.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      const value = computed.getPropertyValue(kebabProp);

      if (value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
        cloned.style.setProperty(kebabProp, value, "important");
      }
    });

    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage !== "none") {
      cloned.style.setProperty("background-image", bgImage, "important");
    }
  }

  for (let i = 0; i < original.children.length; i++) {
    if (original.children[i] && cloned.children[i]) {
      processElementStyles(original.children[i], cloned.children[i]);
    }
  }
}

function encodeCanvasOnMainThread(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate image blob"));
        }
      },
      "image/png",
      1.0,
    );
  });
}

function encodeCanvasInWorker(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Failed to read canvas image data"));
      return;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const worker = new Worker(
      new URL("./shareImageWorker.ts", import.meta.url),
    );

    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      worker.terminate();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      if (event.data.blob) {
        resolve(event.data.blob);
        return;
      }

      reject(new Error("Worker returned an invalid response"));
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Worker failed during image encoding"));
    };

    worker.postMessage(
      {
        imageData,
        width: canvas.width,
        height: canvas.height,
      },
      [imageData.data.buffer],
    );
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  options?: ShareImageExportOptions,
): Promise<{ blob: Blob; usedWorker: boolean }> {
  const supportsOffscreenCanvas = typeof OffscreenCanvas !== "undefined";

  if (supportsOffscreenCanvas) {
    try {
      const blob = await encodeCanvasInWorker(canvas);
      return { blob, usedWorker: true };
    } catch (error) {
      console.warn(
        "OffscreenCanvas worker encoding failed, falling back to main thread:",
        error,
      );
      options?.onFallbackWarning?.();
    }
  } else {
    console.warn(
      "OffscreenCanvas is not supported in this browser. Using main-thread encoding.",
    );
    options?.onFallbackWarning?.();
  }

  const blob = await encodeCanvasOnMainThread(canvas);
  return { blob, usedWorker: false };
}

function triggerDownload(blob: Blob, filename: string = "stellar-wrapped-2026.png"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Downloads the ShareImageCard as a PNG image cleanly and deterministically.
 * Ensures custom web fonts are loaded and ready, pins scale factor, and freezes animations.
 *
 * @param element - The DOM element to capture (ShareImageCard ref)
 * @returns Export metadata including worker usage and duration
 */
export async function downloadShareImage(
  element: HTMLElement,
  options?: ShareImageExportOptions,
): Promise<ShareImageExportResult> {
  const startTime = performance.now();
  const scale = getCaptureScale();
  const format = options?.format || "square";

  // Ensure fonts are fully loaded before capturing
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const getDimensions = (fmt: "square" | "stories") => {
    return fmt === "stories"
      ? { width: 1080, height: 1920, filename: "stellar-wrapped-2026-stories.png" }
      : { width: 1080, height: 1080, filename: "stellar-wrapped-2026.png" };
  };

  const { width, height, filename } = getDimensions(format);

  return withTimeout(
    (async () => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      try {
        processElementStyles(element, clone);
        freezeAnimations(clone);

        const canvas = await html2canvas(clone, {
          scale,
          backgroundColor: "#020202",
          useCORS: true,
          allowTaint: true,
          logging: false,
          width,
          height,
        });

        const { blob, usedWorker } = await canvasToBlob(canvas, options);
        triggerDownload(blob, filename);

        return {
          usedWorker,
          scale,
          durationMs: Math.round(performance.now() - startTime),
        };
      } finally {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      }
    })(),
    GENERATION_TIMEOUT_MS,
  );
}
