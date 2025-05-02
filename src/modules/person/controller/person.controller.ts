import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { PersonService } from "../service/person.service";
import { JsonApiResponse } from "../../../shared/response/json.api.response";
import { CreatePersonDTO } from "./dto/create.person.dto";
import { UpdatePersonDTO } from "./dto/update.person.dto";
import { isNull } from "../../../shared/validator/validator";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { PersonResponseDTO } from "./dto/response.person.dto";

/**
 * Controlador para operações relacionadas a pessoas no sistema.
 * Implementa endpoints RESTful para gerenciamento de pessoas.
 */
@Controller("persons")
export class PersonController {
  constructor(private readonly service: PersonService) {}

  /**
   * Cria uma nova pessoa no sistema.
   * POST /persons
   */
  @Post()
  public async create(@Body() dto: CreatePersonDTO): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    if (!this.hasData(dto)) {
      return response.HttpStatus(HttpStatus.BAD_REQUEST).errors({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });
    }

    const result = await this.service.create(dto.name, new Date(dto.birthDate));
    if (result.invalid) return response.errors(result.failures);

    return response
      .data(PersonResponseDTO.fromEntity(result.value))
      .meta({ createdAt: new Date().toISOString() });
  }

  /**
   * Busca uma pessoa pelo ID.
   * GET /persons/:id
   */
  @Get(":id")
  public async findById(@Param("id") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();
    const result = await this.service.findById(uid);

    if (result.invalid) return response.errors(result.failures);

    return response.data(PersonResponseDTO.fromEntity(result.value));
  }

  /**
   * Atualiza uma pessoa existente.
   * PATCH /persons/:id
   */
  @Patch(":id")
  public async update(
    @Param("id") uid: string,
    @Body() dto: UpdatePersonDTO,
  ): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();

    if (!this.hasData(dto)) {
      return response.errors({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });
    }

    const birthDateObj = dto.birthDate ? new Date(dto.birthDate) : null;
    const result = await this.service.update(uid, dto.name, birthDateObj);

    if (result.invalid) return response.errors(result.failures);

    return response
      .data(PersonResponseDTO.fromEntity(result.value))
      .meta({ updatedAt: new Date().toISOString() });
  }

  /**
   * Remove uma pessoa.
   * DELETE /persons/:id
   */
  @Delete(":id")
  public async delete(@Param("id") uid: string): Promise<JsonApiResponse> {
    const response = new JsonApiResponse();
    const result = await this.service.delete(uid);

    return result.invalid
      ? response.errors(result.failures)
      : response.HttpStatus(HttpStatus.NO_CONTENT);
  }

  /**
   * Verifica se o DTO de atualização contém dados.
   * @param dto DTO de atualização
   * @returns true se contém dados, false caso contrário
   */
  private hasData(dto: UpdatePersonDTO): boolean {
    if (isNull(dto)) return false;
    return !!(dto.name || dto.birthDate);
  }
}
