import { failure, Result, success } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { BirthDate } from '@shared/value-object/birth.date'
import { Name } from '@shared/value-object/name'
import { PersonUID } from './value-object/person.uid'
import { ensureNotNull, validateAndCollect } from '@shared/validator/common.validators'

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
    const failures: SimpleFailure[] = []

    const nameVO = validateAndCollect(Name.create(name), failures)
    const birthDateVO = validateAndCollect(BirthDate.create(birthDate), failures)

    if (failures.length > 0) return failure(failures)

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
    const failures = ensureNotNull({ props })
    if (failures.length > 0) return failure(failures)

    let nameVO = this.name
    let birthDateVO = this.birthDate

    if (props.name !== undefined) nameVO = validateAndCollect(Name.create(props.name), failures)

    if (props.birthDate !== undefined) birthDateVO = validateAndCollect(BirthDate.create(props.birthDate), failures)

    return failures.length > 0 ? failure(failures) : success(new Person(this.uid, nameVO, birthDateVO))
  }
}
