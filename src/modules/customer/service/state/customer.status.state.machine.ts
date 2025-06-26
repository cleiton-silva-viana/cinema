import { Result, success, failure } from '@shared/result/result'
import { FailureFactory } from '@shared/failure/failure.factory'
import { ICustomerStatusTransitionContext } from '../../interface/customer.status.transition.context.interface'
import { ICustomerStatusTransition } from '../../interface/customer.status.transition.interface'
import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'
import { CustomerStatusTransitionActorEnum } from '@modules/customer/enum/customer.status.transiction.action.enum'
import { Customer } from '../../entity/customer'

/**
 * State Machine para gerenciar transições de status do Customer
 *
 * Esta classe implementa o padrão State Machine para controlar as transições de status
 * de clientes no sistema de cinema. Ela garante que apenas transições válidas sejam
 * executadas e aplica validações específicas quando necessário.
 *
 * ## Funcionalidades Principais:
 * - Validação de transições de status baseada em regras de negócio
 * - API fluente para verificação e execução de transições
 * - Validação de motivos para bloqueios e suspensões
 * - Controle de permissões por tipo de ator (CUSTOMER/ADMIN)
 *
 * ## API Fluente:
 * ```typescript
 * // Verificar se uma transição é possível
 * CustomerStatusStateMachine.for(customer).canActivate().by(actor)
 * CustomerStatusStateMachine.for(customer).canBlock().by(actor, { reason: 'motivo' })
 *
 * // Executar transições
 * CustomerStatusStateMachine.for(customer).activate(actor)
 * CustomerStatusStateMachine.for(customer).block(actor, { reason: 'motivo válido' })
 * ```
 *
 * ## Status Disponíveis:
 * - PENDING_VERIFICATION: Cliente aguardando verificação
 * - ACTIVE: Cliente ativo no sistema
 * - INACTIVE: Cliente inativo
 * - BLOCKED: Cliente bloqueado (requer motivo ≥20 caracteres)
 * - SUSPENDED: Cliente suspenso (requer motivo ≥10 caracteres)
 * - PENDING_DELETION: Cliente marcado para exclusão
 *
 * ## Atores:
 * - CUSTOMER: O próprio cliente (transições limitadas)
 * - ADMIN: Administrador do sistema (todas as transições)
 */
export class CustomerStatusStateMachine {
  private static get transitions(): Record<string, ICustomerStatusTransition> {
    const { PENDING_VERIFICATION, ACTIVE, PENDING_DELETION, INACTIVE, BLOCKED, SUSPENDED } = CustomerStatusEnum
    const { CUSTOMER, ADMIN } = CustomerStatusTransitionActorEnum

    return {
      [`${ACTIVE}:${PENDING_DELETION}:${CUSTOMER}`]: {
        from: CustomerStatusEnum.ACTIVE,
        to: CustomerStatusEnum.PENDING_DELETION,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      },
      /*      [`${SUSPENDED}:${PENDING_DELETION}:${CUSTOMER}`]: { // Tal mecanismo será desativa, pois
        from: CustomerStatusEnum.SUSPENDED, // o usuário poderia facilmente: supended > pending deletion > active (ou seja, burlando o sistema)
        to: CustomerStatusEnum.PENDING_DELETION,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      },
      [`${BLOCKED}:${PENDING_DELETION}:${CUSTOMER}`]: {
        from: CustomerStatusEnum.BLOCKED,
        to: CustomerStatusEnum.PENDING_DELETION,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      },*/
      [`${PENDING_DELETION}:${ACTIVE}:${CUSTOMER}`]: {
        from: CustomerStatusEnum.PENDING_DELETION,
        to: CustomerStatusEnum.ACTIVE,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      },

      // Transições do ADMIN - Bloqueios
      [`${ACTIVE}:${BLOCKED}:${ADMIN}`]: {
        from: CustomerStatusEnum.ACTIVE,
        to: CustomerStatusEnum.BLOCKED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateBlockReason,
      },
      [`${INACTIVE}:${BLOCKED}:${ADMIN}`]: {
        from: CustomerStatusEnum.INACTIVE,
        to: CustomerStatusEnum.BLOCKED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateBlockReason,
      },
      [`${SUSPENDED}:${BLOCKED}:${ADMIN}`]: {
        from: CustomerStatusEnum.SUSPENDED,
        to: CustomerStatusEnum.BLOCKED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateBlockReason,
      },
      [`${PENDING_VERIFICATION}:${BLOCKED}:${ADMIN}`]: {
        from: CustomerStatusEnum.PENDING_VERIFICATION,
        to: CustomerStatusEnum.BLOCKED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateBlockReason,
      },

      // Transições do ADMIN - Suspensões
      [`${ACTIVE}:${SUSPENDED}:${ADMIN}`]: {
        from: CustomerStatusEnum.ACTIVE,
        to: CustomerStatusEnum.SUSPENDED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateSuspensionReason,
      },
      [`${INACTIVE}:${SUSPENDED}:${ADMIN}`]: {
        from: CustomerStatusEnum.INACTIVE,
        to: CustomerStatusEnum.SUSPENDED,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        validator: CustomerStatusStateMachine.validateSuspensionReason,
      },

      // Transições do ADMIN - Outras
      [`${SUSPENDED}:${ACTIVE}:${ADMIN}`]: {
        from: CustomerStatusEnum.SUSPENDED,
        to: CustomerStatusEnum.ACTIVE,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
      },
      [`${BLOCKED}:${PENDING_DELETION}:${ADMIN}`]: {
        from: CustomerStatusEnum.BLOCKED,
        to: CustomerStatusEnum.PENDING_DELETION,
        actor: CustomerStatusTransitionActorEnum.ADMIN,
      },

      // transações do sistema
      /*      [`${PENDING_VERIFICATION}:${ACTIVE}:${CUSTOMER}`]: { // DO SISTEMA;;;
        from: CustomerStatusEnum.PENDING_VERIFICATION,
        to: CustomerStatusEnum.ACTIVE,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
        validator: () => success(undefined),
      },*/
      /*      [`${INACTIVE}:${PENDING_DELETION}:${CUSTOMER}`]: {
        from: CustomerStatusEnum.INACTIVE,
        to: CustomerStatusEnum.PENDING_DELETION,
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      },*/
    }
  }

  /**
   * Ponto de entrada da API fluente para operações com um cliente específico
   *
   * Este método cria uma instância de CustomerActions que permite encadear
   * operações de verificação e execução de transições de status.
   *
   * @param customer - Instância do cliente para o qual as operações serão realizadas
   * @returns CustomerActions - Interface fluente para operações de transição
   *
   * @example
   * ```typescript
   * // Verificar se um cliente pode ser ativado
   * const canActivate = CustomerStatusStateMachine.for(customer)
   *   .canActivate()
   *   .by(CustomerStatusTransitionActorEnum.CUSTOMER)
   *
   * // Executar ativação
   * const result = CustomerStatusStateMachine.for(customer)
   *   .activate(CustomerStatusTransitionActorEnum.CUSTOMER)
   *
   * // Bloquear cliente com motivo
   * const blockResult = CustomerStatusStateMachine.for(customer)
   *   .block(CustomerStatusTransitionActorEnum.ADMIN, {
   *     reason: 'Comportamento inadequado no cinema'
   *   })
   * ```
   */
  public static for(customer: Customer): CustomerActions {
    return new CustomerActions(customer)
  }

  /**
   * Valida se uma transição de status é permitida
   *
   * Este método verifica se existe uma transição válida entre o status atual
   * do cliente e o status de destino, considerando o ator que está tentando
   * realizar a transição. Se a transição possui um validador, ele será executado.
   *
   * @param customer - Cliente que terá o status alterado
   * @param targetStatus - Status de destino desejado
   * @param context - Contexto da transição (ator, motivo, etc.)
   * @returns Result<void> - Sucesso se a transição é válida, falha caso contrário
   *
   * @internal Este método é usado internamente pela API fluente
   */
  public static canTransition(
    customer: Customer,
    targetStatus: CustomerStatusEnum,
    context: ICustomerStatusTransitionContext
  ): Result<void> {
    const key = this.buildTransitionKey(customer.status, targetStatus, context.actor)
    const transition = this.transitions[key]

    if (!transition) return failure(FailureFactory.INVALID_STATUS_TRANSITION(customer.status, targetStatus))

    return transition.validator ? transition.validator(customer, context) : success(undefined)
  }

  /**
   * Executa uma transição de status do cliente
   *
   * Este método primeiro valida se a transição é permitida e, em caso positivo,
   * atualiza o status do cliente para o novo valor. A operação é atômica:
   * ou a transição é completamente executada ou falha sem alterações.
   *
   * @param customer - Cliente que terá o status alterado
   * @param targetStatus - Novo status a ser aplicado
   * @param context - Contexto da transição (ator, motivo, etc.)
   * @returns Result<Customer> - Cliente com status atualizado ou falha
   *
   * @internal Este método é usado internamente pela API fluente
   */
  public static executeTransition(
    customer: Customer,
    targetStatus: CustomerStatusEnum,
    context: ICustomerStatusTransitionContext
  ): Result<Customer> {
    const validationResult = this.canTransition(customer, targetStatus, context)
    return validationResult.isInvalid() ? validationResult : customer.updateStatus(targetStatus)
  }

  /**
   * Obtém transições válidas para um status e ator específicos
   */
  public static getValidTransitions(
    currentStatus: CustomerStatusEnum,
    actor: CustomerStatusTransitionActorEnum
  ): CustomerStatusEnum[] {
    return Object.values(this.transitions)
      .filter((t) => t.from === currentStatus && t.actor === actor)
      .map((t) => t.to)
  }

  /**
   * Obtém todas as transições válidas para um status
   */
  public static getAllValidTransitions(
    currentStatus: CustomerStatusEnum
  ): Array<{ status: CustomerStatusEnum; actor: CustomerStatusTransitionActorEnum }> {
    return Object.values(this.transitions)
      .filter((t) => t.from === currentStatus)
      .map((t) => ({ status: t.to, actor: t.actor }))
  }

  /**
   * Valida o motivo fornecido para bloqueio de cliente
   *
   * O motivo de bloqueio deve ter entre 20 e 255 caracteres para garantir
   * que seja suficientemente detalhado para justificar a ação administrativa.
   *
   * @param customer - Cliente que será bloqueado (não utilizado na validação)
   * @param context - Contexto contendo o motivo do bloqueio
   * @returns Result<void> - Sucesso se o motivo é válido, falha caso contrário
   *
   * @throws CUSTOMER_BLOCK_REASON_TOO_SHORT - Motivo com menos de 20 caracteres
   * @throws CUSTOMER_BLOCK_REASON_TOO_LONG - Motivo com mais de 255 caracteres
   */
  private static validateBlockReason(customer: Customer, context?: ICustomerStatusTransitionContext): Result<void> {
    const reason = context?.reason?.trim()
    if (!reason || reason.length < 20)
      return failure(FailureFactory.CUSTOMER_BLOCK_REASON_TOO_SHORT(20, reason?.length || 0))

    if (reason.length > 255) return failure(FailureFactory.CUSTOMER_BLOCK_REASON_TOO_LONG(255, reason.length))

    return success(undefined)
  }

  /**
   * Valida o motivo fornecido para suspensão de cliente
   *
   * O motivo de suspensão deve ter entre 10 e 255 caracteres. O limite mínimo
   * é menor que o de bloqueio pois suspensões podem ser temporárias e menos severas.
   *
   * @param customer - Cliente que será suspenso (não utilizado na validação)
   * @param context - Contexto contendo o motivo da suspensão
   * @returns Result<void> - Sucesso se o motivo é válido, falha caso contrário
   *
   * @throws CUSTOMER_SUSPENSION_REASON_TOO_SHORT - Motivo com menos de 10 caracteres
   * @throws CUSTOMER_SUSPENSION_REASON_TOO_LONG - Motivo com mais de 255 caracteres
   */
  private static validateSuspensionReason(
    customer: Customer,
    context?: ICustomerStatusTransitionContext
  ): Result<void> {
    const reason = context?.reason?.trim()
    if (!reason || reason.length < 10)
      return failure(FailureFactory.CUSTOMER_SUSPENSION_REASON_TOO_SHORT(10, reason?.length || 0))

    if (reason.length > 255) return failure(FailureFactory.CUSTOMER_SUSPENSION_REASON_TOO_LONG(255, reason.length))

    return success(undefined)
  }

  private static buildTransitionKey(
    from: CustomerStatusEnum,
    to: CustomerStatusEnum,
    actor: CustomerStatusTransitionActorEnum
  ): string {
    return `${from}:${to}:${actor}`
  }
}

/**
 * Classe que fornece uma API fluente para operações de transição de status
 *
 * Esta classe encapsula um cliente específico e oferece métodos para:
 * - Verificar se transições são possíveis (métodos can*)
 * - Executar transições de status (métodos de ação)
 * - Obter informações sobre transições válidas
 *
 * Todos os métodos de verificação retornam ActionChecker para permitir
 * especificação do ator e contexto. Os métodos de execução aplicam
 * as mudanças diretamente no cliente.
 *
 * @example
 * ```typescript
 * const actions = new CustomerActions(customer)
 *
 * // Verificar possibilidade
 * const canBlock = actions.canBlock().by(ADMIN, { reason: 'motivo' })
 *
 * // Executar ação
 * const result = actions.block(ADMIN, { reason: 'motivo válido' })
 * ```
 */
class CustomerActions {
  constructor(private readonly customer: Customer) {}

  public canActivate(): ActionChecker {
    return new ActionChecker(this.customer, CustomerStatusEnum.ACTIVE)
  }

  public canBlock(): ActionChecker {
    return new ActionChecker(this.customer, CustomerStatusEnum.BLOCKED)
  }

  public canSuspend(): ActionChecker {
    return new ActionChecker(this.customer, CustomerStatusEnum.SUSPENDED)
  }

  public canInactivate(): ActionChecker {
    return new ActionChecker(this.customer, CustomerStatusEnum.INACTIVE)
  }

  public canMarkForDeletion(): ActionChecker {
    return new ActionChecker(this.customer, CustomerStatusEnum.PENDING_DELETION)
  }

  // Métodos para execução de transições
  public activate(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<Customer> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.executeTransition(this.customer, CustomerStatusEnum.ACTIVE, fullContext)
  }

  public block(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<Customer> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.executeTransition(this.customer, CustomerStatusEnum.BLOCKED, fullContext)
  }

  public suspend(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<Customer> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.executeTransition(this.customer, CustomerStatusEnum.SUSPENDED, fullContext)
  }

  public inactivate(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<Customer> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.executeTransition(this.customer, CustomerStatusEnum.INACTIVE, fullContext)
  }

  public markForDeletion(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<Customer> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.executeTransition(this.customer, CustomerStatusEnum.PENDING_DELETION, fullContext)
  }

  // Métodos utilitários
  public getValidTransitionsFor(actor: CustomerStatusTransitionActorEnum): CustomerStatusEnum[] {
    return CustomerStatusStateMachine.getValidTransitions(this.customer.status, actor)
  }

  public getAllValidTransitions(): Array<{ status: CustomerStatusEnum; actor: CustomerStatusTransitionActorEnum }> {
    return CustomerStatusStateMachine.getAllValidTransitions(this.customer.status)
  }
}

/**
 * Classe para verificação de transições específicas com contexto
 *
 * Esta classe é retornada pelos métodos can* da CustomerActions e permite
 * especificar o ator e contexto para uma transição específica. Ela encapsula
 * o cliente, o status de destino e fornece o método `by()` para completar
 * a verificação.
 *
 * @example
 * ```typescript
 * // Verificar se admin pode bloquear com motivo específico
 * const checker = new ActionChecker(customer, CustomerStatusEnum.BLOCKED)
 * const result = checker.by(ADMIN, { reason: 'Comportamento inadequado' })
 *
 * if (result.isValid()) {
 *   console.log('Transição é válida')
 * } else {
 *   console.log('Erro:', result.failures)
 * }
 * ```
 */
class ActionChecker {
  constructor(
    private readonly customer: Customer,
    private readonly targetStatus: CustomerStatusEnum
  ) {}

  public by(
    actor: CustomerStatusTransitionActorEnum,
    context?: Omit<ICustomerStatusTransitionContext, 'actor'>
  ): Result<void> {
    const fullContext: ICustomerStatusTransitionContext = { actor, ...context }
    return CustomerStatusStateMachine.canTransition(this.customer, this.targetStatus, fullContext)
  }
}
