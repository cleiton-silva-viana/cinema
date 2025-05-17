import { RoomService } from "./room.service";
import { IRoomRepository } from "../repository/room.repository.interface";
import {
  ICreateScreenInput,
  ISeatRowConfiguration,
  Room,
  RoomAdministrativeStatus,
} from "../entity/room";
import { failure, success } from "../../../shared/result/result";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { RoomUID } from "../entity/value-object/room.uid";
import { v4 } from "uuid";
import { BookingType } from "../entity/value-object/booking.slot";

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
        rowNumber: 1,
        lastColumnLetter: "D",
        preferentialSeatLetters: ["A", "B"],
      },
      {
        rowNumber: 2,
        lastColumnLetter: "E",
        preferentialSeatLetters: ["C"],
      },
    ];
    validScreenInput = {
      size: 20,
      type: "2D",
    };

    roomMock = Room.hydrate({
      identifier: 1,
      schedule: [
        {
          screeningUID: v4(),
          bookingUID: v4(),
          type: BookingType.SCREENING,
          startTime: new Date(new Date().getTime() + 10 * 60 * 1000),
          endTime: new Date(new Date().getTime() + 20 * 60 * 1000),
        },
      ],
      layout: {
        seatRows: [
          { rowNumber: 1, lastColumnLetter: "F" },
          { rowNumber: 2, lastColumnLetter: "F" },
          { rowNumber: 3, lastColumnLetter: "F" },
        ],
      },
      roomUID: RoomUID.create().value,
      screen: validScreenInput,
      status: RoomAdministrativeStatus.AVAILABLE,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve retornar uma sala quando o id for válido", async () => {
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
        RoomAdministrativeStatus.AVAILABLE,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(result.value).toEqual(roomMock);
      expect(Room.create).toHaveBeenCalledWith({
        identifier: validRoomId,
        seatConfig: validSeatConfig,
        screen: validScreenInput,
        status: RoomAdministrativeStatus.AVAILABLE,
      });
      expect(repositoryMock.create).toHaveBeenCalledWith(roomMock);
    });

    it("deve criar uma sala com status padrão quando não informado", async () => {
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
      expect(Room.create).toHaveBeenCalledWith({
        identifier: validRoomId,
        seatConfig: validSeatConfig,
        screen: validScreenInput,
        status: undefined,
      });
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
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).toHaveBeenCalledWith(validRoomId);
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.delete(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o id for inválido", async () => {
      // Act
      const result = await roomService.delete(null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });
  });

  describe("closeRoom", () => {
    it("deve fechar uma sala com sucesso", async () => {
      // Arrange
      const params = {
        identifier: 1,
        schedule: [] as any, // Sem agendamentos
        layout: {
          seatRows: [
            { rowNumber: 1, lastColumnLetter: "F" },
            { rowNumber: 2, lastColumnLetter: "F" },
            { rowNumber: 3, lastColumnLetter: "F" },
          ],
        },
        roomUID: RoomUID.create().value,
        screen: validScreenInput,
        status: RoomAdministrativeStatus.AVAILABLE,
      };
      const roomWithoutBookings = Room.hydrate(params);

      const roomUpdated = { ...params };
      roomUpdated.status = RoomAdministrativeStatus.CLOSED;
      const roomWithStatusUpdated = Room.hydrate(roomUpdated);

      repositoryMock.findById.mockResolvedValue(roomWithoutBookings);
      repositoryMock.update.mockResolvedValue(roomWithStatusUpdated);

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(roomWithStatusUpdated);
      expect(repositoryMock.update).toHaveBeenCalledWith(
        validRoomId,
        roomWithoutBookings,
      );
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o id for inválido", async () => {
      // Act
      const result = await roomService.closeRoom(null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a mudança de status falha", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomMock);
      const failures = [{ code: FailureCode.ROOM_HAS_FUTURE_BOOKINGS }];
      jest.spyOn(roomMock, "changeStatus").mockReturnValue(failure(failures));

      // Act
      const result = await roomService.closeRoom(validRoomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(roomMock.changeStatus).toHaveBeenCalledWith(
        RoomAdministrativeStatus.CLOSED,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
