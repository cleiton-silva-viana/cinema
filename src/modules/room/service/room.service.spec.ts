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
import { IRoomBookingData } from "../entity/value-object/room.schedule";

describe("RoomService", () => {
  let roomService: RoomService;
  let repositoryMock: jest.Mocked<IRoomRepository>;

  let roomInstance: Room;
  let roomId: number;
  let roomUID: RoomUID;
  let screen: ICreateScreenInput;
  let schedule: IRoomBookingData[];
  let layout: ISeatRowConfiguration[];
  let status: RoomAdministrativeStatus;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      roomExists: jest.fn(),
      addBooking: jest.fn(),
      deleteBooking: jest.fn(),
    } as jest.Mocked<IRoomRepository>;

    roomService = new RoomService(repositoryMock);

    roomId = 1;
    roomUID = RoomUID.create();
    screen = {
      size: 20,
      type: "2D",
    };
    schedule = [
      {
        screeningUID: v4(),
        bookingUID: v4(),
        type: BookingType.SCREENING,
        startTime: new Date(new Date().getTime() + 10 * 60 * 1000),
        endTime: new Date(new Date().getTime() + 20 * 60 * 1000),
      },
    ];
    layout = [
      { rowNumber: 1, lastColumnLetter: "F" },
      { rowNumber: 2, lastColumnLetter: "F" },
      { rowNumber: 3, lastColumnLetter: "F" },
    ];
    status = RoomAdministrativeStatus.AVAILABLE;

    roomInstance = Room.hydrate({
      identifier: roomId,
      schedule: schedule,
      layout: {
        seatRows: layout,
      },
      roomUID: RoomUID.create().value,
      screen: screen,
      status: status,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve retornar uma sala quando o id for válido", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.findById(roomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(roomInstance);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
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
      const result = await roomService.findById(roomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });
  });

  describe("create", () => {
    it("deve criar uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      jest.spyOn(Room, "create").mockReturnValue(success(roomInstance));
      repositoryMock.create.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.create(
        roomId,
        layout,
        screen,
        RoomAdministrativeStatus.AVAILABLE,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(result.value).toEqual(roomInstance);
      expect(Room.create).toHaveBeenCalledWith({
        identifier: roomId,
        seatConfig: layout,
        screen: screen,
        status: RoomAdministrativeStatus.AVAILABLE,
      });
      expect(repositoryMock.create).toHaveBeenCalledWith(roomInstance);
    });

    it("deve criar uma sala com status padrão quando não informado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      jest.spyOn(Room, "create").mockReturnValue(success(roomInstance));
      repositoryMock.create.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.create(roomId, layout, screen);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(Room.create).toHaveBeenCalledWith({
        identifier: roomId,
        seatConfig: layout,
        screen: screen,
        status: undefined,
      });
    });

    it("deve retornar failure quando a sala já existe", async () => {
      // Arrange
      repositoryMock.roomExists.mockResolvedValue(true);

      // Act
      const result = await roomService.create(roomId, layout, screen, status);

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
      const result = await roomService.create(roomId, layout, screen);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deve excluir uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      const result = await roomService.delete(roomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeNull();
      expect(repositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(repositoryMock.delete).toHaveBeenCalledWith(roomId);
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.delete(roomId);

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
        screen: screen,
        status: RoomAdministrativeStatus.AVAILABLE,
      };
      const roomWithoutBookings = Room.hydrate(params);

      const roomUpdated = { ...params };
      roomUpdated.status = RoomAdministrativeStatus.CLOSED;
      const roomWithStatusUpdated = Room.hydrate(roomUpdated);

      repositoryMock.findById.mockResolvedValue(roomWithoutBookings);
      repositoryMock.update.mockResolvedValue(roomWithStatusUpdated);

      // Act
      const result = await roomService.closeRoom(roomId);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(roomWithStatusUpdated);
      expect(repositoryMock.update).toHaveBeenCalledWith(
        roomId,
        roomWithoutBookings,
      );
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.closeRoom(roomId);

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
      repositoryMock.findById.mockResolvedValue(roomInstance);
      const failures = [{ code: FailureCode.ROOM_HAS_FUTURE_BOOKINGS }];
      jest
        .spyOn(roomInstance, "changeStatus")
        .mockReturnValue(failure(failures));

      // Act
      const result = await roomService.closeRoom(roomId);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(roomInstance.changeStatus).toHaveBeenCalledWith(
        RoomAdministrativeStatus.CLOSED,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("scheduleCleaning", () => {
    it("deve agendar uma limpeza com sucesso", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      startDate.setMinutes(5, 0, 0);
      const duration = 30;

      const updatedRoom = Room.hydrate({
        identifier: roomId,
        roomUID: roomUID.value,
        schedule: [],
        layout: {
          seatRows: layout,
        },
        screen: screen,
        status: status,
      });

      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.addBooking.mockResolvedValue(updatedRoom);

      // Act
      const result = await roomService.scheduleCleaning(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(updatedRoom);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.addBooking).toHaveBeenCalledTimes(1);
    });

    it("deve retornar failure quando a data de início for no passado", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() - 60 * 60 * 1000); // 1 hora no passado
      const duration = 30; // 30 minutos

      // Act
      const result = await roomService.scheduleCleaning(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const duration = 30; // 30 minutos
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.scheduleCleaning(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento da limpeza falhar", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const duration = 30; // 30 minutos
      const failures = [{ code: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD }];

      repositoryMock.findById.mockResolvedValue(roomInstance);
      jest
        .spyOn(roomInstance, "scheduleCleaning")
        .mockReturnValue(failure(failures));

      // Act
      const result = await roomService.scheduleCleaning(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    describe("valida inputs com valores nulos", () => {
      const invalidInputs = [
        {
          scenario: "deve retornar failure quando roomId não for fornecido",
          input: {
            roomID: null as any,
          },
        },
        {
          scenario: "deve retornar failure quando startIn não for fornecido",
          input: {
            startTime: null as Date,
          },
        },
        {
          scenario: "deve retornar failure quando duration não for fornecida",
          input: {
            duration: null as number,
          },
        },
      ];

      invalidInputs.forEach(({ scenario, input }) => {
        it(scenario, async () => {
          // Arrange
          const params = {
            roomID: 1,
            startTime: new Date(new Date().getTime() + 60 * 60 * 1000),
            duration: 30,
            ...input,
          };

          // Act
          const result = await roomService.scheduleCleaning(
            params.roomID,
            params.startTime,
            params.duration,
          );

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.MISSING_REQUIRED_DATA,
          );
          expect(result.failures[0].details).toEqual({
            fields: ["roomID", "startsIn", "duration"],
          });
          expect(repositoryMock.addBooking).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("scheduleMaintenance", () => {
    it("deve agendar uma manutenção com sucesso", async () => {
      // Arrange
      const updatedRoomInstance = Room.hydrate({
        identifier: roomId,
        roomUID: roomUID.value,
        screen,
        layout: {
          seatRows: layout,
        },
        status,
        schedule: schedule,
      });

      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      startDate.setMinutes(5, 0, 0);
      const duration = 120; // 2 horas

      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.addBooking.mockResolvedValue(updatedRoomInstance);

      // Act
      const result = await roomService.scheduleMaintenance(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.addBooking).toHaveBeenCalledTimes(1);
      expect(result.value).toEqual(updatedRoomInstance);
    });

    it("deve retornar failure quando a data de início for no passado", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() - 60 * 60 * 1000); // 1 hora no passado
      const duration = 120; // 2 horas

      // Act
      const result = await roomService.scheduleMaintenance(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const duration = 120; // 2 horas
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.scheduleMaintenance(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento da manutenção falhar", async () => {
      // Arrange
      const startDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const duration = 120; // 2 horas
      const failures = [{ code: FailureCode.ROOM_NOT_AVAILABLE_FOR_PERIOD }];

      repositoryMock.findById.mockResolvedValue(roomInstance);
      jest
        .spyOn(roomInstance, "scheduleMaintenance")
        .mockReturnValue(failure(failures));

      // Act
      const result = await roomService.scheduleMaintenance(
        roomId,
        startDate,
        duration,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.addBooking).not.toHaveBeenCalled();
    });

    describe("valida inputs com valores nulos", () => {
      const invalidInputs = [
        {
          scenario: "deve retornar failure quando roomId não for fornecido",
          input: {
            roomID: null as any,
          },
        },
        {
          scenario: "deve retornar failure quando startIn não for fornecido",
          input: {
            startTime: null as Date,
          },
        },
        {
          scenario: "deve retornar failure quando duration não for fornecida",
          input: {
            duration: null as number,
          },
        },
      ];

      invalidInputs.forEach(({ scenario, input }) => {
        it(scenario, async () => {
          // Arrange
          const params = {
            roomID: 1,
            startTime: new Date(new Date().getTime() + 60 * 60 * 1000),
            duration: 30,
            ...input,
          };

          // Act
          const result = await roomService.scheduleMaintenance(
            params.roomID,
            params.startTime,
            params.duration,
          );

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.MISSING_REQUIRED_DATA,
          );
          expect(result.failures[0].details).toEqual({
            fields: ["roomID", "startsIn", "duration"],
          });
          expect(repositoryMock.addBooking).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("removeCleaningScheduled", () => {
    it("deve remover um agendamento de limpeza com sucesso", async () => {
      // Arrange
      const uid = v4();
      const paramsWithCleaning = {
        roomUID: roomUID.value,
        screen: screen,
        identifier: roomId,
        status: status,
        layout: {
          seatRows: layout,
        },
        schedule: [
          ...schedule,
          {
            startTime: new Date(Date.now() + 60 * 60000), // 1 hora no futuro
            endTime: new Date(Date.now() + 80 * 60000),
            type: BookingType.CLEANING,
            bookingUID: uid,
            screeningUID: null,
          },
        ],
      };

      const roomWithCleaning = Room.hydrate(paramsWithCleaning);

      repositoryMock.findById.mockResolvedValue(roomWithCleaning);
      repositoryMock.deleteBooking.mockResolvedValue(null);

      // Act
      const result = await roomService.removeCleaningScheduled(roomId, uid);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeNull();
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.deleteBooking).toHaveBeenCalledWith(roomId, uid);
      expect(repositoryMock.deleteBooking).toHaveBeenCalledTimes(1);
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      const bookingUID = v4();
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.removeCleaningScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento não existir", async () => {
      // Arrange
      const bookingUID = v4();

      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeCleaningScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(
        FailureCode.BOOKING_NOT_FOUND_IN_FUTURE_SCHEDULE,
      );
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento já tiver iniciado", async () => {
      // Arrange
      const bookingUID = v4();
      const pastDate = new Date(new Date().getTime() - 10 * 60 * 1000); // 10 minutos no passado
      const cleaningBooking = {
        bookingUID,
        type: BookingType.CLEANING,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + 30 * 60 * 1000),
        screeningUID: null as any,
      };

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(cleaningBooking as any);
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeCleaningScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.BOOKING_ALREADY_STARTED);
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a limpeza estiver associada a uma exibição", async () => {
      // Arrange
      const bookingUID = v4();
      const screeningUID = v4();
      const futureDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const cleaningBooking = {
        bookingUID,
        type: BookingType.CLEANING,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 30 * 60 * 1000),
        screeningUID,
      };

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(cleaningBooking as any);
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeCleaningScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(
        FailureCode.CLEANING_ASSOCIATED_WITH_SCREENING,
      );
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });
  });

  describe("removeMaintenanceScheduled", () => {
    it("deve remover um agendamento de manutenção com sucesso", async () => {
      // Arrange
      const bookingUID = v4();
      const futureDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const maintenanceBooking = {
        bookingUID,
        type: BookingType.MAINTENANCE,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 120 * 60 * 1000),
        screeningUID: null as any,
      };

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(maintenanceBooking as any);
      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.deleteBooking.mockResolvedValue(null);

      // Act
      const result = await roomService.removeMaintenanceScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeNull();
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
      expect(roomInstance.findBookingDataByUID).toHaveBeenCalledWith(
        bookingUID,
      );
      expect(repositoryMock.deleteBooking).toHaveBeenCalledWith(
        roomId,
        bookingUID,
      );
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      const bookingUID = v4();
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await roomService.removeMaintenanceScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento não existir", async () => {
      // Arrange
      const bookingUID = v4();

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(undefined);
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeMaintenanceScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(
        FailureCode.BOOKING_NOT_FOUND_IN_FUTURE_SCHEDULE,
      );
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o agendamento já tiver iniciado", async () => {
      // Arrange
      const bookingUID = v4();
      const pastDate = new Date(new Date().getTime() - 10 * 60 * 1000); // 10 minutos no passado
      const maintenanceBooking = {
        bookingUID,
        type: BookingType.MAINTENANCE,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + 120 * 60 * 1000),
        screeningUID: null as any,
      };

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(maintenanceBooking as any);
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeMaintenanceScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.BOOKING_ALREADY_STARTED);
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o tipo de agendamento não for manutenção", async () => {
      // Arrange
      const bookingUID = v4();
      const futureDate = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hora no futuro
      const screeningBooking = {
        bookingUID,
        type: BookingType.SCREENING,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 120 * 60 * 1000),
        screeningUID: v4(),
      };

      jest
        .spyOn(roomInstance, "findBookingDataByUID")
        .mockReturnValue(screeningBooking as any);
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await roomService.removeMaintenanceScheduled(
        roomId,
        bookingUID,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(
        FailureCode.INVALID_BOOKING_TYPE_FOR_REMOVAL,
      );
      expect(repositoryMock.deleteBooking).not.toHaveBeenCalled();
    });
  });
});
