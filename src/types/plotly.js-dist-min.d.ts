declare module "plotly.js-dist-min" {
  import type { PlotlyHTMLElement } from "plotly.js";

  interface DownloadImageOptions {
    format?: "png" | "jpeg" | "webp" | "svg";
    width?: number;
    height?: number;
    scale?: number;
    filename?: string;
  }

  interface PlotlyModule {
    downloadImage(
      gd: PlotlyHTMLElement,
      options?: DownloadImageOptions,
    ): Promise<string>;
  }

  const Plotly: PlotlyModule;

  export default Plotly;
}
