import { Result, success, failure } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { Name } from "../../../shared/value-object/name";
import { PersonUID } from "../value-object/person.uid";

/**
 * Representa a estrutura base de umz pessoa que contribuiu na produção de um filme no sistema.
 */
export class Person {
  protected constructor(
    public readonly uid: PersonUID,
    private _name: Name,
    private _birthDate: BirthDate
  ) {}

  /**
   * Cria uma instância de Person com validação de dados.
   * @param name Nome da pessoa.
   * @param birthDate Data de nascimento da pessoa.
   * @returns Result<Person> com o objeto criado ou um array de erros.
   */
  public static create(name: string, birthDate: Date): Result<Person> {
    const failures: SimpleFailure[] = [];

    const nameResult = Name.create(name);
    if (nameResult.invalid) failures.push(...nameResult.failures);

    const birthDateResult = BirthDate.create(birthDate);
    if (birthDateResult.invalid) failures.push(...birthDateResult.failures);

    if (failures.length > 0) return failure(failures);

    return success(new Person(PersonUID.create(), nameResult.value, birthDateResult.value));
  }

  /**
   * Recupera uma instância de Person a partir de dados existentes (ex: banco de dados).
   * @param uid Identificador único da pessoa.
   * @param name Nome da pessoa.
   * @param birthDate Data de nascimento da pessoa.
   * @returns Person uma instância do tipo Person.
   */
  public static hydrate(uid: string, name: string, birthDate: Date): Person {
    return new Person(PersonUID.hydrate(uid), Name.hydrate(name), BirthDate.hydrate(birthDate));
  }

  /**
   * Atualiza o nome da pessoa.
   * @param name Novo nome para a pessoa.
   * @returns Array de erros se a operação falhar, ou array vazio se for bem-sucedida.
   */
  public updateName(name: string): SimpleFailure[] {
    const nameResult = Name.create(name);
    if (nameResult.invalid) return nameResult.failures;

    this._name = nameResult.value;
    return [];
  }

  /**
 * Atualiza a data de nascimento da pessoa.
 * @param birthDate Nova data de nascimento.
 * @returns Array de erros se a operação falhar, ou array vazio se for bem-sucedida.
 */
  public updateBirthDate(birthDate: Date): SimpleFailure[] {
    if (!birthDate) return [];

    const birthDateResult = BirthDate.create(birthDate);
    if (birthDateResult.invalid) return birthDateResult.failures;

    this._birthDate = birthDateResult.value;
    return [];
  }

  /**
   * Obtém o nome da pessoa.
   */
  public get name(): Name {
    return this._name;
  }

  /**
   * Obtém a data de nascimento da pessoa.
   */
  public get birthDate(): BirthDate {
    return this._birthDate;
  }
}