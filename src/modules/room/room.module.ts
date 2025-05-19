import { Module } from "@nestjs/common";
import { RoomController } from "./controller/room.controller";
import { RoomService } from "./service/room.service";
import { ROOM_REPOSITORY } from "./constant/room.constant";
import { RoomRepository } from "./repository/room.repository";

@Module({
  controllers: [RoomController],
  providers: [
    RoomService,
    {
      provide: ROOM_REPOSITORY,
      useClass: RoomRepository,
    },
  ],
  exports: [RoomService],
})
export class RoomModule {}
