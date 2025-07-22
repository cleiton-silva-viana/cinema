import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiProduces
} from '@nestjs/swagger'
import { CustomerResponseDTO } from './dto/response.customer.dto'
import { JsonApiResponse } from '@shared/response/json.api.response'
import { ICustomerApplicationService } from '@modules/customer/interface/customer.application.service.interface'
import { ResourceTypesEnum } from '@shared/constant/resource.types'
import { CUSTOMER_APPLICATION_SERVICE } from '@modules/customer/constant/customer.constants'
import { ICreateCustomerCommand, IStudentCardCommand } from '@modules/customer/interface/customer.command.interface'
import { Result } from '@shared/result/result'
import { Customer } from '../entity/customer'

/**
 * Controller responsável pelo gerenciamento completo de clientes do sistema de cinema.
 * 
 * Fornece endpoints para operações CRUD, gerenciamento de dados pessoais,
 * cartões de estudante, CPF e controle de status da conta.
 */
@ApiTags('Customers')
@Controller(ResourceTypesEnum.CUSTOMER)
@ApiConsumes('application/json')
@ApiProduces('application/json')
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true
  }
}))
export class CustomerController {
  constructor(
    @Inject(CUSTOMER_APPLICATION_SERVICE)
    private readonly customerService: ICustomerApplicationService
  ) {}

  @Get(':uid')
  @ApiOperation({ summary: 'Buscar cliente por UID',  description: 'Retorna os dados completos de um cliente específico pelo seu identificador único (UUID).' })
  @ApiParam({ name: 'uid',  description: 'Identificador único do cliente (formato UUID v4)',  type: 'string',  format: 'uuid',  example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200,  description: 'Cliente encontrado com sucesso.',  type: CustomerResponseDTO })
  @ApiResponse({ status: 400,  description: 'UID fornecido possui formato inválido.' })
  @ApiResponse({ status: 404,  description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async findById(
    @Param('uid', ParseUUIDPipe) uid: string
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.findById(uid)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Get('/email/:email')
  @ApiOperation({ summary: 'Buscar cliente por e-mail', description: 'Retorna os dados completos de um cliente específico pelo seu endereço de e-mail.' })
  @ApiParam({ name: 'email', description: 'Endereço de e-mail do cliente', type: 'string', format: 'email', example: 'cliente@exemplo.com' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'E-mail fornecido possui formato inválido.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async findByEmail(
    @Param('email') email: string
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.findByEmail(email)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente', description: 'Cria um novo cliente no sistema com os dados fornecidos. O e-mail deve ser único.' })
  @ApiBody({ 
    type: Object, 
    description: 'Dados completos para criação do cliente',
    examples: {
      exemplo: {
        summary: 'Exemplo de criação de cliente',
        value: {
          name: 'João Silva',
          email: 'joao.silva@exemplo.com',
          birthDate: '1990-05-15',
          cpf: '12345678901'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos (formato de e-mail, CPF, etc.).' })
  @ApiResponse({ status: 409, description: 'E-mail ou CPF já está em uso por outro cliente.' })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createCustomerDto: ICreateCustomerCommand
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.create(createCustomerDto)
    
    return this.buildResponse(result, HttpStatus.CREATED, { 
      createdAt: new Date(),
      operation: 'customer_created'
    })
  }

  @Patch(':uid/email')
  @ApiOperation({ summary: 'Atualizar e-mail do cliente', description: 'Atualiza o endereço de e-mail de um cliente específico. O novo e-mail deve ser único no sistema.'})
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente (formato UUID v4)', type: 'string', format: 'uuid' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        email: { 
          type: 'string', 
          format: 'email',
          example: 'novo.email@exemplo.com',
          description: 'Novo endereço de e-mail do cliente'
        } 
      },
      required: ['email']
    } 
  })
  @ApiResponse({ status: 200, description: 'E-mail atualizado com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'UID inválido ou e-mail com formato incorreto.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @ApiResponse({ status: 409, description: 'E-mail já está em uso por outro cliente.' })
  @HttpCode(HttpStatus.OK)
  public async updateCustomerEmail(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() updateEmailDto: Pick<ICreateCustomerCommand, 'email'>
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.updateCustomerEmail(uid, updateEmailDto.email as string)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  /**
   * Atualiza o nome de um cliente.
   * 
   * @param uid - Identificador único do cliente (UUID v4)
   * @param updateNameDto - Novo nome do cliente
   * @returns Dados atualizados do cliente
   * @throws {BadRequestException} Quando o UID é inválido ou nome está vazio
   * @throws {NotFoundException} Quando o cliente não é encontrado
   */
  @Patch(':uid/name')
  @ApiOperation({summary: 'Atualizar nome do cliente', description: 'Atualiza o nome completo de um cliente específico.'})
  @ApiParam({name: 'uid', description: 'Identificador único do cliente (formato UUID v4)', type: 'string', format: 'uuid'})
  @ApiBody({ schema: {
      type: 'object', 
      properties: { 
        name: { 
          type: 'string', 
          minLength: 1,
          maxLength: 255,
          example: 'João Silva Santos',
          description: 'Nome completo do cliente'
        } 
      },
      required: ['name']
    } })
  @ApiResponse({ status: 200, description: 'Nome atualizado com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'UID inválido ou nome vazio/muito longo.'})
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async updateCustomerName(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() updateNameDto: Pick<ICreateCustomerCommand, 'name'>
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.updateCustomerName(uid, updateNameDto.name as string)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Patch(':uid/birthdate')
  @ApiOperation({ summary: 'Atualizar data de nascimento', description: 'Atualiza a data de nascimento de um cliente específico.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiBody({ schema: { type: 'object', properties: { birthDate: { type: 'string', format: 'date' } } } })
  @ApiResponse({ status: 200, description: 'Data de nascimento atualizada com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Data inválida ou operação não permitida.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async updateCustomerBirthDate(
    @Param('uid') uid: string,
    @Body() updateBirthDateDto: Pick<ICreateCustomerCommand, 'birthDate'>
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.updateCustomerBirthDate(uid, updateBirthDateDto.birthDate as Date)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Patch(':uid/cpf')
  @ApiOperation({ summary: 'Atribuir CPF ao cliente', description: 'Atribui um número de CPF válido a um cliente específico. O CPF deve ser único no sistema.'})
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string', format: 'uuid' })
  @ApiBody({ schema: {
      type: 'object', 
      properties: { 
        cpf: { 
          type: 'string', 
          pattern: '^\\d{11}$',
          example: '12345678901',
          description: 'Número do CPF (11 dígitos, apenas números)'
        } 
      },
      required: ['cpf']
    } })
  @ApiResponse({ status: 200,  description: 'CPF atribuído com sucesso.',  type: CustomerResponseDTO })
  @ApiResponse({ status: 400,  description: 'UID inválido ou CPF com formato incorreto.' })
  @ApiResponse({ status: 404,  description: 'Cliente não encontrado.' })
  @ApiResponse({ status: 409,  description: 'CPF já está em uso por outro cliente.' })
  @HttpCode(HttpStatus.OK)
  public async assignCustomerCPF(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() assignCpfDto: Pick<ICreateCustomerCommand, 'cpf'>
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.assignCustomerCPF(uid, assignCpfDto.cpf as string)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Delete(':uid/cpf')
  @ApiOperation({ summary: 'Remover CPF do cliente', description: 'Remove o CPF de um cliente específico.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiResponse({ status: 200, description: 'CPF removido com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Operação não permitida.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async removeCustomerCPF(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const result = await this.customerService.removeCustomerCPF(uid)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Patch(':uid/student-card')
  @ApiOperation({ summary: 'Atribuir cartão estudantil', description: 'Atribui um cartão estudantil a um cliente específico.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiBody({ type: Object, description: 'Dados do cartão estudantil' })
  @ApiResponse({ status: 200, description: 'Cartão estudantil atribuído com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Dados do cartão inválidos ou operação não permitida.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @ApiResponse({ status: 409, description: 'Cartão estudantil já está em uso.' })
  @HttpCode(HttpStatus.OK)
  public async assignCustomerStudentCard(
    @Param('uid') uid: string,
    @Body() studentCardDto: IStudentCardCommand
  ): Promise<JsonApiResponse> {
    const result = await this.customerService.assignCustomerStudentCard(uid, studentCardDto)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Delete(':uid/student-card')
  @ApiOperation({ summary: 'Remover cartão estudantil', description: 'Remove o cartão estudantil de um cliente específico.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiResponse({ status: 200, description: 'Cartão estudantil removido com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Operação não permitida.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async removeCustomerStudentCard(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const result = await this.customerService.removeCustomerStudentCard(uid)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Patch(':uid/request-deletion')
  @ApiOperation({ summary: 'Solicitar exclusão da conta', description: 'Solicita a exclusão da conta de um cliente específico.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiResponse({ status: 200, description: 'Solicitação de exclusão processada com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Operação não permitida para o status atual do cliente.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async requestAccountDeletion(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const result = await this.customerService.requestAccountDeletion(uid)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  @Patch(':uid/reactivate')
  @ApiOperation({ summary: 'Reativar conta', description: 'Reativa a conta de um cliente que está pendente de exclusão.' })
  @ApiParam({ name: 'uid', description: 'Identificador único do cliente', type: 'string' })
  @ApiResponse({ status: 200, description: 'Conta reativada com sucesso.', type: CustomerResponseDTO })
  @ApiResponse({ status: 400, description: 'Operação não permitida para o status atual do cliente.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @HttpCode(HttpStatus.OK)
  public async reactivateAccount(@Param('uid') uid: string): Promise<JsonApiResponse> {
    const result = await this.customerService.reactivateAccount(uid)
    
    return this.buildResponse(result, HttpStatus.OK)
  }

  /**
   * Método auxiliar para construir respostas padronizadas da API.
   * 
   * Centraliza o tratamento de sucesso e erro, garantindo consistência
   * nas respostas e facilitando manutenção futura.
   * 
   * @private
   * @param result - Resultado da operação do serviço
   * @param successStatus - Status HTTP para caso de sucesso
   * @param meta - Metadados opcionais para incluir na resposta
   * @returns Resposta formatada da API
   */
  private buildResponse(
    result: Result<Customer>,
    successStatus: HttpStatus,
    meta?: Record<string, any>
  ): JsonApiResponse {
    const response = new JsonApiResponse()

    if (result.isInvalid())
      return response.errors(result.failures)

    const responseBuilder = response
      .HttpStatus(successStatus)
      .data(CustomerResponseDTO.fromEntity(result.value))

    if (meta)
      return responseBuilder.meta({
        ...meta,
        timestamp: new Date().toISOString(),
      })

    return responseBuilder
  }
}
