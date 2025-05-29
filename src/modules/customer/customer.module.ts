import { Module } from '@nestjs/common'
import { CustomerController } from './controller/customer.controller'
import { CustomerApplicationService } from '@modules/customer/service/customer.application.service'
import { CUSTOMER_APPLICATION_SERVICE } from './constant/customer.constants'

@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [
    {
      provide: CUSTOMER_APPLICATION_SERVICE,
      useClass: CustomerApplicationService,
    },
  ],
  exports: [
    {
      provide: CUSTOMER_APPLICATION_SERVICE,
      useClass: CustomerApplicationService,
    },
  ],
})
export class CustomerModule {}
