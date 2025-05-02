import { failure, Result, success } from "../../../shared/result/result";
import { TechnicalError } from "../../../shared/error/technical.error";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { CustomerUID } from "./value-object/customer.uid";
import { Email } from "./value-object/email";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { CPF } from "./value-object/cpf";
import { Name } from "../../../shared/value-object/name";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { isNull } from "../../../shared/validator/validator";

/**
 * Representa um cliente no sistema de cinema.
 * 
 * Esta classe é imutável. Todas as propriedades são somente leitura.
 * Qualquer atualização resulta em uma nova instância.
 */
export class Customer {
  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas
   * através dos métodos estáticos `create` e `hydrate`.
   * 
   * @param uid - Identificador único do cliente
   * @param name - Nome do cliente
   * @param birthDate - Data de nascimento do cliente
   * @param email - Email do cliente
   * @param cpf - CPF do cliente (opcional)
   * @param carteiraEstudantil - Dados da carteira estudantil (opcional)
   */
  private constructor(
    public readonly uid: CustomerUID,
    public readonly name: Name,
    public readonly birthDate: BirthDate,
    public readonly email: Email,
    public readonly cpf?: CPF,
    public readonly carteiraEstudantil?: {
      readonly id: string;
      readonly validade: Date;
    },
  ) {}

  /**
   * Cria uma nova instância de Customer com validação.
   * 
   * @param name - Nome do cliente
   * @param birthDate - Data de nascimento do cliente
   * @param email - Email do cliente
   * @returns Um Result contendo o Customer criado ou falhas de validação
   */
  public static create(
    name: string,
    birthDate: Date,
    email: string,
  ): Result<Customer> {
    const failures = [];

    const nameResult = Name.create(name);
    if (nameResult.invalid) failures.push(...nameResult.failures);

    const birthDateResult = BirthDate.create(birthDate);
    if (birthDateResult.invalid) failures.push(...birthDateResult.failures);

    const emailResult = Email.create(email);
    if (emailResult.invalid) failures.push(...emailResult.failures);

    return failures.length
      ? failure(failures)
      : success(new Customer(
            CustomerUID.create(),
            nameResult.value,
            birthDateResult.value,
            emailResult.value,));
  }

  /**
   * Cria uma instância de Customer a partir de dados existentes sem validação.
   * Usado principalmente para reconstruir objetos a partir do banco de dados.
   * 
   * @param uid - Identificador único do cliente
   * @param name - Nome do cliente
   * @param birthDate - Data de nascimento do cliente
   * @param email - Email do cliente
   * @returns Uma instância de Customer
   * @throws TechnicalError se algum parâmetro for nulo ou indefinido
   */
  public static hydrate(
    uid: string,
    name: string,
    birthDate: Date,
    email: string,
  ): Customer {
    TechnicalError.if(
      !uid || !name || !birthDate || !email,
      FailureCode.NULL_ARGUMENT,
    );
    return new Customer(
      CustomerUID.hydrate(uid),
      Name.hydrate(name),
      BirthDate.hydrate(birthDate),
      Email.hydrate(email),
    );
  }

  /**
   * Atualiza os dados do cliente criando uma nova instância.
   * Mantém a imutabilidade da classe.
   * 
   * @param updates - Objeto contendo os campos a serem atualizados
   * @returns Um Result contendo o novo Customer atualizado ou falhas de validação
   */
  public update(updates: {
    name?: string | Name;
    email?: string | Email;
    birthDate?: Date | BirthDate;
  }): Result<Customer> {
    if (isNull(updates)) return failure({
      code: FailureCode.NULL_ARGUMENT
    })

    const failures: SimpleFailure[] = [];

    if (!updates.name && !updates.email && !updates.birthDate)
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });

    let updatedName = this.name;
    let updatedEmail = this.email;
    let updatedBirthDate = this.birthDate;

    if (updates.name) {
      const nameResult =
        updates.name instanceof Name
          ? success(updates.name)
          : Name.create(updates.name);

      if (nameResult.invalid) failures.push(...nameResult.failures);
      else updatedName = nameResult.value;
    }

    if (updates.email) {
      const emailResult =
        updates.email instanceof Email
          ? success(updates.email)
          : Email.create(updates.email);

      if (emailResult.invalid) failures.push(...emailResult.failures);
      else updatedEmail = emailResult.value;
    }

    if (updates.birthDate) {
      const birthDateResult =
        updates.birthDate instanceof BirthDate
          ? success(updates.birthDate)
          : BirthDate.create(updates.birthDate);

      if (birthDateResult.invalid) failures.push(...birthDateResult.failures);
      else updatedBirthDate = birthDateResult.value;
    }

    if (failures.length > 0) return failure(failures);

    return success(
      new Customer(
        this.uid,
        updatedName,
        updatedBirthDate,
        updatedEmail,
        this.cpf,
        this.carteiraEstudantil
      )
    );
  }
}
