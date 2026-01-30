import html2canvas from "html2canvas";

/**
 * Downloads the ShareImageCard as a PNG image
 * @param element - The DOM element to capture (ShareImageCard ref)
 * @returns Promise that resolves when download is triggered
 * @throws Error if canvas generation or download fails
 */
export async function downloadShareImage(element: HTMLElement): Promise<void> {
  try {
    // Step 1: Clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    document.body.appendChild(clone);

    // Step 2: Get all elements and force computed styles
    const processElement = (original: Element, cloned: Element) => {
      if (original instanceof HTMLElement && cloned instanceof HTMLElement) {
        const computed = window.getComputedStyle(original);
        
        // List of all color-related properties to override
        const colorProperties = [
          'backgroundColor',
          'color',
          'borderColor',
          'borderTopColor',
          'borderRightColor',
          'borderBottomColor',
          'borderLeftColor',
          'outlineColor',
        ];

        // Apply computed RGB values to override any oklab/oklch
        colorProperties.forEach(prop => {
          const kebabProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
          const value = computed.getPropertyValue(kebabProp);
          
          if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            cloned.style.setProperty(kebabProp, value, 'important');
          }
        });

        // Handle gradient backgrounds specially
        const bgImage = computed.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          cloned.style.setProperty('background-image', bgImage, 'important');
        }
      }

      // Recursively process children
      for (let i = 0; i < original.children.length; i++) {
        processElement(original.children[i], cloned.children[i]);
      }
    };

    // Process the clone
    processElement(element, clone);

    // Step 3: Generate canvas from the processed clone
    const canvas = await html2canvas(clone, {
      scale: 3,
      backgroundColor: "#020202",
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1080,
      height: 1080,
    });

    // Clean up the clone
    document.body.removeChild(clone);

    // Step 4: Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate image blob"));
          }
        },
        "image/png",
        1.0
      );
    });

    // Step 5: Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stellar-wrapped-2026.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
    throw new Error("Failed to download image: Unknown error occurred");
  }
}