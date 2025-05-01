import { Result, success, failure } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { Person } from "../entity/person";
import { IPersonRepository } from "../repository/person.repository.interface";
import { PersonUID } from "../entity/value-object/person.uid";

/**
 * Serviço responsável por operações relacionadas a pessoas no sistema.
 * Gerencia pessoas que podem contribuir para filmes em diferentes papéis.
 */
export class PersonService {
  constructor(private readonly repository: IPersonRepository) {}

  /**
   * Busca uma pessoa pelo seu identificador único.
   * @param uid Identificador único da pessoa
   * @returns Result contendo a pessoa encontrada ou erro
   */
  public async findById(uid: string): Promise<Result<Person>> {
    const personUidResult = PersonUID.parse(uid);
    if (personUidResult.invalid) return failure(personUidResult.failures);

    const person = await this.repository.findById(uid);
    return !person
      ? failure([{ code: "PERSON_NOT_FOUND", details: { idProvided: uid } }])
      : success(person);
  }

  /**
   * Cria uma nova pessoa no sistema.
   * @param name Nome completo da pessoa
   * @param birthDate Data de nascimento da pessoa
   * @returns Result contendo a pessoa criada ou erros de validação
   */
  public async create(name: string, birthDate: Date): Promise<Result<Person>> {
    const personResult = Person.create(name, birthDate);
    if (personResult.invalid) return failure(personResult.failures);
    const person = personResult.value;

    await this.repository.save(person);

    return success(person);
  }

  /**
   * Atualiza os dados de uma pessoa existente.
   * @param uid Identificador único da pessoa
   * @param name Novo nome (opcional)
   * @param birthDate Nova data de nascimento (opcional)
   * @returns Result indicando sucesso ou falha na operação
   */
  public async update(
    uid: string,
    name?: string,
    birthDate?: Date,
  ): Promise<Result<Person>> {
    if (!name && !birthDate)
      return failure({
        code: "NO_PROPERTIES_TO_UPDATE",
      });

    const personUidResult = PersonUID.parse(uid);
    if (personUidResult.invalid) return failure(personUidResult.failures);

    const findResult = await this.findById(personUidResult.value.value);
    if (findResult.invalid) return failure(findResult.failures);

    let person = findResult.value;
    const failures: SimpleFailure[] = [];

    if (name) {
      const nameResult = person.updateName(name);
      if (nameResult.invalid) {
        failures.push(...nameResult.failures);
      } else {
        person = nameResult.value;
      }
    }

    if (birthDate) {
      const birthDateResult = person.updateBirthDate(birthDate);
      if (birthDateResult.invalid) {
        failures.push(...birthDateResult.failures);
      } else {
        person = birthDateResult.value;
      }
    }

    if (failures.length > 0) return failure(failures);

    const updatedPerson = await this.repository.update(uid, person);
    return success(updatedPerson);
  }

  /**
   * Remove uma pessoa do sistema.
   * @param uid Identificador único da pessoa
   * @returns Result indicando sucesso ou falha na operação
   */
  public async delete(uid: string): Promise<Result<null>> {
    const personUidResult = PersonUID.parse(uid);
    if (personUidResult.invalid) return failure(personUidResult.failures);

    const findResult = await this.findById(uid);
    if (findResult.invalid) return failure(findResult.failures);

    await this.repository.delete(uid);
    return success(null);
  }
}
