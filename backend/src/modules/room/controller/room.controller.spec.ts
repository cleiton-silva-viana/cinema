import { Test, TestingModule } from "@nestjs/testing";
import { RoomController } from "./room.controller";
import { RoomService } from "../service/room.service";
import {
  ROOM_DOMAIN_SERVICE,
  ROOM_REPOSITORY,
} from "../constant/room.constant";
import { JsonApiResponse } from "../../../shared/response/json.api.response";
import { HttpStatus } from "@nestjs/common";
import { Room, RoomAdministrativeStatus } from "../entity/room";
import { ResourceTypes } from "../../../shared/constant/resource.types";
import { RoomUID } from "../entity/value-object/room.uid";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { IRoomRepository } from "../repository/room.repository.interface";
import { CreateRoomDTO, SeatRowConfigurationDTO } from "./dto/create.room.dto";
import { ScheduleActivityDTO } from "./dto/schedule.activity.dto";
import { BookingType } from "../entity/value-object/booking.slot";
import { v4 } from "uuid";
import { IRoomBookingData } from "../entity/value-object/room.schedule";

describe("RoomController", () => {
  let controller: RoomController;
  let service: RoomService;
  let repositoryMock: jest.Mocked<IRoomRepository>;
  let roomInstance: Room;

  const ROOM_UID = RoomUID.create().value;
  const ROOM_NUMBER = 1;
  const ROOM_STATUS = RoomAdministrativeStatus.AVAILABLE;
  const ROOM_SCREEN_TYPE = "2D";
  const ROOM_SCREEN_SIZE = 15;
  const ROOM_LAYOUT = {
    seatRows: [
      {
        rowNumber: 1,
        preferentialSeatLetters: ["A", "B"],
        lastColumnLetter: "F",
      },
      {
        rowNumber: 2,
        preferentialSeatLetters: ["A", "B"],
        lastColumnLetter: "F",
      },
      {
        rowNumber: 3,
        preferentialSeatLetters: ["A", "B"],
        lastColumnLetter: "F",
      },
    ],
  };

  function addSeat(
    rowNumber: number,
    seatConfig: SeatRowConfigurationDTO[],
    preferential: string[],
  ) {
    seatConfig.push({
      rowNumber: rowNumber,
      lastColumnLetter: "E",
      preferentialSeatLetters: preferential,
    });
  }

  function createDate(day: number, hours: number, minutes: number) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    date.setHours(hours);
    date.setMinutes(minutes, 0, 0);
    return date;
  }

  function createRoomInstance(
    status?: RoomAdministrativeStatus,
    schedule?: IRoomBookingData[],
  ): Room {
    return Room.hydrate({
      roomUID: ROOM_UID,
      identifier: ROOM_NUMBER,
      status: status ?? ROOM_STATUS,
      screen: {
        type: ROOM_SCREEN_TYPE,
        size: ROOM_SCREEN_SIZE,
      },
      schedule: schedule ?? [],
      layout: ROOM_LAYOUT,
    });
  }

  beforeEach(async () => {
    repositoryMock = {
      findById: jest.fn(),
      roomExists: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      addBooking: jest.fn(),
      deleteBooking: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<IRoomRepository>;

    roomInstance = Room.hydrate({
      roomUID: ROOM_UID,
      identifier: ROOM_NUMBER,
      status: ROOM_STATUS,
      screen: {
        type: ROOM_SCREEN_TYPE,
        size: ROOM_SCREEN_SIZE,
      },
      schedule: [],
      layout: ROOM_LAYOUT,
    });

    // Configurar o módulo de teste com o serviço real e o repositório mockado
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        RoomService,
        {
          provide: ROOM_DOMAIN_SERVICE,
          useClass: RoomService,
        },
        {
          provide: ROOM_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    service = module.get<RoomService>(RoomService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve retornar uma sala quando encontrada", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await controller.findById(1);

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(repositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result.status).toBe(HttpStatus.OK);
      const responseData = result.getAllDatas().data;
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      expect(data.id).toEqual(ROOM_UID);
      expect(data.type).toBe(ResourceTypes.ROOM);
      expect(data.attributes.number).toBe(ROOM_NUMBER);
      expect(data.attributes.status).toBe(ROOM_STATUS);
    });

    it("deve retornar erros quando a sala não for encontrada", async () => {
      // Arrange
      const id = 999;
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await controller.findById(id);

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(repositoryMock.findById).toHaveBeenCalledWith(id);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.RESOURCE_NOT_FOUND,
      );
    });

    it("deve retornar erro quando input for um valor unlo ou undefined", async () => {
      // Act
      const result = await controller.findById(null);

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.MISSING_REQUIRED_DATA,
      );
    });
  });

  describe("create", () => {
    let dto: CreateRoomDTO;

    beforeEach(() => {
      const seatConfig: SeatRowConfigurationDTO[] = [];
      addSeat(1, seatConfig, ["A"]);
      addSeat(2, seatConfig, ["A"]);
      addSeat(3, seatConfig, ["A"]);
      addSeat(4, seatConfig, ["A"]);

      dto = new CreateRoomDTO();
      dto.roomId = ROOM_NUMBER;
      dto.screenSize = ROOM_SCREEN_SIZE;
      dto.screenType = ROOM_SCREEN_TYPE;
      dto.status = ROOM_STATUS;
      dto.seatConfiguration = seatConfig;
    });

    it("deve criar uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.create.mockResolvedValue(roomInstance);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(result.status).toBe(HttpStatus.CREATED);
      const responseData = result.getAllDatas().data;
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      expect(data.id).toBe(ROOM_UID);
      expect(data.type).toBe(ResourceTypes.ROOM);
      expect(data.attributes.number).toBe(dto.roomId);
      expect(data.attributes.status).toBe(dto.status);
      expect(data.attributes.screen.size).toBe(dto.screenSize);
      expect(data.attributes.screen.type).toBe(dto.screenType);
    });

    it("deve retornar erros quando a criação falhar", async () => {
      // Arrange
      const input = { ...dto };
      input.roomId = -1;

      // Act
      const result = await controller.create(input);

      // Assert
      expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("deve excluir uma sala com sucesso", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await controller.delete(1);

      // Assert
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("deve retornar erros quando a exclusão falhar", async () => {
      // Arrange
      repositoryMock.delete.mockResolvedValue(null);

      // Act
      const result = await controller.delete(-1);

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe("closeRoom", () => {
    it("deve fechar uma sala com sucesso", async () => {
      // Arrange
      const updatedInstance = Room.hydrate({
        roomUID: ROOM_UID,
        identifier: ROOM_NUMBER,
        status: RoomAdministrativeStatus.CLOSED,
        layout: ROOM_LAYOUT,
        screen: {
          type: ROOM_SCREEN_TYPE,
          size: ROOM_SCREEN_SIZE,
        },
        schedule: [],
      });

      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.update.mockResolvedValue(updatedInstance);

      // Act
      const result = await controller.closeRoom(1);

      // Assert
      expect(result.status).toBe(HttpStatus.OK);
      const datasResponse = result.getAllDatas().data;
      const data = Array.isArray(datasResponse)
        ? datasResponse[0]
        : datasResponse;
      expect(data.id).toBe(ROOM_UID);
      expect(data.type).toBe(ResourceTypes.ROOM);
      expect(data.attributes.number).toBe(roomInstance.identifier.value);
      expect(data.attributes.status).toBe(RoomAdministrativeStatus.CLOSED);
      expect(data.attributes.screen.size).toBe(roomInstance.screenSize);
      expect(data.attributes.screen.type).toBe(roomInstance.screenType);
    });

    it("deve retornar erros quando o fechamento falhar", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await controller.closeRoom(1);

      // Assert
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe("scheduleCleaning", () => {
    let dto: ScheduleActivityDTO;

    beforeEach(() => {
      dto = new ScheduleActivityDTO();
      dto.startDate = createDate(3, 12, 10);
      dto.duration = 30;
    });

    it("deve agendar limpeza com sucesso", async () => {
      // Arrange
      const updatedRoom = Room.hydrate({
        roomUID: ROOM_UID,
        identifier: ROOM_NUMBER,
        status: ROOM_STATUS,
        screen: {
          type: ROOM_SCREEN_TYPE,
          size: ROOM_SCREEN_SIZE,
        },
        schedule: [
          {
            bookingUID: v4(),
            type: BookingType.SCREENING,
            startTime: dto.startDate,
            endTime: new Date(dto.startDate.getTime() + dto.duration * 60000),
            screeningUID: null,
          },
        ],
        layout: ROOM_LAYOUT,
      });

      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.addBooking.mockResolvedValue(updatedRoom);

      // Act
      const result = await controller.scheduleCleaning(ROOM_NUMBER, dto);

      // Assert
      expect(result.status).toBe(HttpStatus.CREATED);
      const responseData = result.getAllDatas().data;
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      expect(data.id).toBe(ROOM_UID);
      expect(data.type).toBe(ResourceTypes.ROOM);
      const meta = result.getAllDatas().meta;
      expect(meta).toHaveProperty("cleaningScheduled");
    });

    it("deve retornar erros quando o agendamento de limpeza falhar", async () => {
      // Arrange
      dto.duration = -30; // Duração inválida

      repositoryMock.findById.mockResolvedValue(roomInstance);

      // Act
      const result = await controller.scheduleCleaning(ROOM_NUMBER, dto);

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.DATE_WITH_INVALID_SEQUENCE,
      );
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("scheduleMaintenance", () => {
    let dto = new ScheduleActivityDTO();

    beforeEach(() => {
      dto.startDate = createDate(3, 12, 5);
      dto.duration = 120;
    });

    it("deve agendar manutenção com sucesso", async () => {
      // Arrange
      const updatedRoom = Room.hydrate({
        roomUID: ROOM_UID,
        identifier: ROOM_NUMBER,
        status: ROOM_STATUS,
        screen: {
          type: ROOM_SCREEN_TYPE,
          size: ROOM_SCREEN_SIZE,
        },
        schedule: [
          {
            bookingUID: "booking-456",
            type: BookingType.MAINTENANCE,
            startTime: dto.startDate,
            endTime: new Date(dto.startDate.getTime() + dto.duration * 60000),
            screeningUID: null,
          },
        ],
        layout: ROOM_LAYOUT,
      });

      repositoryMock.findById.mockResolvedValue(roomInstance);
      repositoryMock.addBooking.mockResolvedValue(updatedRoom);

      // Act
      const result = await controller.scheduleMaintenance(ROOM_NUMBER, dto);

      // Assert
      expect(result.status).toBe(HttpStatus.CREATED);
      const responseData = result.getAllDatas().data;
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      expect(data.id).toBe(ROOM_UID);
      expect(data.type).toBe(ResourceTypes.ROOM);
      const meta = result.getAllDatas().meta;
      expect(meta).toHaveProperty("maintenanceScheduled");
    });

    it("deve retornar erros quando o agendamento de manutenção falhar", async () => {
      // Arrange
      const dto = new ScheduleActivityDTO();
      dto.startDate = null; // Data inválida
      dto.duration = 120;

      // Act
      const result = await controller.scheduleMaintenance(ROOM_NUMBER, dto);

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.MISSING_REQUIRED_DATA,
      );
    });
  });

  describe("removeCleaningScheduled", () => {
    const BOOKING_UID = "cleaning-booking-123";

    it("deve remover agendamento de limpeza com sucesso", async () => {
      // Arrange
      const instance = createRoomInstance(RoomAdministrativeStatus.AVAILABLE, [
        {
          bookingUID: BOOKING_UID,
          type: BookingType.CLEANING,
          startTime: createDate(10, 13, 10),
          endTime: createDate(10, 13, 45),
          screeningUID: null,
        },
      ]);

      repositoryMock.findById.mockResolvedValue(instance);
      repositoryMock.deleteBooking.mockResolvedValue(null);

      // Act
      const result = await controller.removeCleaningScheduled(
        ROOM_NUMBER,
        BOOKING_UID,
      );

      // Assert
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("deve retornar erros quando a remoção de limpeza falhar", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await controller.removeCleaningScheduled(
        ROOM_NUMBER,
        "booking-inexistente",
      );

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.RESOURCE_NOT_FOUND,
      );
    });
  });

  describe("removeMaintenanceScheduled", () => {
    const BOOKING_UID = "maintenance-booking-456";

    it("deve remover agendamento de manutenção com sucesso", async () => {
      // Arrange
      const instance = createRoomInstance(RoomAdministrativeStatus.AVAILABLE, [
        {
          screeningUID: null,
          bookingUID: BOOKING_UID,
          type: BookingType.MAINTENANCE,
          startTime: createDate(5, 15, 0),
          endTime: createDate(5, 15, 30),
        },
      ]);

      repositoryMock.findById.mockResolvedValue(instance);
      repositoryMock.deleteBooking.mockResolvedValue(null);

      // Act
      const result = await controller.removeMaintenanceScheduled(
        ROOM_NUMBER,
        BOOKING_UID,
      );

      // Assert
      expect(result.status).toBe(HttpStatus.NO_CONTENT);
    });

    it("deve retornar erros quando a remoção de manutenção falhar", async () => {
      // Act
      const result = await controller.removeMaintenanceScheduled(
        ROOM_NUMBER,
        "booking-inexistente",
      );

      // Assert
      expect(result).toBeInstanceOf(JsonApiResponse);
      expect(result.getAllDatas().errors[0].code).toBe(
        FailureCode.RESOURCE_NOT_FOUND,
      );
    });
  });
});
