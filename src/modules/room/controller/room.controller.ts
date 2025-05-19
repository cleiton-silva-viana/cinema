import { RoomService } from "../service/room.service";
import { JsonApiResponse } from "../../../shared/response/json.api.response";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import { CreateRoomDTO } from "./dto/create.room.dto";
import { ROOM_DOMAIN_SERVICE } from "../constant/room.constant";
import { ISeatRowConfiguration, ICreateScreenInput } from "../entity/room";
import { ResponseRoomDTO } from "./dto/response.room.dto";
import { ScheduleActivityDTO } from "./dto/schedule.activity.dto";

/**
 * Controlador para operações relacionadas a salas de cinema.
 * Implementa endpoints RESTful para gerenciamento de salas.
 */
@Controller("rooms")
export class RoomController {
  constructor(
    @Inject(ROOM_DOMAIN_SERVICE) private readonly service: RoomService,
  ) {}

  @Get(":id")
  public async findById(@Param("id") roomID: number): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const findResult = await this.service.findById(roomID);
    if (findResult.invalid) return response.errors(findResult.failures);

    const room = findResult.value;
    return response
      .HttpStatus(HttpStatus.OK)
      .data(ResponseRoomDTO.fromEntity(room));
  }

  /**
   * Cria uma nova sala.
   * POST /rooms
   */
  @Post()
  public async create(@Body() dto: CreateRoomDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();
    const { roomId, seatConfiguration, screenSize, screenType, status } = dto;

    const seatConfig: ISeatRowConfiguration[] = [];

    seatConfiguration.forEach((seat) => {
      seatConfig.push({
        rowNumber: seat.rowNumber,
        lastColumnLetter: seat.lastColumnLetter,
        preferentialSeatLetters: seat.preferentialSeatLetters,
      });
    });

    const screenConfig: ICreateScreenInput = {
      size: screenSize,
      type: screenType,
    };

    const createRoomResult = await this.service.create(
      roomId,
      seatConfig,
      screenConfig,
      status,
    );

    if (createRoomResult.invalid)
      return response.errors(createRoomResult.failures);

    const room = createRoomResult.value;

    return response
      .HttpStatus(HttpStatus.CREATED)
      .data(ResponseRoomDTO.fromEntity(room))
      .meta({ created: new Date().toISOString() });
  }

  /**
   * Remove uma sala.
   * DELETE /rooms/:id
   */
  @Delete(":id")
  public async delete(@Param("id") roomId: number): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const deleteResult = await this.service.delete(roomId);
    if (deleteResult.invalid) return response.errors(deleteResult.failures);

    return response.HttpStatus(HttpStatus.NO_CONTENT);
  }

  /**
   * Fecha uma sala (altera status para CLOSED).
   * POST /rooms/:id/close
   */
  @Post(":id/close")
  public async closeRoom(
    @Param("id") roomId: number,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const closeResult = await this.service.closeRoom(roomId);
    if (closeResult.invalid) return response.errors(closeResult.failures);

    const room = closeResult.value;

    return response
      .HttpStatus(HttpStatus.OK)
      .data(ResponseRoomDTO.fromEntity(room))
      .meta({ statusChanged: new Date().toISOString() });
  }

  /**
   * Agenda limpeza para uma sala.
   * POST /rooms/:id/schedule-cleaning
   */
  @Post(":id/schedule-cleaning")
  public async scheduleCleaning(
    @Param("id") roomId: number,
    @Body() dto: ScheduleActivityDTO,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const scheduleResult = await this.service.scheduleCleaning(
      roomId,
      dto.startDate,
      dto.duration,
    );
    if (scheduleResult.invalid) return response.errors(scheduleResult.failures);

    const room = scheduleResult.value;

    return response
      .HttpStatus(HttpStatus.CREATED)
      .data(ResponseRoomDTO.fromEntity(room))
      .meta({ cleaningScheduled: new Date().toISOString() });
  }

  /**
   * Agenda manutenção para uma sala.
   * POST /rooms/:id/schedule-maintenance
   */
  @Post(":id/schedule-maintenance/:bookingUID")
  public async scheduleMaintenance(
    @Param("id") roomId: number,
    @Body() dto: ScheduleActivityDTO,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const scheduleResult = await this.service.scheduleMaintenance(
      roomId,
      dto.startDate,
      dto.duration,
    );
    if (scheduleResult.invalid) return response.errors(scheduleResult.failures);

    const room = scheduleResult.value;

    return response
      .HttpStatus(HttpStatus.CREATED)
      .data(ResponseRoomDTO.fromEntity(room))
      .meta({ maintenanceScheduled: new Date().toISOString() });
  }

  /**
   * Remove agendamento de limpeza de uma sala.
   * DELETE /rooms/:id/cleaning
   */
  @Delete(":id/cleaning/:bookingUID")
  public async removeCleaningScheduled(
    @Param("id") roomId: number,
    @Param("bookingUID") bookingUID: string,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const removeResult = await this.service.removeCleaningScheduled(
      roomId,
      bookingUID,
    );
    if (removeResult.invalid) return response.errors(removeResult.failures);

    return response.HttpStatus(HttpStatus.NO_CONTENT);
  }

  /**
   * Remove agendamento de manutenção de uma sala.
   * DELETE /rooms/:id/maintenance
   */
  @Delete(":id/maintenance")
  public async removeMaintenanceScheduled(
    @Param("id") roomId: number,
    @Param("bookingUID") bookingUID: string,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const removeResult = await this.service.removeMaintenanceScheduled(
      roomId,
      bookingUID,
    );
    if (removeResult.invalid) return response.errors(removeResult.failures);

    return response.HttpStatus(HttpStatus.NO_CONTENT);
  }
}
