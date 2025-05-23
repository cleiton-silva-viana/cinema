import { failure, Result, success } from "../../../shared/result/result";
import { TechnicalError } from "../../../shared/error/technical.error";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { CustomerUID } from "./value-object/customer.uid";
import { Email } from "./value-object/email";
import { BirthDate } from "../../../shared/value-object/birth.date";
import { CPF } from "./value-object/cpf";
import { Name } from "../../../shared/value-object/name";
import { validateAndCollect } from "../../../shared/validator/common.validators";
import { StudentCard } from "./value-object/student-card";

export interface IHydrateCustomerProps {
  uid: string;
  name: string;
  birthDate: Date;
  email: string;
  cpf?: string | null;
  studentCard?: { id: string; validity: Date } | null;
}

/**
 * Representa um cliente no sistema de cinema.
 *
 * Esta classe é imutável. Todas as propriedades são somente leitura.
 * Qualquer atualização resulta em uma nova instância.
 */
export class Customer {
  private constructor(
    public readonly uid: CustomerUID,
    public readonly name: Name,
    public readonly birthDate: BirthDate,
    public readonly email: Email,
    public readonly cpf?: CPF | null, // Permitir null para remoção
    public readonly studentCard?: StudentCard | null, // Permitir null para remoção
  ) {}

  /**
   * Cria uma nova instância de Customer com validação.
   * @param name O nome do cliente.
   * @param birthDate A data de nascimento do cliente.
   * @param email O endereço de e-mail do cliente.
   * @returns Um `Result` contendo a instância de `Customer` ou uma lista de falhas.
   */
  public static async create(
    name: string,
    birthDate: Date,
    email: string,
  ): Promise<Result<Customer>> {
    const failures: SimpleFailure[] = [];

    const nameVO = validateAndCollect(Name.create(name), failures);
    const birthDateVO = validateAndCollect(
      BirthDate.create(birthDate),
      failures,
    );
    const emailVO = validateAndCollect(Email.create(email), failures);

    return failures.length
      ? failure(failures)
      : success(
          new Customer(CustomerUID.create(), nameVO, birthDateVO, emailVO),
        );
  }

  /**
   * Cria uma instância de Customer a partir de dados existentes sem validação.
   * Usado para reconstituir um objeto a partir do banco de dados ou outra fonte confiável.
   * @param props As propriedades para hidratar o cliente.
   * @returns Uma instância de `Customer`.
   */
  public static hydrate(props: IHydrateCustomerProps): Customer {
    TechnicalError.validateRequiredFields({ props });
    TechnicalError.validateRequiredFields({
      uid: props.uid,
      name: props.name,
      birthDate: props.birthDate,
      email: props.email,
    });

    const cpfVO = props.cpf ? CPF.hydrate(props.cpf) : null;
    const studentCardVO =
      props.studentCard && props.studentCard.id && props.studentCard.validity
        ? StudentCard.hydrate(props.studentCard.id, props.studentCard.validity)
        : null;

    return new Customer(
      CustomerUID.hydrate(props.uid),
      Name.hydrate(props.name),
      BirthDate.hydrate(props.birthDate),
      Email.hydrate(props.email),
      cpfVO,
      studentCardVO,
    );
  }

  /**
   * Atualiza o nome do cliente.
   * Retorna uma nova instância de `Customer` com o nome atualizado.
   * @param name O novo valor para o nome.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateName(name: string): Result<Customer> {
    const nameResult = Name.create(name);
    if (nameResult.isInvalid()) {
      return failure(nameResult.failures);
    }
    return success(
      new Customer(
        this.uid,
        nameResult.value,
        this.birthDate,
        this.email,
        this.cpf,
        this.studentCard,
      ),
    );
  }

  /**
   * Atualiza a data de nascimento do cliente.
   * Retorna uma nova instância de `Customer` com a data de nascimento atualizada.
   * @param birthDateValue O novo valor para a data de nascimento.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateBirthDate(birthDateValue: Date): Result<Customer> {
    const birthDateResult = BirthDate.create(birthDateValue);
    if (birthDateResult.isInvalid()) {
      return failure(birthDateResult.failures);
    }
    return success(
      new Customer(
        this.uid,
        this.name,
        birthDateResult.value,
        this.email,
        this.cpf,
        this.studentCard,
      ),
    );
  }

  /**
   * Atualiza o endereço de e-mail do cliente.
   * Retorna uma nova instância de `Customer` com o e-mail atualizado.
   * @param email O novo valor para o e-mail.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public updateEmail(email: string): Result<Customer> {
    const emailResult = Email.create(email);
    if (emailResult.isInvalid()) {
      return failure(emailResult.failures);
    }
    return success(
      new Customer(
        this.uid,
        this.name,
        this.birthDate,
        emailResult.value,
        this.cpf,
        this.studentCard,
      ),
    );
  }

  /**
   * Atribui um CPF ao cliente.
   * Retorna uma nova instância de `Customer` com o CPF atribuído.
   * @param cpf O novo valor para o CPF.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public assignCPF(cpf: string): Result<Customer> {
    const cpfResult = CPF.create(cpf);
    if (cpfResult.isInvalid()) {
      return failure(cpfResult.failures);
    }
    return success(
      new Customer(
        this.uid,
        this.name,
        this.birthDate,
        this.email,
        cpfResult.value,
        this.studentCard,
      ),
    );
  }

  /**
   * Remove o CPF do cliente.
   * Retorna uma nova instância de `Customer` sem o CPF.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public removeCPF(): Result<Customer> {
    return success(
      new Customer(
        this.uid,
        this.name,
        this.birthDate,
        this.email,
        null,
        this.studentCard,
      ),
    );
  }

  /**
   * Atribui ou atualiza a carteira de estudante do cliente.
   * Retorna uma nova instância de `Customer` com a carteira de estudante atribuída/atualizada.
   * @param id O ID da carteira de estudante.
   * @param validity A data de validade da carteira de estudante.
   * @returns Um `Result` contendo a nova instância de `Customer` ou uma lista de falhas.
   */
  public assignStudentCard(id: string, validity: Date): Result<Customer> {
    const studentCardResult = StudentCard.create(id, validity);
    if (studentCardResult.isInvalid()) {
      return failure(studentCardResult.failures);
    }
    return success(
      new Customer(
        this.uid,
        this.name,
        this.birthDate,
        this.email,
        this.cpf,
        studentCardResult.value,
      ),
    );
  }

  /**
   * Remove a carteira de estudante do cliente.
   * Retorna uma nova instância de `Customer` sem a carteira de estudante.
   * @returns Um `Result` contendo a nova instância de `Customer`.
   */
  public removeStudentCard(): Result<Customer> {
    return success(
      new Customer(
        this.uid,
        this.name,
        this.birthDate,
        this.email,
        this.cpf,
        null,
      ),
    );
  }
}
