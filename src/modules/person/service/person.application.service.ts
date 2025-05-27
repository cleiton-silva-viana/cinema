import { Person } from '../entity/person'
import { IPersonRepository } from '../repository/person.repository.interface'
import { PersonUID } from '../entity/value-object/person.uid'
import { Inject, Injectable } from '@nestjs/common'
import { PERSON_REPOSITORY } from '../constant/person.constant'
import { failure, Result, success } from '@shared/result/result'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { ResourceTypes } from '@shared/constant/resource.types'
import { ensureNotNull, validateAndCollect } from '@shared/validator/common.validators'
import { IPersonApplicationService } from '@modules/person/service/person.application.service.interface'
import { name } from 'ts-jest/dist/transformers/hoist-jest'

/**
 * Serviço de Domínio responsável por operações relacionadas a pessoas no sistema.
 *
 * Este serviço implementa a lógica de negócio e validações relacionadas a pessoas,
 * mas NÃO realiza operações de escrita no repositório. Ele é utilizado pelo
 * serviço de aplicação, que orquestra as operações e realiza a persistência dos dados.
 *
 * O serviço de domínio foca em validar operações e retornar instâncias válidas
 * de entidades para que o serviço de aplicação possa persistir essas mudanças.
 */
@Injectable()
export class PersonApplicationService implements IPersonApplicationService {
  constructor(@Inject(PERSON_REPOSITORY) private readonly repository: IPersonRepository) {}

  /**
   * Busca uma pessoa pelo seu identificador único.
   *
   * Esta operação realiza apenas leitura no repositório.
   *
   * @param uid Identificador único da pessoa
   * @returns Result contendo a pessoa encontrada ou erro
   */
  public async findById(uid: string): Promise<Result<Person>> {
    const personUidResult = PersonUID.parse(uid)
    if (personUidResult.isInvalid()) return personUidResult

    const person = await this.repository.findById(personUidResult.value)
    return !person
      ? failure({
          code: FailureCode.RESOURCE_NOT_FOUND,
          details: { resource: ResourceTypes.PERSON },
        })
      : success(person)
  }

  /**
   * Valida e cria uma nova instância de pessoa.
   *
   * Este método apenas valida os dados e retorna uma instância de Person.
   * Ele NÃO persiste a pessoa no repositório - esta responsabilidade
   * pertence ao serviço de aplicação.
   *
   * @param name Nome completo da pessoa
   * @param birthDate Data de nascimento da pessoa
   * @returns Result contendo a instância de pessoa criada ou erros de validação
   */
  public async create(name: string, birthDate: Date): Promise<Result<Person>> {
    return Person.create(name, birthDate)
  }

  /**
   * Valida a atualização dos dados de uma pessoa existente.
   *
   * Este método valida os dados de atualização e retorna uma nova instância
   * de Person com os dados atualizados. Ele NÃO persiste as alterações no
   * repositório - esta responsabilidade pertence ao serviço de aplicação.
   *
   * @param uid Identificador único da pessoa
   * @param name Novo nome (opcional)
   * @param birthDate Nova data de nascimento (opcional)
   * @returns Result contendo a instância de pessoa atualizada ou falhas de validação
   */
  public async update(uid: string, name?: string, birthDate?: Date): Promise<Result<Person>> {
    const failures = ensureNotNull({ uid })
    if (failures.length > 0) return failure(failures)

    const person = validateAndCollect(await this.findById(uid), failures)
    if (failures.length > 0) return failure(failures)

    const props: Parameters<typeof person.update>[0] = {}
    if (name !== undefined) props['name'] = name
    if (birthDate !== undefined) props['birthDate'] = birthDate

    return person.update(props)
  }

  public async delete(uid: string): Promise<Result<null>> {
    const findResult = await this.findById(uid)
    if (findResult.isInvalid()) return findResult

    await this.repository.delete(findResult.value.uid)

    return success(null)
  }
}
