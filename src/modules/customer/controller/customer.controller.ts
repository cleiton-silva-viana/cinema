import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Inject,
} from "@nestjs/common";
import { ICustomerService } from "../service/customer.service.interface";
import { UpdateCustomerDTO } from "./dto/update.customer.dto";
import { HttpStatus } from "@nestjs/common";
import { JsonApiResponse } from "../../../shared/response/json.api.response";
import { CreateCustomerDTO } from "./dto/create.customer.dto";

@Controller("customers")
export class CustomerController {
  constructor(
    @Inject('CUSTOMER_SERVICE') private readonly service: ICustomerService,
  ) {}

  @Get(":uid")
  public async findOne(@Param("uid") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findById(uid)
    return (result.invalid) 
      ? response.HttpStatus(HttpStatus.NOT_FOUND).errors(result.failures)
      : response.data(this.customerToJsonApi(result.value))
  }

  @Post()
  public async create(@Body() dto: CreateCustomerDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const result = await this.service.create(dto);
    return (result.invalid) 
      ? response.errors(result.failures)
      : response
        .HttpStatus(HttpStatus.CREATED)
        .data(this.customerToJsonApi(result.value));
  }

  @Put(":uid")
  public async update(@Param("uid") uid: string, @Body() dto: UpdateCustomerDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const result = await this.service.update(uid, dto);
    return (result.invalid) 
      ? response.errors(result.failures)
      : response.data(this.customerToJsonApi(result.value));
  }

  @Delete(":uid")
  public async delete(@Param("uid") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.delete(uid)
    return (result.invalid) 
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.NO_CONTENT)
  }

  private customerToJsonApi(customer: any) {
    return {
      id: customer.uid.value,
      type: 'customer',
      attributes: {
        name: customer.name.value,
        email: customer.email.value,
        birthDate: customer.birthDate.value.toISOString()
      }
    }
  }
}
