import { IFilePaths } from '@modules/storage/filepath.interface'

export interface IStorageService {
  /**
   * Salva os buffers das imagens no armazenamento, retornando seus caminhos de arquivo.
   * @param basePath O caminho base onde as imagens serão armazenadas.
   * @param imageBuffers Um objeto contendo os buffers das imagens pequena, normal e grande.
   */
  save(basePath: string, imageBuffers: { small: Buffer; normal: Buffer; large: Buffer }): Promise<IFilePaths>

  delete(uid: string): Promise<null>
}
