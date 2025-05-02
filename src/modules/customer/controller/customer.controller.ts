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
import { CUSTOMER_SERVICE } from "../constant/customer.constants";
import { ResponseCustomerDTO } from "./dto/response.customer.dto";
import { isNull } from "../../../shared/validator/validator";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

@Controller("customers")
export class CustomerController {
  constructor(
    @Inject(CUSTOMER_SERVICE) private readonly service: ICustomerService,
  ) {}

  @Get(":uid")
  public async findById(@Param("id") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const result = await this.service.findById(uid);

    return result.invalid
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.OK)
          .data(ResponseCustomerDTO.fromEntity(result.value));
  }

  @Post()
  public async create(
    @Body() dto: CreateCustomerDTO,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    if (!dto || !dto.name || !dto.email || !dto.birthDate)
      return response.errors({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });

    const result = await this.service.create(dto);

    return result.invalid
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.CREATED)
          .data(ResponseCustomerDTO.fromEntity(result.value))
          .meta({ createdAt: new Date() });
  }

  @Put(":id")
  public async update(
    @Param("id") uid: string,
    @Body() dto: UpdateCustomerDTO,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    if (!dto || !dto.name || !dto.email || !dto.birthDate)
      return response.errors({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });

    const result = await this.service.update(uid, dto);

    return result.invalid
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.OK)
          .data(ResponseCustomerDTO.fromEntity(result.value))
          .meta({ updatedAt: new Date() });
  }

  @Delete(":id")
  public async delete(@Param("id") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    const result = await this.service.delete(uid);

    return result.invalid
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.NO_CONTENT);
  }
}
