import { v7 } from 'uuid'
import { IImageHandler } from '../handler/image.handler.interface'
import { IStorageService } from '../../storage/storage.service.interface'
import { IImageRepository } from '../repository/image.repository.interface'
import { AspectRatio, CompressionType, ImageExtension, ImageHandlerConfig } from '../handler/types/image.handler.config'
import { ImageUID } from '../entity/value-object/image.uid'
import { ImageApplicationService } from './image.application.service'
import { Image, ITextContent, IUpdateImageMetadataParams } from '@modules/image/entity/image'
import { CreateMultilingualTextContent, CreateTestTextContent } from '@test/builder/muiltilignual.content.builder'
import { CloneTestImageWithOverrides, CreateTestExpressMulterFiler, CreateTestImage } from '@test/builder/image.builder'
import { failure, success } from '@shared/result/result'
import { CreateTestFilepath } from '@test/builder/filepaths.builder'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'

describe('ImageService', () => {
  let service: ImageApplicationService
  let handlerMock: jest.Mocked<IImageHandler>
  let storageMock: jest.Mocked<IStorageService>
  let repositoryMock: jest.Mocked<IImageRepository>
  let mockImage: Image

  const uid = ImageUID.create()
  const mockTitle = CreateMultilingualTextContent()
  const mockDescription = CreateMultilingualTextContent()
  const mockFile = CreateTestExpressMulterFiler()
  const savedUrlsMock = CreateTestFilepath()
  const mockSimpleFailure: SimpleFailure = { code: FailureCode.MISSING_REQUIRED_DATA, details: { age: 2 } }
  const mockThrowError = new Error('erro para testes')

  const mockConfig: ImageHandlerConfig = {
    compress: CompressionType.Lossy,
    extension: ImageExtension.JPEG,
    aspect: AspectRatio.Landscape,
    sizes: {
      small: { width: 100, height: 56 },
      normal: { width: 300, height: 169 },
      large: { width: 600, height: 338 },
    },
  }

  beforeEach(() => {
    mockImage = CreateTestImage({
      uid: uid.value,
      title: mockTitle[0],
      description: mockDescription[0],
    })

    handlerMock = {
      process: jest.fn(),
    } as any

    storageMock = {
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    repositoryMock = {
      create: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any

    service = new ImageApplicationService(handlerMock, storageMock, repositoryMock)
  })

  describe('findById', () => {
    it('deve retornar uma imagem quando encontrada no repositório', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage)

      // Act
      const result = await service.findById(uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(result).toBeValidResultWithValue(mockImage)
    })

    it('deve retornar falha quando a imagem não é encontrada', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await service.findById(uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(result).toBeInvalidResult()
    })

    it('deve retornar falha quando o UID é inválido', async () => {
      // Arrange
      const invalidUid = v7()

      // Act
      const result = await service.findById(invalidUid)

      // Assert
      expect(repositoryMock.findById).not.toHaveBeenCalled()
      expect(result).toBeInvalidResult()
    })

    it('deve retornar falha quando ocorre um erro no repositório', async () => {
      // Arrange
      const error = new Error('Erro no banco de dados')
      repositoryMock.findById.mockRejectedValue(error)

      // Act
      await expect(service.findById(uid.value)).rejects.toThrow(error)
    })
  })

  describe('create', () => {
    const imageProcessedBuffer = {
      small: Buffer.from('small'),
      normal: Buffer.from('normal'),
      large: Buffer.from('large'),
    }

    it('deve criar uma imagem com sucesso quando todos os passos são bem-sucedidos', async () => {
      // Arrange
      handlerMock.process.mockResolvedValue(success(imageProcessedBuffer))
      storageMock.save.mockResolvedValue(savedUrlsMock)
      repositoryMock.create.mockResolvedValue(mockImage)

      // Act
      const result = await service.create(mockTitle, mockDescription, mockFile, mockConfig)

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig)
      expect(storageMock.save).toHaveBeenCalledWith('./storage/image/', imageProcessedBuffer)
      expect(repositoryMock.create).toHaveBeenCalledTimes(1)
      expect(result).toBeValidResultWithValue(mockImage)
    })

    it('deve retornar falha quando o processamento da imagem falha', async () => {
      // Arrange
      const processFailures = { code: FailureCode.INVALID_ENUM_VALUE }
      handlerMock.process.mockResolvedValue(failure(processFailures))

      // Act
      const result = await service.create(mockTitle, mockDescription, mockFile, mockConfig)

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig)
      expect(storageMock.save).not.toHaveBeenCalled()
      expect(repositoryMock.create).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(processFailures)
    })

    it('deve retornar falha quando o salvamento no storage falha', async () => {
      // Arrange
      const err = new Error('Falha ao salvar no storage')
      handlerMock.process.mockResolvedValue(success(imageProcessedBuffer))
      storageMock.save.mockRejectedValue(err)

      // Act
      await expect(service.create(mockTitle, mockDescription, mockFile, mockConfig)).rejects.toThrow(err)

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig)
      expect(storageMock.save).toHaveBeenCalledTimes(1)
      expect(storageMock.save).toHaveBeenCalledWith('./storage/image/', imageProcessedBuffer)
      expect(repositoryMock.create).not.toHaveBeenCalled()
    })

    it('deve limpar o storage e retornar falha quando a criação da entidade Image falha', async () => {
      // Arrange
      const invalidTitle: ITextContent[] = [
        CreateTestTextContent({ language: SupportedLanguageEnum.EN }),
        { language: 'en', text: 'A invalid text with special characters ‡┴' },
      ]
      handlerMock.process.mockResolvedValue(success(imageProcessedBuffer))
      storageMock.save.mockResolvedValue(savedUrlsMock)
      storageMock.delete.mockResolvedValue(null)

      // Act
      const result = await service.create(invalidTitle, mockDescription, mockFile, mockConfig)

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig)
      expect(storageMock.save).toHaveBeenCalledWith('./storage/image/', imageProcessedBuffer)
      expect(repositoryMock.create).not.toHaveBeenCalled()
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid)
      expect(result).toBeInvalidResult()
    })

    it('deve limpar o storage e retornar falha quando o salvamento no repositório falha', async () => {
      // Arrange
      const err = new Error('repository error')
      handlerMock.process.mockResolvedValue(success(imageProcessedBuffer))
      storageMock.save.mockResolvedValue(savedUrlsMock)
      repositoryMock.create.mockRejectedValue(err)
      storageMock.delete.mockResolvedValue(null)

      // Act
      await expect(service.create(mockTitle, mockDescription, mockFile, mockConfig)).rejects.toThrow(err)

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig)
      expect(storageMock.save).toHaveBeenCalledWith('./storage/image/', imageProcessedBuffer)
      expect(repositoryMock.create).toHaveBeenCalledTimes(1)
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid)
    })

    it('deve limpar o storage e lançar exceção quando ocorre um erro inesperado', async () => {
      const err = new Error('Erro inesperado')
      handlerMock.process.mockResolvedValue(success(imageProcessedBuffer))
      storageMock.save.mockResolvedValue(savedUrlsMock)
      repositoryMock.create.mockRejectedValue(err)
      storageMock.delete.mockResolvedValue(null)

      await expect(service.create(mockTitle, mockDescription, mockFile, mockConfig)).rejects.toThrow(err)
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid)
    })
  })

  describe('updateMetadata', () => {
    const updateImageParams: IUpdateImageMetadataParams = {
      title: CreateMultilingualTextContent(),
      description: CreateMultilingualTextContent(),
    }

    it('deve atualizar uma imagem com sucesso quando todos os passos são bem-sucedidos', async () => {
      // Arrange
      const updatedImage = CloneTestImageWithOverrides(mockImage, updateImageParams)
      const updatedImageInRepository = CloneTestImageWithOverrides(updatedImage, {})
      repositoryMock.findById.mockResolvedValue(mockImage)
      jest.spyOn(mockImage, 'updateMetadata').mockReturnValue(success(updatedImage))
      repositoryMock.update.mockResolvedValue(updatedImageInRepository)

      // Act
      const result = await service.updateMetadata(mockImage.uid.value, updateImageParams)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(mockImage.updateMetadata).toHaveBeenCalledWith(updateImageParams)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedImage)
      expect(result).toBeValidResultWithValue(updatedImageInRepository)
    })

    it('deve retornar falha quando a imagem não é encontrada', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await service.updateMetadata(uid.value, updateImageParams)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve retornar falha quando o UID é inválido', async () => {
      const invalidUid = 'invalid-uid'

      const result = await service.updateMetadata(invalidUid, updateImageParams)

      expect(repositoryMock.findById).not.toHaveBeenCalled()
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResult()
    })

    it('deve retornar falha quando os parâmetros de atualização são inválidos', async () => {
      const invalidParams = {
        title: [
          { language: 'pt', text: 'Título válido' },
          { language: 'en', text: 'Invalid title with special characters ‡┴' },
        ],
      }
      repositoryMock.findById.mockResolvedValue(mockImage)
      jest.spyOn(mockImage, 'updateMetadata').mockReturnValue(failure(mockSimpleFailure))

      const result = await service.updateMetadata(uid.value, invalidParams)

      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(mockImage.updateMetadata).toHaveBeenCalledWith(invalidParams)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando o repositório falha ao atualizar', async () => {
      repositoryMock.findById.mockResolvedValue(mockImage)
      repositoryMock.update.mockRejectedValue(mockThrowError)

      await expect(service.updateMetadata(uid.value, updateImageParams)).rejects.toThrow(mockThrowError)

      expect(repositoryMock.findById).toHaveBeenCalledWith(uid)
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('delete', () => {
    it('deve excluir uma imagem com sucesso quando todos os passos são bem-sucedidos', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage)
      storageMock.delete.mockResolvedValue(null)
      repositoryMock.delete.mockResolvedValue(undefined)

      // Act
      const result = await service.delete(uid.value)

      // Assert
      expect(storageMock.delete).toHaveBeenCalledWith(uid.value)
      expect(repositoryMock.delete).toHaveBeenCalledWith(uid)
      expect(result).toBeValidResult()
    })

    it('deve relançar erro quando a exclusão do storage falha', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage)
      storageMock.delete.mockRejectedValue(mockThrowError)

      // Act
      await expect(service.delete(uid.value)).rejects.toThrow(mockThrowError)

      // Assert
      expect(repositoryMock.delete).toHaveBeenCalledWith(uid)
      expect(storageMock.delete).toHaveBeenCalledWith(uid.value)
    })

    it('deve relançar erro quando a exclusão no repositório falha', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage)
      storageMock.delete.mockResolvedValue(null)
      repositoryMock.delete.mockRejectedValue(mockThrowError)

      // Act
      await expect(service.delete(uid.value)).rejects.toThrow(mockThrowError)

      expect(storageMock.delete).not.toHaveBeenCalled()
      expect(repositoryMock.delete).toHaveBeenCalledWith(uid)
    })
  })
})
