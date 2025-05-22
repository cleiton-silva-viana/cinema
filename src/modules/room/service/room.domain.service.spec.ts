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
import { BookingSlot, BookingType } from "../entity/value-object/booking.slot";
import { IRoomBookingData } from "../entity/value-object/room.schedule";
import { RoomDomainService } from "./room.domain.service";
import { validateAndCollect } from "../../../shared/validator/common.validators";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";

describe("RoomDomainService", () => {
  let failures: SimpleFailure[]
  let roomService: RoomDomainService;
  let repositoryMock: jest.Mocked<IRoomRepository>;

  let roomInstance: Room;
  let roomId: number;
  let roomUID: RoomUID;
  let screen: ICreateScreenInput;
  let schedule: IRoomBookingData[];
  let layout: ISeatRowConfiguration[];
  let status: RoomAdministrativeStatus;

  beforeEach(() => {
    failures = []

    repositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      roomExists: jest.fn(),
      addBooking: jest.fn(),
      deleteBooking: jest.fn(),
    } as jest.Mocked<IRoomRepository>;

    roomService = new RoomDomainService(repositoryMock);

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
      { rowNumber: 1, lastColumnLetter: "F", preferentialSeatLetters: [] },
      { rowNumber: 2, lastColumnLetter: "F", preferentialSeatLetters: [] },
      { rowNumber: 3, lastColumnLetter: "F", preferentialSeatLetters: [] },
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
      const result = validateAndCollect(await roomService.findById(roomId), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(roomInstance);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it("deve retornar um erro quando id for inválido", async () => {
      // Act
      const result = validateAndCollect(await roomService.findById(null), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a sala não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(await roomService.findById(roomId), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });
  });

  describe("create", () => {
    it("deve criar uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      jest.spyOn(Room, "create").mockReturnValue(success(roomInstance));

      // Act
      const result = validateAndCollect(await roomService.create(
        roomId,
        layout,
        screen,
        RoomAdministrativeStatus.AVAILABLE,
      ), failures);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(roomInstance);
      expect(Room.create).toHaveBeenCalledWith({
        identifier: roomId,
        seatConfig: layout,
        screen: screen,
        status: RoomAdministrativeStatus.AVAILABLE,
      });
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve criar uma sala com status padrão quando não informado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      jest.spyOn(Room, "create").mockReturnValue(success(roomInstance));

      // Act
      const result = validateAndCollect(await roomService.create(roomId, layout, screen), failures);

      // Assert
      expect(result).toBeDefined();
      expect(Room.create).toHaveBeenCalledWith({
        identifier: roomId,
        seatConfig: layout,
        screen: screen,
        status: undefined,
      });
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a sala já existe", async () => {
      // Arrange
      repositoryMock.roomExists.mockResolvedValue(true);

      // Act
      const result = validateAndCollect(await roomService.create(roomId, layout, screen, status), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_ALREADY_EXISTS);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando a validação da sala falha", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);
      const fails: SimpleFailure[] = [{ code: FailureCode.MISSING_REQUIRED_DATA }];
      jest.spyOn(Room, "create").mockReturnValue(failure(fails));

      // Act
      const result = validateAndCollect(await roomService.create(roomId, layout, screen), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures).toEqual(failures);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('scheduleActivity', () => {
    const futureDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 1 dia no futuro
    futureDate.setMinutes(0, 0, 0)
    const duration = 30;

    it('deve agendar uma atividade de limpeza com sucesso', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.CLEANING, futureDate, duration),
        failures
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.getAllBookings().length).toBe(roomInstance.getAllBookings().length + 1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

   it('deve agendar uma atividade de manutenção com sucesso', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.MAINTENANCE, futureDate, duration),
        failures
      );

      // Assert
     expect(result).toBeDefined();
     expect(result.getAllBookings().length).toBe(roomInstance.getAllBookings().length + 1);
     expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

   it('deve retornar falha quando parâmetros obrigatórios estiverem ausentes', async () => {
      // Arrange
      const testCases = [
        { roomId: null as any, activityType: BookingType.CLEANING, startIn: futureDate, duration },
        { roomId, activityType: null as any, startIn: futureDate, duration },
        { roomId, activityType: BookingType.CLEANING, startIn: null as any, duration },
        { roomId, activityType: BookingType.CLEANING, startIn: futureDate, duration: null as any},
      ];

      for (const testCase of testCases) {
        failures = [];
        
        // Act
        const result = validateAndCollect(
          await roomService.scheduleActivity(
            testCase.roomId, 
            testCase.activityType, 
            testCase.startIn, 
            testCase.duration
          ),
          failures
        );

        // Assert
        expect(result).toBeNull();
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
        expect(repositoryMock.findById).not.toHaveBeenCalled();
      }
    });

    it('deve retornar falha quando a data de início for no passado', async () => {
      // Arrange
      const pastDate = new Date(new Date().getTime() - 60 * 60 * 1000); // 1 hora no passado

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.CLEANING, pastDate, duration),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.DATE_CANNOT_BE_PAST);
      expect(failures[0].details.field).toBe('startIn');
      expect(repositoryMock.findById).not.toHaveBeenCalled();
    });

    it('deve retornar falha quando a sala não for encontrada', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.CLEANING, futureDate, duration),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando o tipo de atividade for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, 'INVALID_TYPE', futureDate, duration),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.BOOKING_WITH_INVALID_ACTIVITY_TYPE);
      expect(failures[0].details.type).toBe('INVALID_TYPE');
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando o tipo de atividade for um tipo não permitido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.SCREENING, futureDate, duration),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.BOOKING_TYPE_IS_INVALID_FOR_REMOVAL);
      expect(failures[0].details.type).toBe(BookingType.SCREENING);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

/*    it('deve retornar falha quando o agendamento não puder ser realizado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);
      const failureResult = failure([{ code: FailureCode.ROOM_SCHEDULE_CONFLICT }]);
      jest.spyOn(roomInstance, 'scheduleCleaning').mockReturnValue(failureResult);

      // Act
      const result = validateAndCollect(
        await roomService.scheduleActivity(roomId, BookingType.CLEANING, futureDate, duration),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.ROOM_SCHEDULE_CONFLICT);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
      expect(roomInstance.scheduleCleaning).toHaveBeenCalledWith(futureDate, duration);
    });*/
  });

  describe('removeScheduledActivity', () => {
    const futureBookingUID = v4();
    const pastBookingUID = v4();
    const inProgressBookingUID = v4();
    const cleaningWithScreeningBookingUID = v4();
    const withScreeningBookingUID = v4()
    const futureDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 1 dia no futuro
    let roomInstanceWithBooking: Room;

    beforeEach(() => {
      const futureBooking = {
        bookingUID: futureBookingUID,
        type: BookingType.CLEANING,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 30 * 60 * 1000),
        screeningUID: null as any,
      };

      const pastDate = new Date(Date.now() - 10 * 10 * 60000)
      const pastBooking = {
        bookingUID: pastBookingUID,
        type: BookingType.CLEANING,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + 30 * 60 * 1000),
        screeningUID: null as any,
      }

      const inProgress = new Date(Date.now() - 10 * 60000)
      const inProgressBooking = {
        bookingUID: inProgressBookingUID,
        type: BookingType.CLEANING,
        startTime: inProgress,
        endTime: new Date(pastDate.getTime() + 10 * 60000),
        screeningUID: null as any,
      }

      const future = new Date(Date.now() + 60 * 60000)
      const withScreening = {
        bookingUID: withScreeningBookingUID,
        type: BookingType.ENTRY_TIME,
        startTime: future,
        endTime: new Date(pastDate.getTime() + 10 * 60000),
        screeningUID: null as any,
      }

      const cleaningDate = new Date(Date.now() + 2 * 60 * 60000)
      const cleaningWithScreening = {
        bookingUID: cleaningWithScreeningBookingUID,
        type: BookingType.CLEANING,
        startTime: cleaningDate,
        endTime: new Date(pastDate.getTime() + 10 * 60000),
        screeningUID: v4(),
      }

      roomInstanceWithBooking = Room.hydrate({
        identifier: roomId,
        schedule: [futureBooking, pastBooking, inProgressBooking, withScreening, cleaningWithScreening],
        layout: { seatRows: layout },
        roomUID: roomUID.value,
        screen,
        status,
      });

      repositoryMock.findById.mockResolvedValue(roomInstanceWithBooking);
    });

    it('deve validar a remoção de uma atividade agendada com sucesso', async () => {
      // Act
      const result = validateAndCollect(
        await roomService.removeScheduledActivity(roomId, futureBookingUID),
        failures
      );

      // Assert
      expect(result).toBe(true);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando parâmetros obrigatórios estiverem ausentes', async () => {
      // Arrange
      const testCases = [
        { roomId: null as any, futureBookingUID },
        { roomId, bookingUID: null as any},
      ];

      for (const testCase of testCases) {
        failures = [];
        
        // Act
        const result = validateAndCollect(
          await roomService.removeScheduledActivity(testCase.roomId, testCase.bookingUID),
          failures
        );

        // Assert
        expect(result).toBeNull();
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
        expect(repositoryMock.findById).not.toHaveBeenCalled();
      }
    });

    it('deve retornar falha quando a sala não for encontrada', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = validateAndCollect(
        await roomService.removeScheduledActivity(roomId, futureBookingUID),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando o agendamento não for encontrado', async () => {
      // Act
      const result = validateAndCollect(
        await roomService.removeScheduledActivity(roomId, 'booking-inexistente'),
        failures
      );

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.BOOKING_NOT_FOUND_IN_FUTURE_SCHEDULE);
      expect(failures[0].details.uuid).toBe('booking-inexistente');
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando o agendamento já tiver iniciado', async () => {
      // Act
      const result = validateAndCollect(await roomService.removeScheduledActivity(roomId, inProgressBookingUID), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.BOOKING_ALREADY_STARTED);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando o tipo de agendamento não for permitido para remoção', async () => {
      // Act
      const result = validateAndCollect(await roomService.removeScheduledActivity(roomId, withScreeningBookingUID), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.BOOKING_TYPE_IS_INVALID_FOR_REMOVAL);
      expect(failures[0].details.type).toBe(BookingType.ENTRY_TIME);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });

    it('deve retornar falha quando a limpeza estiver associada a uma exibição', async () => {
      // Act
      const result = validateAndCollect(await roomService.removeScheduledActivity(roomId, cleaningWithScreeningBookingUID), failures);

      // Assert
      expect(result).toBeNull();
      expect(failures[0].code).toBe(FailureCode.CLEANING_ASSOCIATED_WITH_SCREENING);
      expect(repositoryMock.findById).toHaveBeenCalledWith(roomId);
    });
  });
})
