import { Body, Controller, Delete, Get, HttpStatus, Inject, Param, Patch, Post } from '@nestjs/common'
import { PersonResponseDTO } from './dto/response.person.dto'
import { JsonApiResponse } from '@shared/response/json.api.response'
import { IPersonApplicationService } from '@modules/person/service/person.application.service.interface'
import { ensureNotNull } from '@shared/validator/common.validators'
import { ResourceTypes } from '@shared/constant/resource.types'
import { PERSON_APPLICATION_SERVICE } from '@modules/person/constant/person.constant'
import {CreatePersonDTO, UpdatePersonDTO} from "@modules/person/controller/dto/person.dto";

/**
 * Controlador para operações relacionadas a pessoas no sistema.
 * Implementa endpoints RESTful para gerenciamento de pessoas.
 */
@Controller(ResourceTypes.PERSON)
export class PersonController {
  constructor(@Inject(PERSON_APPLICATION_SERVICE) private readonly service: IPersonApplicationService) {}

  /**
   * Busca uma pessoa pelo UID.
   * GET /persons/:uid
   */
  @Get(':uid')
  public async findById(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const result = await this.service.findById(uid)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(PersonResponseDTO.fromEntity(result.value))
  }

  /**
   * Cria uma nova pessoa no sistema.
   * POST /persons
   */
  @Post()
  public async create(@Body() dto: CreatePersonDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.create(dto.name, new Date(dto.birthDate))
    return result.isInvalid()
      ? response.errors(result.failures)
      : response
          .HttpStatus(HttpStatus.CREATED)
          .data(PersonResponseDTO.fromEntity(result.value))
          .meta({ createdAt: new Date().toISOString() })
  }

  /**
   * Atualiza uma pessoa existente.
   * PATCH /persons/:uid
   */
  @Patch(':uid')
  public async update(@Param('uid') uid: string, @Body() dto: Partial<UpdatePersonDTO>): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()

    const failures = ensureNotNull({ uid, dto })
    if (failures.length > 0) return response.errors(failures)

    const result = await this.service.update(uid, dto?.name, dto?.birthDate)

    return result.isInvalid()
      ? response.errors(result.failures)
      : response.data(PersonResponseDTO.fromEntity(result.value)).meta({ updatedAt: new Date().toISOString() })
  }

  /**
   * Remove uma pessoa.
   * DELETE /persons/:uid
   */
  @Delete(':uid')
  public async delete(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse()
    const result = await this.service.delete(uid)

    return result.isInvalid() ? response.errors(result.failures) : response.HttpStatus(HttpStatus.NO_CONTENT)
  }
}
