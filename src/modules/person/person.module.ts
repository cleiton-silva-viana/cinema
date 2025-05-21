import { Module } from "@nestjs/common";
import { PersonController } from "./controller/person.controller";
import { PersonDomainService } from "./service/person.domain.service";

@Module({
  imports: [],
  controllers: [PersonController],
  providers: [PersonDomainService],
  exports: [PersonDomainService],
})
export class PersonModule {}
