import { Person } from '../entity/person'
import { PersonUID } from '../entity/value-object/person.uid'

/**
 * Interface para o repositório de pessoas.
 * Define operações de persistência para entidades Person.
 */
export interface IPersonRepository {
  /**
   * Salva uma nova pessoa no repositório.
   * @param person Pessoa a ser salva
   * @returns Result indicando sucesso ou falha na operação
   */
  save(person: Person): Promise<Person>

  /**
   * Busca uma pessoa pelo seu identificador único.
   * @param uid Identificador único da pessoa
   * @returns Result contendo a pessoa encontrada ou erro
   */
  findById(uid: PersonUID): Promise<Person>

  /**
   * Atualiza os dados de uma pessoa existente.
   * @param uid Identificador único da pessoa
   * @param person Novos dados da pessoa
   * @returns Result indicando sucesso ou falha na operação
   */
  update(uid: PersonUID, person: Person): Promise<Person>

  /**
   * Remove uma pessoa do repositório.
   * @param uid Identificador único da pessoa
   * @returns Result indicando sucesso ou falha na operação
   */
  delete(uid: PersonUID): Promise<null>
}
