import { Module } from "@nestjs/common";
import { CustomerController } from "./controller/customer.controller";
import { CustomerService } from "./service/customer.service";
import { CUSTOMER_SERVICE } from "./constant/customer.constants";
import { CustomerRepository } from "./repository/customer.repository";
import { CUSTOMER_REPOSITORY } from "./constant/customer.constants";
import { CustomerMapper } from "./repository/mapper/customer.mapper";

@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [
    {
      provide: CUSTOMER_SERVICE,
      useClass: CustomerService
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: CustomerRepository
    },
    CustomerMapper
  ],
  exports: [CUSTOMER_SERVICE, CUSTOMER_REPOSITORY],
})
export class CustomerModule {}
