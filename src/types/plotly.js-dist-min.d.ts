// src/types/plotly.d.ts

declare module "plotly.js-dist-min" {
  interface DownloadImageOptions {
    format?: "png" | "jpeg" | "webp" | "svg";
    width?: number;
    height?: number;
    scale?: number;
    filename?: string;
  }

  interface PlotlyModule {
    downloadImage(gd: HTMLElement, options?: DownloadImageOptions): Promise<string>;
  }

  const Plotly: PlotlyModule;

  export default Plotly;
}
