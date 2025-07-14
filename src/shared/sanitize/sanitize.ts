import { SanitizationStrategyEnum } from './enum/sanitization.strategy.enum'
import { ISanitizationConfig } from './interface/sanitization.config.interface'
import { ISanitizationRule } from './interface/sanitization.rule.interface'
import { RedactStrategy } from '@shared/sanitize/strategy/redact.strategy'
import { MaskEmailStrategy } from '@shared/sanitize/strategy/mask.email.strategy'
import { GeneralizeStrategy } from '@shared/sanitize/strategy/generalize.strategy'
import { TruncateStrategy } from '@shared/sanitize/strategy/truncate.strategy'
import { RemoveStrategy } from '@shared/sanitize/strategy/remove.strategy'
import { MaskPhoneStrategy } from '@shared/sanitize/strategy/mask.phone.strategy'
import { ISanitizationStrategy } from '@shared/sanitize/interface/sanitization.strategy.interface'

/**
 * Interface que define o contrato para o serviço de sanitização de dados.
 *
 * @interface ISanitize
 * @description Define a assinatura do método principal para sanitização de dados,
 * garantindo que qualquer implementação forneça a funcionalidade básica necessária.
 */
export interface ISanitize {
  /**
   * Executa o processo de sanitização nos dados fornecidos.
   *
   * @param data - Os dados a serem sanitizados (qualquer tipo)
   * @param config - Configuração de sanitização contendo regras e opções
   * @returns Os dados sanitizados conforme as regras especificadas
   */
  run(data: any, config: ISanitizationConfig): any
}

/**
 * Classe principal responsável pela sanitização de dados sensíveis.
 *
 * Esta classe implementa um sistema robusto de sanitização de dados usando o padrão Strategy,
 * permitindo a aplicação de diferentes técnicas de sanitização (mascaramento, redação, remoção, etc.)
 * de forma flexível e configurável.
 *
 * **Características principais:**
 * - Suporte a múltiplas estratégias de sanitização
 * - Processamento recursivo de objetos e arrays
 * - Preservação opcional de campos não mapeados
 * - Configuração granular por campo
 * - Tratamento seguro de tipos de dados diversos
 *
 * **Casos de uso:**
 * - Logs de aplicação (remoção de dados sensíveis)
 * - Conformidade com LGPD/GDPR
 * - Anonimização para analytics
 * - Mascaramento para ambientes de desenvolvimento
 * - Auditoria e relatórios
 *
 * @example
 * ```typescript
 * const sanitizer = new Sanitize();
 *
 * const userData = {
 *   name: 'João Silva',
 *   email: 'joao@email.com',
 *   phone: '11999887766',
 *   age: 30
 * };
 *
 * const config = {
 *   rules: {
 *     email: { strategy: SanitizationStrategyEnum.MASK_EMAIL },
 *     phone: { strategy: SanitizationStrategyEnum.MASK_PHONE },
 *     name: { strategy: SanitizationStrategyEnum.REDACT }
 *   },
 *   recursive: true,
 *   preserveUnknownFields: true
 * };
 *
 * const sanitized = sanitizer.run(userData, config);
 * // Resultado: { name: '***', email: 'j***@email.com', phone: '119****7766', age: 30 }
 * ```
 */
export class Sanitize implements ISanitize {
  /**
   * Construtor da classe Sanitize.
   *
   * Inicializa todas as estratégias de sanitização disponíveis através de injeção de dependência.
   * Cada estratégia é injetada como uma dependência opcional, permitindo flexibilidade na configuração
   * e facilitando testes unitários através de mocks.
   *
   * @param redactStrategy - Estratégia para redação/ocultação de dados sensíveis
   * @param maskEmailStrategy - Estratégia para mascaramento de endereços de email
   * @param maskPhoneStrategy - Estratégia para mascaramento de números de telefone
   * @param generalizeStrategy - Estratégia para generalização de dados (ex: idades em faixas)
   * @param truncateStrategy - Estratégia para truncamento de strings longas
   * @param removeStrategy - Estratégia para remoção completa de campos
   */
  public constructor(
    private readonly redactStrategy: ISanitizationStrategy = new RedactStrategy(),
    private readonly maskEmailStrategy: ISanitizationStrategy = new MaskEmailStrategy(),
    private readonly maskPhoneStrategy: ISanitizationStrategy = new MaskPhoneStrategy(),
    private readonly generalizeStrategy: ISanitizationStrategy = new GeneralizeStrategy(),
    private readonly truncateStrategy: ISanitizationStrategy = new TruncateStrategy(),
    private readonly removeStrategy: ISanitizationStrategy = new RemoveStrategy()
  ) {}

  /**
   * Mapa de estratégias de sanitização disponíveis.
   *
   * Getter que retorna um Map contendo todas as estratégias de sanitização disponíveis,
   * indexadas pelos valores do enum SanitizationStrategyEnum. Este mapa é usado internamente
   * para resolver qual estratégia aplicar baseada na configuração fornecida.
   *
   * **Estratégias disponíveis:**
   * - REDACT: Substitui dados por caracteres de mascaramento
   * - MASK_EMAIL: Mascara parcialmente endereços de email
   * - MASK_PHONE: Mascara parcialmente números de telefone
   * - GENERALIZE: Generaliza dados específicos (ex: idade → faixa etária)
   * - TRUNCATE: Trunca strings longas mantendo início/fim
   * - REMOVE: Remove completamente o campo dos dados
   */
  private get strategies() {
    return new Map([
      [SanitizationStrategyEnum.REDACT, this.redactStrategy],
      [SanitizationStrategyEnum.MASK_EMAIL, this.maskEmailStrategy],
      [SanitizationStrategyEnum.MASK_PHONE, this.maskPhoneStrategy],
      [SanitizationStrategyEnum.GENERALIZE, this.generalizeStrategy],
      [SanitizationStrategyEnum.TRUNCATE, this.truncateStrategy],
      [SanitizationStrategyEnum.REMOVE, this.removeStrategy],
    ])
  }

  /**
   * Método principal para sanitização de dados.
   *
   * @param {any} data - Os dados a serem sanitizados (objeto, array ou valor primitivo)
   * @param {ISanitizationConfig} config - Configuração de sanitização
   * @returns {any} Os dados sanitizados conforme as regras especificadas
   *
   * Este é o ponto de entrada principal para o processo de sanitização. O método:
   * 1. Valida se os dados foram fornecidos
   * 2. Aplica configurações padrão quando não especificadas
   * 3. Determina o tipo de processamento necessário (array, objeto ou primitivo)
   * 4. Delega o processamento para métodos especializados
   *
   * **Configurações padrão aplicadas:**
   * - `recursive: true` - Processa objetos aninhados recursivamente
   * - `preserveUnknownFields: true` - Mantém campos sem regras de sanitização
   */
  public run(data: any, config: ISanitizationConfig): any {
    if (!data) return data

    const options = {
      recursive: true,
      preserveUnknownFields: true,
      ...config,
    }

    if (Array.isArray(data)) return this.processArray(data, options)
    if (typeof data === 'object') return this.processObject(data, options)
    return data
  }

  /**
   * Processa objetos aplicando regras de sanitização campo por campo.
   *
   * @param {Record<string, any>} obj - O objeto a ser processado
   * @param {ISanitizationConfig} config - Configuração de sanitização
   * @returns {Record<string, any>} Objeto sanitizado
   *
   * Método responsável pelo processamento de objetos JavaScript. Para cada propriedade do objeto:
   * 1. Verifica se existe uma regra de sanitização específica
   * 2. Se existe regra, aplica a estratégia correspondente
   * 3. Se a estratégia é REMOVE e retorna undefined, omite o campo do resultado
   * 4. Se não há regra e preserveUnknownFields=true, mantém o campo
   * 5. Para campos mantidos, aplica processamento recursivo se configurado
   *
   * **Comportamentos especiais:**
   * - Campos com estratégia REMOVE são completamente omitidos do resultado
   * - Processamento recursivo respeita a configuração global
   * - Preservação de campos desconhecidos é configurável
   *
   * @example
   * ```typescript
   * // Objeto com dados aninhados
   * const userData = {
   *   personal: {
   *     name: 'João',
   *     email: 'joao@test.com'
   *   },
   *   metadata: {
   *     lastLogin: '2023-01-01',
   *     attempts: 3
   *   }
   * };
   *
   * // Com recursive: true, processa objetos aninhados
   * // Com preserveUnknownFields: false, remove campos sem regras
   * ```
   */
  private processObject(obj: Record<string, any>, config: ISanitizationConfig): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      const rule = config.rules[key]

      if (rule) {
        // Aplica a regra de sanitização para este campo
        const sanitizedValue = this.applySanitizationRule(value, rule)

        // Se a estratégia é REMOVE e o valor foi removido, não adiciona ao resultado
        if (rule.strategy === SanitizationStrategyEnum.REMOVE && sanitizedValue === undefined) {
          continue
        }

        result[key] = sanitizedValue
      } else if (config.preserveUnknownFields) {
        // Se não há regra para este campo, processa recursivamente se necessário
        if (config.recursive && typeof value === 'object' && value !== null) {
          result[key] = Array.isArray(value) ? this.processArray(value, config) : this.processObject(value, config)
        } else {
          result[key] = value
        }
      }
    }

    return result
  }

  /**
   * Processa arrays aplicando sanitização recursiva em cada elemento.
   *
   * @param {any[]} arr - O array a ser processado
   * @param {ISanitizationConfig} config - Configuração de sanitização
   * @returns {any[]} Array com elementos sanitizados
   *
   * Método responsável pelo processamento de arrays. Para cada elemento:
   * 1. Verifica se é um objeto ou array (necessita processamento recursivo)
   * 2. Se for objeto, chama processObject recursivamente
   * 3. Se for array, chama processArray recursivamente
   * 4. Se for valor primitivo, mantém sem alteração
   *
   * **Características:**
   * - Mantém a ordem original dos elementos
   * - Preserva tipos primitivos sem modificação
   * - Aplica processamento recursivo apenas em objetos/arrays
   * - Respeita todas as configurações de sanitização
   *
   * @example
   * ```typescript
   * // Array de objetos
   * const users = [
   *   { name: 'João', email: 'joao@test.com' },
   *   { name: 'Maria', email: 'maria@test.com' }
   * ];
   *
   * // Array misto
   * const mixedData = [
   *   'string simples',
   *   { user: 'João' },
   *   ['array', 'aninhado'],
   *   42
   * ];
   * ```
   */
  private processArray(arr: any[], config: ISanitizationConfig): any[] {
    return arr.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return Array.isArray(item) ? this.processArray(item, config) : this.processObject(item, config)
      }
      return item
    })
  }

  /**
   * Aplica uma regra de sanitização específica a um valor.
   *
   * @param {any} value - O valor a ser sanitizado
   * @param {ISanitizationRule} rule - A regra de sanitização a ser aplicada
   * @returns {any} O valor sanitizado conforme a estratégia especificada
   *
   * Método responsável pela aplicação efetiva das regras de sanitização. Este método:
   * 1. Resolve a estratégia baseada no enum fornecido na regra
   * 2. Valida se a estratégia existe no mapa de estratégias
   * 3. Executa a estratégia passando o valor e opções específicas
   * 4. Retorna o resultado da sanitização
   *
   * **Tratamento de erros:**
   * - Lança erro descritivo se a estratégia não for encontrada
   * - Propaga erros das estratégias individuais
   *
   * @throws {Error} Quando a estratégia especificada não é encontrada no mapa de estratégias
   *
   * @example
   * ```typescript
   * // Regra para mascaramento de email
   * const emailRule = {
   *   strategy: SanitizationStrategyEnum.MASK_EMAIL,
   *   options: { preserveDomain: true }
   * };
   *
   * // Regra para redação completa
   * const redactRule = {
   *   strategy: SanitizationStrategyEnum.REDACT,
   *   options: { replacement: '[REDACTED]' }
   * };
   * ```
   */
  private applySanitizationRule(value: any, rule: ISanitizationRule): any {
    const strategy = this.strategies.get(rule.strategy)

    if (!strategy) {
      throw new Error(`Estratégia de sanitização não encontrada: ${rule.strategy}`)
    }

    return strategy.run(value, rule.options)
  }
}
