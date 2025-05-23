import { IImageHandler } from "../handler/image.handler.interface";
import { IStorageService } from "../../storage/storage.service.interface";
import { IImageRepository } from "../repository/image.repository.interface";
import { failure, success } from "../../../shared/result/result";
import { Image, ItextContent } from "../entity/image";
import { v7 } from "uuid";
import {
  AspectRatio,
  CompressionType,
  ImageExtension,
  ImageHandlerConfig,
} from "../handler/types/image.handler.config";
import { ImageUID } from "../entity/value-object/image.uid";
import { ImageApplicationService } from "./image.application.service";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../shared/validator/common.validators";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

describe("ImageService", () => {
  let service: ImageApplicationService;
  let handlerMock: jest.Mocked<IImageHandler>;
  let storageMock: jest.Mocked<IStorageService>;
  let repositoryMock: jest.Mocked<IImageRepository>;
  let failures: SimpleFailure[];

  const uid = ImageUID.create().value;
  const mockTitle: ItextContent[] = [
    { language: "pt", text: "Título de teste" },
    { language: "en", text: "Title for test" },
  ];
  const mockDescription: ItextContent[] = [
    { language: "pt", text: "Descrição de teste" },
    { language: "en", text: "Description for test" },
  ];
  const savedUrlsMock = {
    small: "http://example.com/small.jpg",
    normal: "http://example.com/normal.jpg",
    large: "http://example.com/large.jpg",
    uid: uid,
  };
  const mockImage = Image.hydrate({
    uid: uid,
    title: mockTitle[0],
    description: mockDescription[0],
    sizes: savedUrlsMock,
  });
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
    failures = [];
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

    service = new ImageApplicationService(
      handlerMock,
      storageMock,
      repositoryMock,
    );
  });

  describe("findById", () => {
    it("deve retornar uma imagem quando encontrada no repositório", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);

      // Act
      const result = validateAndCollect(await service.findById(uid), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockImage);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
    });

    it("deve retornar falha quando a imagem não é encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(await service.findById(uid), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
    });

    it("deve retornar falha quando o UID é inválido", async () => {
      // Arrange
      const uid = v7();

      // Act
      const result = validateAndCollect(await service.findById(uid), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando ocorre um erro no repositório", async () => {
      // Arrange
      const error = new Error("Erro no banco de dados");
      repositoryMock.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findById(uid)).rejects.toThrow(error);
    });
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
      const result = validateAndCollect(
        await service.create(mockTitle, mockDescription, mockFile, mockConfig),
        failures,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockImage);
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("deve retornar falha quando o processamento da imagem falha", async () => {
      // Arrange
      const processFailures = [{ code: FailureCode.INVALID_ENUM_VALUE }];
      handlerMock.process.mockResolvedValue(failure(processFailures));

      // Act
      const result = validateAndCollect(
        await service.create(mockTitle, mockDescription, mockFile, mockConfig),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toEqual(processFailures);
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).not.toHaveBeenCalled();
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve retornar falha e não prosseguir quando o salvamento no storage falha", async () => {
      // Arrange
      const saveFailures = [{ code: FailureCode.INVALID_ENUM_VALUE }];

      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(failure(saveFailures));

      // Act
      const result = validateAndCollect(
        await service.create(mockTitle, mockDescription, mockFile, mockConfig),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toEqual(saveFailures);
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve limpar o storage e retornar falha quando a criação da entidade Image falha", async () => {
      // Arrange
      const title: ItextContent[] = [
        { language: "pt", text: "Um texto válido" },
        { language: "en", text: "A invalid text with special characters ‡┴" },
      ];
      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      storageMock.delete.mockResolvedValue(success(null));
      repositoryMock.create.mockResolvedValue(mockImage);

      // Act
      const result = validateAndCollect(
        await service.create(title, mockDescription, mockFile, mockConfig),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid);
    });

    it("deve limpar o storage e retornar falha quando o salvamento no repositório falha", async () => {
      // Arrange
      handlerMock.process.mockResolvedValue(success(processedImages));
      storageMock.save.mockResolvedValue(success(savedUrlsMock));
      repositoryMock.create.mockResolvedValue(null);
      storageMock.delete.mockResolvedValue(success(null));

      // Act
      const result = validateAndCollect(
        await service.create(mockTitle, mockDescription, mockFile, mockConfig),
        failures,
      );

      // Assert
      expect(handlerMock.process).toHaveBeenCalledWith(mockFile, mockConfig);
      expect(storageMock.save).toHaveBeenCalledWith(
        "./storage/image/",
        processedImages,
      );
      expect(repositoryMock.create).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledWith(savedUrlsMock.uid);
      expect(result).toBeNull();
      expect(failures).toBeDefined();
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

  describe("update", () => {
    const mockUpdateParams = {
      title: [
        { language: "pt", text: "Título atualizado" },
        { language: "en", text: "Updated title" },
      ],
      description: [
        { language: "pt", text: "Descrição atualizada" },
        { language: "en", text: "Updated description" },
      ],
    };

    const updatedImage = {
      ...mockImage,
      title: mockUpdateParams.title,
      description: mockUpdateParams.description,
    } as unknown as Image;

    beforeEach(() => {
      repositoryMock.update = jest.fn();
    });

    it("deve atualizar uma imagem com sucesso quando todos os passos são bem-sucedidos", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);
      repositoryMock.update.mockResolvedValue(updatedImage);

      // Act
      const result = validateAndCollect(
        await service.update(uid, mockUpdateParams),
        failures,
      );

      // Assert
      expect(result).toEqual(updatedImage);
      expect(result).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("deve retornar falha quando a imagem não é encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await service.update(uid, mockUpdateParams),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o UID é inválido", async () => {
      // Arrange
      const invalidUid = "invalid-uid";

      // Act
      const result = validateAndCollect(
        await service.update(invalidUid, mockUpdateParams),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando os parâmetros de atualização são inválidos", async () => {
      // Arrange
      const invalidParams = {
        title: [
          { language: "pt", text: "Título válido" },
          { language: "en", text: "Invalid title with special characters ‡┴" },
        ],
      };
      repositoryMock.findById.mockResolvedValue(mockImage);

      // Act
      const result = validateAndCollect(
        await service.update(uid, invalidParams),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o repositório falha ao atualizar", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);
      repositoryMock.update.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await service.update(uid, mockUpdateParams),
        failures,
      );

      // Assert
      expect(result).toBeNull();
      expect(failures).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("deve lançar exceção quando ocorre um erro inesperado", async () => {
      // Arrange
      const unexpectedError = new Error("Erro inesperado na atualização");
      repositoryMock.findById.mockResolvedValue(mockImage);
      repositoryMock.update.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(service.update(uid, mockUpdateParams)).rejects.toThrow(
        unexpectedError,
      );
    });
  });

  describe("delete", () => {
    it("deve excluir uma imagem com sucesso quando todos os passos são bem-sucedidos", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(success(null));
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      validateAndCollect(await service.delete(uid), failures);

      // Assert
      expect(failures).toHaveLength(0);
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1);
    });

    it("deve retornar falha quando a exclusão do storage falha", async () => {
      // Arrange
      const storageFailures = [{ code: FailureCode.INVALID_ENUM_VALUE }];
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(failure(storageFailures));

      // Act
      validateAndCollect(await service.delete(uid), failures);

      // Assert
      expect(failures).toEqual(storageFailures);
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando a exclusão no repositório falha", async () => {
      // Arrange
      const error = new Error("error for test");
      repositoryMock.findById.mockResolvedValue(mockImage);
      storageMock.delete.mockResolvedValue(success(null));
      repositoryMock.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(() => service.delete(uid)).rejects.toThrow(error);
    });
  });
});
