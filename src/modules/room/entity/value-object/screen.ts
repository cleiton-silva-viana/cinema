import { TechnicalError } from '@shared//error/technical.error'
import { failure, Result, success } from '@shared//result/result'
import { Validate } from '@shared//validator/validate'
import { ensureNotNull, parseToEnum } from '@shared/validator/utils/validation.helpers'
import { isNullOrUndefined } from '@shared/validator/utils/validation'

/**
 * Tipos de tela suportados pelo cinema
 *
 * - 2D: Tela que suporta apenas projeções bidimensionais tradicionais
 * - 3D: Tela que suporta apenas projeções tridimensionais
 * - 2D_3D: Tela que suporta ambos os tipos de projeção
 */
export enum ScreenType {
  '2D' = '2D',
  '3D' = '3D',
  '2D_3D' = '2D_3D',
}

/**
 * Representa a tela de projeção de uma sala de cinema.
 *
 * Esta classe implementa o padrão Value Object, sendo imutável e comparável por seus valores.
 * A tela é caracterizada por seu tamanho físico (em metros) e pelo tipo de projeção suportado.
 *
 * Os tipos de projeção podem ser:
 * - 2D: Apenas projeções bidimensionais tradicionais
 * - 3D: Apenas projeções tridimensionais
 * - 2D_3D: Suporta ambos os tipos de projeção
 *
 * Esta entidade é utilizada para determinar quais filmes podem ser exibidos em uma sala
 * específica, com base no tipo de projeção necessário.
 */
export class Screen {
  /**
   * Tamanho mínimo permitido para uma tela de cinema em metros.
   * Telas menores que este valor não são consideradas adequadas para exibição comercial.
   */
  private static readonly MIN_SIZE_IN_METERS = 10

  /**
   * Tamanho máximo permitido para uma tela de cinema em metros.
   * Telas maiores que este valor são consideradas impraticáveis ou não realistas.
   */
  private static readonly MAX_SIZE_IN_METERS = 50

  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas através do método factory.
   *
   * @param size Tamanho da tela em metros
   * @param type Tipo de projeção suportado pela tela
   */
  private constructor(
    public readonly size: number,
    public readonly type: ScreenType
  ) {}

  /**
   * Método Fábrica para criar instâncias de Screen.
   *
   * Este método realiza as seguintes validações:
   * - Tamanho: deve ser um número entre MIN_SIZE_IN_METERS e MAX_SIZE_IN_METERS
   * - Tipo: deve ser um dos valores válidos definidos em ScreenType
   *
   * @param size Tamanho da tela em metros (entre 10 e 50)
   * @param type Tipo da tela (2D, 3D ou 2D_3D)
   * @returns Result<Screen> contendo a Tela ou uma lista de falhas de validação
   */
  public static create(size: number, type: string): Result<Screen> {
    const failures = ensureNotNull({ size, type })
    if (failures.length > 0) return failure(failures)

    Validate.number({ size }, failures)
      .isRequired()
      .isInteger()
      .isInRange(Screen.MIN_SIZE_IN_METERS, Screen.MAX_SIZE_IN_METERS)

    const typeParsedResult = parseToEnum('screen_type', type.trim(), ScreenType)
    if (typeParsedResult.isInvalid()) {
      failures.push(...typeParsedResult.failures)
      return failure(failures)
    }

    const typeParsed = typeParsedResult.value
    return failures.length > 0 ? failure(failures) : success(new Screen(size, typeParsed))
  }

  /**
   * Método de hidratação para recriar instâncias de Screen a partir de dados persistidos.
   *
   * Diferente do método create(), este método assume que os dados já foram validados
   * anteriormente e realiza apenas verificações básicas de nulidade.
   *
   * @param size Tamanho da tela em metros
   * @param type Tipo da tela (2D, 3D ou 2D_3D)
   * @throws {TechnicalError} Se size ou type forem nulos
   * @returns Nova instância de Screen com os dados fornecidos
   */
  public static hydrate(size: number, type: string): Screen {
    TechnicalError.validateRequiredFields({ size, type })
    return new Screen(size, type.trim().toUpperCase() as ScreenType)
  }

  /**
   * Compara esta tela com outra para verificar igualdade de valor.
   *
   * Duas telas são consideradas iguais quando possuem o mesmo tamanho e o mesmo tipo.
   * Este método implementa a comparação por valor, característica essencial de Value Objects.
   *
   * @param other Outra instância de Screen para comparação
   * @returns true se as telas forem iguais em valor, false caso contrário
   */
  public equals(other: Screen): boolean {
    if (isNullOrUndefined(other)) return false
    if (!other || !(other instanceof Screen)) return false
    return this.size === other.size && this.type === other.type
  }
}
