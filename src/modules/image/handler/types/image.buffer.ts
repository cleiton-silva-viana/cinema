import { ImageSize } from './image.size'

export type ImageBuffer = {
  small: Buffer
  normal: Buffer
  large: Buffer
}

export type ImageResizedDimension = {
  ratio: number // O aspect ratio numérico usado para os cálculos (targetWidth / targetHeight)
  small: ImageSize
  normal: ImageSize
  large: ImageSize
}

// Buffers redimensionados
export type ImageResizedBuffer = {
  small: Buffer
  normal: Buffer
  large: Buffer
}
