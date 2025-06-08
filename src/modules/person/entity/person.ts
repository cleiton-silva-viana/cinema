import { combine, failure, Result, success } from '@shared/result/result'
import { BirthDate } from '@shared/value-object/birth.date'
import { Name } from '@shared/value-object/name'
import { PersonUID } from './value-object/person.uid'
import { isNullOrUndefined } from '@shared/validator/utils/validation'
import { FailureFactory } from '@shared/failure/failure.factory'

/**
 * Representa a estrutura base de umz pessoa que contribuiu na produção de um filme no sistema.
 */
export class Person {
  protected constructor(
    public readonly uid: PersonUID,
    public readonly name: Name,
    public readonly birthDate: BirthDate
  ) {}

  /**
   * Cria uma instância de Person com validação de dados.
   * @param name Nome da pessoa.
   * @param birthDate Data de nascimento da pessoa.
   * @returns Result<Person> com o objeto criado ou um array de erros.
   */
  public static create(name: string, birthDate: Date): Result<Person> {
    const result = combine([Name.create(name), BirthDate.create(birthDate)])

    if (result.isInvalid()) return result

    const [nameVO, birthDateVO] = result.value
    return success(new Person(PersonUID.create(), nameVO, birthDateVO))
  }

  /**
   * Recupera uma instância de Person a partir de dados existentes (ex: banco de dados).
   * @param uid Identificador único da pessoa.
   * @param name Nome da pessoa.
   * @param birthDate Data de nascimento da pessoa.
   * @returns Person uma instância do tipo Person.
   */
  public static hydrate(uid: string, name: string, birthDate: Date): Person {
    return new Person(PersonUID.hydrate(uid), Name.hydrate(name), BirthDate.hydrate(birthDate))
  }

  /**
   * Atualiza propriedades da pessoa.
   * @param props Objeto contendo as propriedades a serem atualizadas.
   * @returns Result contendo a pessoa atualizada ou falhas de validação.
   */
  public update(props: { name?: string; birthDate?: Date }): Result<Person> {
    if (isNullOrUndefined(props)) return failure(FailureFactory.MISSING_REQUIRED_DATA('props'))

    const result = combine([
      isNullOrUndefined(props.name) ? success(this.name) : Name.create(props.name!),
      isNullOrUndefined(props.birthDate) ? success(this.birthDate) : BirthDate.create(props.birthDate!),
    ])

    if (result.isInvalid()) return result

    const [name, birthDate] = result.value
    return success(new Person(this.uid, name, birthDate))
  }
}
