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
import {
  collectNullFields,
  validateAndCollect,
} from "../../../shared/validator/common.validators";
import { UpdateCustomerDTO } from "../controller/dto/update.customer.dto";

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
   * @param studentCard - Dados da carteira estudantil (opcional)
   */
  private constructor(
    public readonly uid: CustomerUID,
    public readonly name: Name,
    public readonly birthDate: BirthDate,
    public readonly email: Email,
    public readonly cpf?: CPF,
    public readonly studentCard?: {
      readonly id: string;
      readonly validity: Date;
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
    const failures: SimpleFailure[] = [];

    const name1 = validateAndCollect(Name.create(name), failures);
    const birt = validateAndCollect(BirthDate.create(birthDate), failures);
    const email1 = validateAndCollect(Email.create(email), failures);

    return failures.length
      ? failure(failures)
      : success(new Customer(CustomerUID.create(), name1, birt, email1));
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
    const fields = collectNullFields({ uid, name, birthDate, email });

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields,
    });

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
    if (isNull(updates))
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });

    if (!updates.name && !updates.email && !updates.birthDate)
      return failure({
        code: FailureCode.MISSING_REQUIRED_DATA,
      });

    const failures: SimpleFailure[] = [];

    let updatedName: Name | null = this.name;
    if (updates.name !== undefined)
      updatedName =
        updates.name instanceof Name
          ? updates.name
          : validateAndCollect(Name.create(updates.name), failures);

    let updatedEmail: Email | null = this.email;
    if (updates.email !== undefined)
      updatedEmail =
        updates.email instanceof Email
          ? updates.email
          : validateAndCollect(Email.create(updates.email), failures);

    let updatedBirthDate: BirthDate | null = this.birthDate;
    if (updates.birthDate !== undefined)
      updatedBirthDate =
        updates.birthDate instanceof BirthDate
          ? updates.birthDate
          : validateAndCollect(BirthDate.create(updates.birthDate), failures);

    return failures.length > 0
      ? failure(failures)
      : success(
          new Customer(
            this.uid,
            updatedName,
            updatedBirthDate,
            updatedEmail,
            this.cpf,
            this.studentCard,
          ),
        );
  }
}
