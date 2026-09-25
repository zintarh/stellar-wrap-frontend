/**
 * Downloads the ShareImageCard as a PNG image.
 *
 * html2canvas is dynamically imported here so it is only loaded
 * when this function is actually invoked — i.e. on the /share page when the
 * user clicks "Download Image". It never ends up in the initial bundle.
 *
 * @param element - The DOM element to capture (ShareImageCard ref)
 * @returns Promise that resolves when download is triggered
 * @throws Error if canvas generation or download fails
 */
import html2canvas from "html2canvas";
import { logger } from "@/app/utils/logger";/**
 * Downloads the ShareImageCard as a PNG image.
 *
 * Uses html2canvas to capture the ShareImageCard DOM element and export it
 * as a PNG image. The export also supports deterministic rendering,
 * animation freezing, and worker-based image encoding when available.
 *
 * @param element - The DOM element to capture (ShareImageCard ref)
 * @returns Promise that resolves with export metadata
 * @throws Error if canvas generation or download fails
 */
import html2canvas from "html2canvas";
import { logger } from "@/app/utils/logger";