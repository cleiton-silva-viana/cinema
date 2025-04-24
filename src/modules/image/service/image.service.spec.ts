import { ImageService } from "./image.service";
import { IImageHandler } from "../handler/image.handler.interface";
import { IStorageService } from "../../storage/storage.service.interface";
import { IImageRepository } from "../repository/image.repository.interface";
import { failure, success } from "../../../shared/result/result";
import { Image, textContent } from "../entity/image";
import { v4 } from "uuid";
import {
  AspectRatio,
  CompressionType,
  ImageExtension,
  ImageHandlerConfig,
} from "../handler/types/image.handler.config";
import { ImageUID } from "../entity/value-object/image-uid.vo";

describe("ImageService", () => {
  let service: ImageService;
  let handlerMock: jest.Mocked<IImageHandler>;
  let storageMock: jest.Mocked<IStorageService>;
  let repositoryMock: jest.Mocked<IImageRepository>;

  const mockTitle: textContent[] = [
    { language: "pt", text: "Título de teste" },
    { language: "en", text: "Title for test" },
  ];
  const mockDescription: textContent[] = [
    { language: "pt", text: "Descrição de teste" },
    { language: "en", text: "Description for test" },
  ];
  const savedUrlsMock = {
    small: "http://example.com/small.jpg",
    normal: "http://example.com/normal.jpg",
    large: "http://example.com/large.jpg",
    uid: v4(),
  };

  const uid = ImageUID.create().value;
  const mockImage = {
    uid: { value: uid },
    title: mockTitle,
    description: mockDescription,
    urls: savedUrlsMock,
  } as unknown as Image;

  const mockFile = {
    buffer: Buffer.from("test"),
    mimetype: "image/jpeg",
    originalname: "test.jpg",
    size: 100,
    fieldname: "image",
    encoding: "7bit",
    destination: "",
    filename: "",
    path: "",
  } as Express.Multer.File;

  const mockConfig: ImageHandlerConfig = {
    compress: CompressionType.Lossy,
    extension: ImageExtension.JPEG,
    aspect: AspectRatio.Landscape,
    sizes: {
      small: { width: 100, height: 56 },
      normal: { width: 300, height: 169 },
      large: { width: 600, height: 338 },
    },
  };

  beforeEach(async () => {
    handlerMock = {
      process: jest.fn(),
    } as any;

    storageMock = {
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    repositoryMock = {
      create: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new ImageService(handlerMock, storageMock, repositoryMock);
  });

  describe("create", () => {
    const processedImages = {
      small: Buffer.from("small"),
      normal: Buffer.from("normal"),
      large: Buffer.from("large"),
    };

    it("deve criar uma imagem com sucesso quando todos os passos são bem-sucedidos", async () => {
      // Arrange
      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      repositoryMock.create.mockResolvedValue(mockImage);

      // Act
      const result = await service.create(
        mockTitle,
        mockDescription,
        mockFile,
        mockConfig,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(mockImage);
    });

    it("deve retornar falha quando o processamento da imagem falha", async () => {
      // Arrange
      const processFailures = [{ code: "PROCESS_ERROR" }];
      handlerMock.process.mockResolvedValue(failure(processFailures));

      // Act
      const result = await service.create(
        mockTitle,
        mockDescription,
        mockFile,
        mockConfig,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).not.toHaveBeenCalled();
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(processFailures);
    });

    it("deve retornar falha e não prosseguir quando o salvamento no storage falha", async () => {
      // Arrange
      const saveFailures = [{ code: "STORAGE_ERROR" }];

      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(failure(saveFailures));

      // Act
      const result = await service.create(
        mockTitle,
        mockDescription,
        mockFile,
        mockConfig,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(saveFailures);
    });

    it("deve limpar o storage e retornar falha quando a criação da entidade Image falha", async () => {
      // Arrange
      const title: textContent[] = [
        { language: "pt", text: "Um texto válido" },
        { language: "en", text: "A invalid text with special characters ‡┴" },
      ];
      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      storageMock.delete.mockResolvedValue(success(null));

      // Act
      const result = await service.create(
        title,
        mockDescription,
        mockFile,
        mockConfig,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid);
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true);
    });

    it("deve limpar o storage e retornar falha quando o salvamento no repositório falha", async () => {
      // Arrange
      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      repositoryMock.create.mockResolvedValue(null);
      storageMock.delete.mockResolvedValue(success(null));

      // Act
      const result = await service.create(
        mockTitle,
        mockDescription,
        mockFile,
        mockConfig,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid);
      expect(result.invalid).toBe(true);
      expect(result.failures).toBeDefined();
    });

    it("deve limpar o storage e lançar exceção quando ocorre um erro inesperado", async () => {
      // Arrange
      const unexpectedError = new Error("Erro inesperado");

      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      repositoryMock.create.mockRejectedValue(unexpectedError);
      storageMock.delete.mockResolvedValue(success(null));

      // Act & Assert
      await expect(
        service.create(mockTitle, mockDescription, mockFile, mockConfig),
      ).rejects.toThrow(unexpectedError);
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid);
    });
  });

  describe("findById", () => {
    it("deve retornar uma imagem quando encontrada no repositório", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);

      // Act
      const result = await service.findById(uid);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(mockImage);
    });

    it("deve retornar falha quando a imagem não é encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(uid);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(result.invalid).toBe(true);
      expect(result.failures).toBeDefined()
    });

    it("deve retornar falha quando o UID é inválido", async () => {
      // Arrange
      const uid = v4();

      // Act
      const result = await service.findById(uid);

      // Assert
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true)
      expect(result.failures).toBeDefined()
    });

    it("deve retornar falha quando ocorre um erro no repositório", async () => {
      // Arrange
      const error = new Error("Erro no banco de dados");
      repositoryMock.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findById(uid)).rejects.toThrow(error);
    });
  });

  describe("delete", () => {
    it("deve excluir uma imagem com sucesso quando todos os passos são bem-sucedidos", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(success(null));
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      const result = await service.delete(uid);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(result.invalid).toBe(false);
    });

    it("deve retornar falha quando a imagem não é encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await service.delete(uid);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true);
      expect(result.failures).toBeDefined()
    });

    it("deve retornar falha quando a exclusão do storage falha", async () => {
      // Arrange
      const storageFailures = [{ code: "STORAGE_DELETE_ERROR" }];
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(failure(storageFailures));

      // Act
      const result = await service.delete(uid);

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(storageFailures);
    });

    it("deve retornar falha quando a exclusão no repositório falha", async () => {
      // Arrange
      const error = new Error('error for test')
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(success(null));
      repositoryMock.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(() => service.delete(uid)).rejects.toThrow(error)
    });
  });
});
