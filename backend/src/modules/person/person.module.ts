import { Module } from '@nestjs/common'
import { PersonController } from './controller/person.controller'
import { PersonApplicationService } from './service/person.application.service'
import { PERSON_APPLICATION_SERVICE } from './constant/person.constant'

@Module({
  imports: [],
  controllers: [PersonController],
  providers: [
    {
      provide: PERSON_APPLICATION_SERVICE,
      useClass: PersonApplicationService,
    },
  ],
  exports: [
    {
      provide: PERSON_APPLICATION_SERVICE,
      useClass: PersonApplicationService,
    },
  ],
})
export class PersonModule {}
