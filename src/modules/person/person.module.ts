import { Module } from "@nestjs/common";
import { PersonController } from "./controller/person.controller";
import { PersonService } from "./service/person.service";

@Module({
  imports: [],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}
