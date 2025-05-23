import { failure, Result, success } from "../result/result";
import { isNull } from "../validator/validator";
import { FailureCode } from "../failure/failure.codes.enum";
import { ensureNotNull } from "../validator/common.validators";
import { Validate } from "../validator/validate";
import { TechnicalError } from "../error/technical.error";

/**
 * Representa um valor monetário (Preço).
 *
 * Esta classe utiliza internamente a representação em centavos (multiplicando o valor por 100)
 * para evitar problemas de precisão com números de ponto flutuante. Todos os métodos que
 * recebem ou retornam valores trabalham com a representação decimal normal (ex: R$ 10,50),
 * mas internamente o valor é armazenado como centavos (1050).
 *
 * A moeda padrão é o Real brasileiro (BRL), mas pode ser especificada ao formatar o valor.
 *
 * Nota sobre precisão: Mesmo usando inteiros para representar centavos, operações como divisão
 * podem resultar em valores fracionários. Nestes casos, o valor é arredondado para o centavo
 * mais próximo.
 */
export class Price {
  /**
   * Construtor privado que armazena o valor em centavos.
   * @param value O valor em centavos (já multiplicado por 100).
   */
  private constructor(
    public readonly value: number, // Representa o valor monetário em centavos.
  ) {}

  /**
   * Método Fábrica para criar instâncias de Price.
   * Aceita números que representam o valor em centavos (ex: 1050 para R$ 10,50).
   * Valida se o valor é numérico, não nulo, inteiro e não negativo.
   *
   * @param valueInCents O valor do preço em centavos.
   * @returns Result<Price> contendo o Preço ou uma lista de falhas.
   */
  public static create(valueInCents: number): Result<Price> {
    const failures = ensureNotNull({ value: valueInCents });
    if (failures.length > 0) return failure(failures);

    Validate.number({ valueInCents }, failures)
      .isRequired()
      .isInteger(FailureCode.PRICE_MUST_BE_INTEGER, { value: valueInCents })
      .isTrue(valueInCents >= 0, FailureCode.PRICE_MUST_BE_POSITIVE, {
        value: valueInCents,
      })
      .isTrue(!isNaN(valueInCents), FailureCode.PRICE_INVALID_INSTANCE, {
        type: typeof valueInCents,
      });

    return failures.length > 0
      ? failure(failures)
      : success(new Price(valueInCents));
  }

  /**
   * Compara este preço com outro para verificar igualdade de valor.
   *
   * @param other O outro preço a ser comparado.
   * @returns boolean True se os preços tiverem o mesmo valor.
   */
  public equals(other: Price): boolean {
    if (isNull(other)) return false;
    if (!(other instanceof Price)) return false;
    return this.value === other.value;
  }

  /**
   * Adiciona outro preço a este preço.
   * Retorna um novo Result<Price> com o resultado ou falha se a criação falhar.
   *
   * @param other O preço a ser adicionado.
   * @returns Result<Price> O novo preço resultante.
   */
  public add(other: Price): Result<Price> {
    if (!(other instanceof Price))
      return failure({
        code: FailureCode.PRICE_INVALID_INSTANCE,
        details: { type: typeof other },
      });

    const newValue = this.value + other.value;
    return Price.create(newValue);
  }

  /**
   * Subtrai outro preço deste preço.
   * Retorna falha se o resultado for negativo.
   *
   * @param other O preço a ser subtraído.
   * @returns Result<Price> O novo preço resultante ou falha.
   * @throws Falha com código PRICE_INVALID_INSTANCE se o parâmetro não for uma instância de Price.
   * @throws Falha com código PRICE_NEGATIVE_RESULT_NOT_ALLOWED se o resultado for negativo.
   */
  public subtract(other: Price): Result<Price> {
    if (!(other instanceof Price))
      return failure({
        code: FailureCode.PRICE_INVALID_INSTANCE,
        details: { type: typeof other },
      });

    const newValue = this.value - other.value;

    if (newValue < 0)
      return failure({
        code: FailureCode.PRICE_NEGATIVE_RESULT_NOT_ALLOWED,
        details: {
          value: this.value,
          subtracted_value: other.value,
          result: newValue,
        },
      });

    return Price.create(newValue);
  }

  /**
   * Multiplica o preço por um fator.
   *
   * @param factor O fator de multiplicação (deve ser um número positivo)
   * @returns Result<Price> O novo preço resultante ou falha.
   * @throws Falha com código PRICE_INVALID_MULTIPLICATION_FACTOR se o fator não for um número válido.
   * @throws Falha com código PRICE_NEGATIVE_FACTOR_NOT_ALLOWED se o fator for negativo.
   */
  public multiply(factor: number): Result<Price> {
    if (typeof factor !== "number" || isNaN(factor))
      return failure({
        code: FailureCode.PRICE_INVALID_MULTIPLICATION_FACTOR,
        details: { value: factor, type: "number" },
      });

    if (factor < 0)
      return failure({
        code: FailureCode.PRICE_NEGATIVE_FACTOR_NOT_ALLOWED,
        details: { factor },
      });

    const newValue = this.value * factor;
    // O resultado da multiplicação pode não ser um inteiro, arredondamos para o centavo mais próximo
    const roundedValue = Math.round(newValue);
    return Price.create(roundedValue);
  }

  /**
   * Divide o preço por um divisor.
   * O resultado é arredondado para o centavo mais próximo.
   *
   * @param divisor O divisor (deve ser um número positivo maior que zero)
   * @returns Result<Price> O novo preço resultante ou falha.
   * @throws Falha com código PRICE_INVALID_DIVISION_FACTOR se o divisor não for um número válido.
   * @throws Falha com código PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED se o divisor for zero ou negativo.
   */
  public divide(divisor: number): Result<Price> {
    if (typeof divisor !== "number" || isNaN(divisor))
      return failure({
        code: FailureCode.PRICE_INVALID_DIVISION_FACTOR,
        details: { value: divisor, type: "number" },
      });

    if (divisor <= 0)
      return failure({
        code: FailureCode.PRICE_ZERO_OR_NEGATIVE_DIVISOR_NOT_ALLOWED,
        details: { divisor },
      });

    const newValue = this.value / divisor;
    const roundedValue = Math.round(newValue);
    return Price.create(roundedValue);
  }

  /**
   * Compara este preço com outro.
   *
   * @param other O outro preço a ser comparado
   * @returns -1 se este preço for menor, 0 se forem iguais, 1 se este preço for maior
   * @throws TechnicalError se o parâmetro não for uma instância de Price.
   */
  public compare(other: Price): number {
    TechnicalError.if(
      !(other instanceof Price),
      FailureCode.PRICE_INVALID_INSTANCE,
    );

    if (this.value < other.value) return -1;
    if (this.value > other.value) return 1;
    return 0;
  }

  /**
   * Formata o preço para exibição como valor monetário.
   *
   * @returns String formatada do preço (ex: "R$ 10,50")
   */
  get format(): string {
    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(this.value);
  }
}
