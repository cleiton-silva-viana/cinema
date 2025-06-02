import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post, Put } from '@nestjs/common'
import { CustomerResponseDTO } from './dto/response.customer.dto'
import { ICreateCustomerDTO } from './dto/create.customer.dto'
import { JsonApiResponse } from '@shared/response/json.api.response'
import { ICustomerApplicationService } from '@modules/customer/service/customer.application.service.interface'
import { ResourceTypesEnum } from '@shared/constant/resource.types'
import { IAssignCustomerStudentCardDTO } from './dto/assign.customer.studentcard.dto'
import { IUpdateCustomerFieldsDTO } from '@modules/customer/controller/dto/update.customer.fields.dto'
import { CUSTOMER_APPLICATION_SERVICE } from '@modules/customer/constant/customer.constants'

@Controller(ResourceTypesEnum.CUSTOMER)
export class CustomerController {
  constructor(@Inject(CUSTOMER_APPLICATION_SERVICE) private readonly service: ICustomerApplicationService) {}

  @Get(':uid')
  public async findById(@Param('id') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findById(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Get('/email/:email')
  public async findByEmail(@Param('email') email: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findByEmail(email)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Post()
  public async create(@Body() dto: ICreateCustomerDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.create(dto)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.CREATED)
          .data(CustomerResponseDTO.fromEntity(result.value))
          .meta({ createdAt: new Date() })
  }

  @Patch(':uid/email')
  public async updateCustomerEmail(@Param('uid') uid: string, @Body() dto: Pick<IUpdateCustomerFieldsDTO, 'email'>) {
    const response = new JsonApiResponse()

    const result = await this.service.updateCustomerEmail(uid, dto?.email as unknown as string)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Patch(':uid/name')
  public async updateCustomerName(
    @Param('uid') uid: string,
    @Body() dto: Pick<IUpdateCustomerFieldsDTO, 'name'>
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.updateCustomerName(uid, dto.name as unknown as string)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Patch(':uid/birthdate')
  public async updateCustomerBirthDate(
    @Param('uid') uid: string,
    @Body() dto: Pick<IUpdateCustomerFieldsDTO, 'birthDate'>
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.updateCustomerBirthDate(uid, dto?.birthDate as unknown as Date)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Patch(':uid/cpf')
  public async assignCustomerCPF(
    @Param('uid') uid: string,
    @Body() dto: Pick<IUpdateCustomerFieldsDTO, 'cpf'>
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.assignCustomerCPF(uid, dto?.cpf as unknown as string)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Delete(':uid/cpf')
  public async removeCustomerCPF(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.removeCustomerCPF(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Patch(':uid/student-card')
  public async assignCustomerStudentCard(
    @Param('uid') uid: string,
    @Body() dto: IAssignCustomerStudentCardDTO
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.assignCustomerStudentCard(uid, dto)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }

  @Delete(':uid/student-card')
  public async removeCustomerStudentCard(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.removeCustomerStudentCard(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.OK).data(CustomerResponseDTO.fromEntity(result.value))
  }
}
