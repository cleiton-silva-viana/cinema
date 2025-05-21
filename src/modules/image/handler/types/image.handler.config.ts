import { ImageSize } from "./image.size";

// Configuração para o processamento de imagem
export type ImageHandlerConfig = {
  compress: CompressionType;
  extension: ImageExtension;
  aspect: AspectRatio; // Aspect ratio *desejado* para a saída
  sizes: {
    // Larguras desejadas para cada tamanho
    small: ImageSize;
    normal: ImageSize;
    large: ImageSize;
  };
};

export enum CompressionType {
  Lossless = "Lossless",
  Lossy = "Lossy",
}

export enum ImageExtension {
  JPEG = "image/jpeg",
  PNG = "image/png",
  WEBP = "image/webp",
}

export enum AspectRatio {
  Square = "square",
  Landscape = "landscape", // 16:9
  Portrait = "portrait", // 9:16
}
