import { RoomService } from "./room.service";
import { IRoomRepository } from "../repository/room.repository.interface";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomStatus,
} from "../entity/room";
import { failure, success } from "../../../shared/result/result";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { Screen, ScreenType } from "../entity/value-object/screen";

describe("RoomService", () => {
  let roomService: RoomService;
  let repositoryMock: jest.Mocked<IRoomRepository>;
  let roomMock: Room;
  let validRoomId: number;
  let validSeatConfig: ISeatRowConfiguration[];
  let validScreenInput: ICreateScreenInput;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IRoomRepository>;

    roomService = new RoomService(repositoryMock);

    validRoomId = 1;
    validSeatConfig = [
      {
        rowId: 1,
        columns: "ABCD",
        preferentialSeats: ["A1", "B1"],
      },
      {
        rowId: 2,
        columns: "ABCDE",
        preferentialSeats: ["C2"],
      },
    ];
    validScreenInput = {
      size: 20,
      type: "2D",
    };

    const screen = Screen.hydrate(20, ScreenType["2D"]);
    roomMock = Room.hydrate(
      validRoomId,
      2,
      ["ABCD", "ABCDE"],
      ["A1", "B1", "C2"],
      9,
      screen,
      RoomStatus.AVAILABLE,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve retornar uma sala quando encontrada pelo ID", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);

      // Act
      const result = await roomService.findById(validRoomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(roomMock);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(validRoomId);
    });

    it("deve retornar um erro quando id for inválido", async () => {
      // Act
      const result = await roomService.findById(null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.findById(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(validRoomId);
    });
  });

  describe("create", () => {
    it("deve criar uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      jest.spyOn(Room, "create").mockReturnValue(success(roomMock));
      repositoryMock.create.mockResolvedValue(roomMock);

      // Act
      const result = await roomService.create(
        validRoomId,
        validSeatConfig,
        validScreenInput,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(result.value).toEqual(roomMock);
      expect(Room.create).toHaveBeenCalledWith(
        validRoomId,
        validSeatConfig,
        validScreenInput,
        undefined,
      );
      expect(repositoryMock.create).toHaveBeenCalledWith(roomMock);
    });

    it("deve retornar failure quando a sala já existe", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);

      // Act
      const result = await roomService.create(
        validRoomId,
        validSeatConfig,
        validScreenInput,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_ALREADY_EXISTS);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a validação da sala falha", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      const failures = [{ code: "INVALID_ROOM_DATA" }];
      jest.spyOn(Room, "create").mockReturnValue(failure(failures));

      // Act
      const result = await roomService.create(
        validRoomId,
        validSeatConfig,
        validScreenInput,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deve excluir uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      const result = await roomService.delete(validRoomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeNull();
      expect(repositoryMock.delete).toHaveBeenCalledWith(validRoomId);
    });

    it("deve retornar failure quando a sala não existe", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.delete(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });
  });

  describe("closeRoom", () => {
    /*    it("deve fechar uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);
      const closedRoomMock = { ...roomMock, status: RoomStatus.CLOSED };
      jest.spyOn(roomMock, "changeStatus").mockReturnValue(success(closedRoomMock));
      repositoryMock.update.mockResolvedValue(closedRoomMock);

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(closedRoomMock);
      expect(roomMock.changeStatus).toHaveBeenCalledWith(RoomStatus.CLOSED);
      expect(repositoryMock.update).toHaveBeenCalledWith(validRoomId, closedRoomMock);
    });*/

    it("deve retornar failure quando a sala não existe", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a mudança de status falha", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);
      const failures = [{ code: "INVALID_STATUS_TRANSITION" }];
      jest.spyOn(roomMock, "changeStatus").mockReturnValue(failure(failures));

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
