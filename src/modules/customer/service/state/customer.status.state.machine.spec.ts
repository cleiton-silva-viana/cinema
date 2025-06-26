import '@test/helpers/custom.matchers'
import {Customer} from '@modules/customer/entity/customer'
import {CustomerStatusEnum} from '@modules/customer/enum/customer.status.enum'
import {CustomerStatusTransitionActorEnum} from '@modules/customer/enum/customer.status.transiction.action.enum'
import {
  ICustomerStatusTransitionContext
} from '@modules/customer/interface/customer.status.transition.context.interface'
import {CreateTestCustomer} from '@test/builder/customer.builder'
import {FailureCode} from '@shared/failure/failure.codes.enum'
import {CustomerStatusStateMachine} from './customer.status.state.machine'

describe('CustomerStatusStateMachine', () => {
  let customer: Customer

  beforeEach(() => {
    customer = CreateTestCustomer({ status: CustomerStatusEnum.ACTIVE })
  })

  describe('for', () => {
    it('deve retornar uma instância de CustomerActions', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer)

      // Assert
      expect(result).toBeDefined()
      expect(result.constructor.name).toBe('CustomerActions')
    })
  })

  describe('canTransition', () => {
    it('deve retornar sucesso para transição válida', () => {
      // Arrange
      const pendingCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })
      const validContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(pendingCustomer, CustomerStatusEnum.ACTIVE, validContext)

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve retornar falha para transição inválida', () => {
      // Arrange
      const invalidContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(customer, CustomerStatusEnum.BLOCKED, invalidContext)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })

    it('deve validar motivo de bloqueio quando necessário', () => {
      // Arrange
      const blockContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        reason: 'short', // Muito curto para bloqueio
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(customer, CustomerStatusEnum.BLOCKED, blockContext)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_BLOCK_REASON_TOO_SHORT)
    })

    it('deve validar motivo de suspensão quando necessário', () => {
      // Arrange
      const suspendContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        reason: 'short', // Muito curto para suspensão
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(customer, CustomerStatusEnum.SUSPENDED, suspendContext)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_SUSPENSION_REASON_TOO_SHORT)
    })

    it('deve aceitar motivo de bloqueio válido', () => {
      // Arrange
      const validBlockContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        reason: 'Motivo válido com mais de 20 caracteres para bloqueio',
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(customer, CustomerStatusEnum.BLOCKED, validBlockContext)

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve aceitar motivo de suspensão válido', () => {
      // Arrange
      const validSuspendContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        reason: 'Motivo válido para suspensão',
      }

      // Act
      const result = CustomerStatusStateMachine.canTransition(
        customer,
        CustomerStatusEnum.SUSPENDED,
        validSuspendContext
      )

      // Assert
      expect(result).toBeValidResult()
    })
  })

  describe('executeTransition', () => {
    it('deve executar transição válida com sucesso', () => {
      // Arrange
      const pendingCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })
      const validContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      }

      // Act
      const result = CustomerStatusStateMachine.executeTransition(
        pendingCustomer,
        CustomerStatusEnum.ACTIVE,
        validContext
      )

      // Assert
      expect(result).toBeValidResultMatching((updatedCustomer: Customer) => {
        expect(updatedCustomer.status).toBe(CustomerStatusEnum.ACTIVE)
        expect(updatedCustomer.uid.value).toBe(pendingCustomer.uid.value)
      })
    })

    it('deve falhar ao executar transição inválida', () => {
      // Arrange
      const invalidContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.CUSTOMER,
      }

      // Act
      const result = CustomerStatusStateMachine.executeTransition(customer, CustomerStatusEnum.BLOCKED, invalidContext)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })

    it('deve falhar quando validação de contexto falha', () => {
      // Arrange
      const invalidBlockContext: ICustomerStatusTransitionContext = {
        actor: CustomerStatusTransitionActorEnum.ADMIN,
        reason: 'short', // Muito curto
      }

      // Act
      const result = CustomerStatusStateMachine.executeTransition(
        customer,
        CustomerStatusEnum.BLOCKED,
        invalidBlockContext
      )

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_BLOCK_REASON_TOO_SHORT)
    })
  })

  describe('getValidTransitions', () => {
    it('deve retornar transições válidas para CUSTOMER ativo', () => {
      // Act
      const transitions = CustomerStatusStateMachine.getValidTransitions(
        CustomerStatusEnum.ACTIVE,
        CustomerStatusTransitionActorEnum.CUSTOMER
      )

      // Assert
      expect(transitions).toEqual([CustomerStatusEnum.PENDING_DELETION])
    })

    it('deve retornar transições válidas para ADMIN com cliente ativo', () => {
      // Act
      const transitions = CustomerStatusStateMachine.getValidTransitions(
        CustomerStatusEnum.ACTIVE,
        CustomerStatusTransitionActorEnum.ADMIN
      )

      // Assert
      expect(transitions).toEqual(expect.arrayContaining([CustomerStatusEnum.BLOCKED, CustomerStatusEnum.SUSPENDED]))
      expect(transitions).toHaveLength(2)
    })

    it('deve retornar status com transições válidas', () => {
      // Act
      const transitions = CustomerStatusStateMachine.getValidTransitions(
        CustomerStatusEnum.PENDING_DELETION,
        CustomerStatusTransitionActorEnum.CUSTOMER
      )

      // Assert
      expect(transitions).toEqual([ 'ACTIVE' ])
    })

    it('deve retornar transições válidas para cliente suspenso', () => {
      // Act
      const customerTransitions = CustomerStatusStateMachine.getValidTransitions(
        CustomerStatusEnum.SUSPENDED,
        CustomerStatusTransitionActorEnum.CUSTOMER
      )
      const adminTransitions = CustomerStatusStateMachine.getValidTransitions(
        CustomerStatusEnum.SUSPENDED,
        CustomerStatusTransitionActorEnum.ADMIN
      )

      // Assert
      expect(customerTransitions).toEqual([])
      expect(adminTransitions).toEqual(expect.arrayContaining([CustomerStatusEnum.BLOCKED, CustomerStatusEnum.ACTIVE]))
    })
  })

  describe('getAllValidTransitions', () => {
    it('deve retornar todas as transições válidas para cliente ativo', () => {
      // Act
      const transitions = CustomerStatusStateMachine.getAllValidTransitions(CustomerStatusEnum.ACTIVE)

      // Assert
      expect(transitions).toEqual(
        expect.arrayContaining([
          { status: CustomerStatusEnum.PENDING_DELETION, actor: CustomerStatusTransitionActorEnum.CUSTOMER },
          { status: CustomerStatusEnum.BLOCKED, actor: CustomerStatusTransitionActorEnum.ADMIN },
          { status: CustomerStatusEnum.SUSPENDED, actor: CustomerStatusTransitionActorEnum.ADMIN },
        ])
      )
      expect(transitions).toHaveLength(3)
    })

    it('deve retornar transições para cliente pendente de verificação', () => {
      // Act
      const transitions = CustomerStatusStateMachine.getAllValidTransitions(CustomerStatusEnum.PENDING_VERIFICATION)

      // Assert
      expect(transitions).toEqual(
        expect.arrayContaining([
          { status: CustomerStatusEnum.BLOCKED, actor: CustomerStatusTransitionActorEnum.ADMIN },
        ])
      )
      expect(transitions).toHaveLength(1)
    })
  })

  describe('CustomerActions - canActivate', () => {
    it('deve permitr a ativação de um cliente com status PENDING_DELETION', () => {
      // Arrange
      const pendingCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })

      // Act
      const result = CustomerStatusStateMachine.for(pendingCustomer)
          .canActivate()
          .by(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeValidResult()
    })

    describe('casos de falha', () => {
      const cases = [
        { scenario: 'cliente pendente de verificação', status: CustomerStatusEnum.PENDING_VERIFICATION },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
      ]

      cases.forEach(({ status, scenario }) => {
        it(`deve falhar quando ${scenario}`, () => {
          // Act
          const result = CustomerStatusStateMachine.for(customer)
              .canActivate()
              .by(CustomerStatusTransitionActorEnum.CUSTOMER)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
        })
      })
    })
  })

  describe('CustomerActions - canBlock', () => {
    it('deve permitir bloqueio de cliente ativo por admin com motivo válido', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).canBlock().by(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'Motivo válido com mais de 20 caracteres para bloqueio',
      })

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve impedir bloqueio com motivo menor que 20 caracteres', () => {
      const shortReason = 'a'.repeat(19)
      const result = CustomerStatusStateMachine.for(customer)
        .canBlock()
        .by(CustomerStatusTransitionActorEnum.ADMIN, { reason: shortReason })
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_BLOCK_REASON_TOO_SHORT)
    })

    it('deve impedir bloqueio com motivo maior que 255 caracteres', () => {
      const longReason = 'a'.repeat(256)
      const result = CustomerStatusStateMachine.for(customer)
        .canBlock()
        .by(CustomerStatusTransitionActorEnum.ADMIN, { reason: longReason })
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_BLOCK_REASON_TOO_LONG)
    })

    it('deve impedir bloqueio por customer', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).canBlock().by(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })
  })

  describe('CustomerActions - canSuspend', () => {
    it('deve permitir suspensão de cliente ativo por admin com motivo válido', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).canSuspend().by(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'Motivo válido para suspensão',
      })

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve impedir suspensão com motivo menor que 10 caracteres', () => {
      const shortReason = 'a'.repeat(9)
      const result = CustomerStatusStateMachine.for(customer)
        .canSuspend()
        .by(CustomerStatusTransitionActorEnum.ADMIN, { reason: shortReason })
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_SUSPENSION_REASON_TOO_SHORT)
    })

    it('deve impedir suspensão com motivo maior que 255 caracteres', () => {
      const longReason = 'a'.repeat(256)
      const result = CustomerStatusStateMachine.for(customer)
        .canSuspend()
        .by(CustomerStatusTransitionActorEnum.ADMIN, { reason: longReason })
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_SUSPENSION_REASON_TOO_LONG)
    })

    it('deve impedir suspensão por customer', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer)
        .canSuspend()
        .by(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })
  })

  describe('CustomerActions - canMarkForDeletion', () => {
    it('deve permitir marcação para exclusão por customer ativo', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer)
        .canMarkForDeletion()
        .by(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve permitir marcação para exclusão de cliente bloqueado por admin', () => {
      // Arrange
      const blockedCustomer = CreateTestCustomer({ status: CustomerStatusEnum.BLOCKED })

      // Act
      const result = CustomerStatusStateMachine.for(blockedCustomer)
        .canMarkForDeletion()
        .by(CustomerStatusTransitionActorEnum.ADMIN)

      // Assert
      expect(result).toBeValidResult()
    })

    it('deve impedir marcação para exclusão de cliente já pendente', () => {
      // Arrange
      const pendingCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })

      // Act
      const result = CustomerStatusStateMachine.for(pendingCustomer)
        .canMarkForDeletion()
        .by(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })
  })

  describe('CustomerActions - activate', () => {

    it('deve ativar cliente com status PENDING_DELETION', () => {
      // Arrange
      const customer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })

      // Act
      const result =  CustomerStatusStateMachine.for(customer).activate(CustomerStatusTransitionActorEnum.CUSTOMER)

      // Assert
      expect(result).toBeValidResultMatching<Customer>(c => {
        expect(c.status).toBe(CustomerStatusEnum.ACTIVE)
      })
    })

    describe('cenários de falha', () => {
      const cases = [
        { scenario: 'cliente já ativo', status: CustomerStatusEnum.ACTIVE },
        { scenario: 'cliente suspenso', status: CustomerStatusEnum.SUSPENDED },
        { scenario: 'cliente bloqueado', status: CustomerStatusEnum.BLOCKED },
      ]

      cases.forEach(({ scenario, status }) => {
        it(`deve falhar ao tentar ativar ${status}`, () => {
          // Arrange
          const customer = CreateTestCustomer({ status })

          // Act
          const result = CustomerStatusStateMachine.for(customer).activate(CustomerStatusTransitionActorEnum.CUSTOMER)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
        })
      })
    })
  })

  describe('CustomerActions - block', () => {
    it('deve bloquear cliente ativo com motivo válido', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).block(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'Motivo válido com mais de 20 caracteres para bloqueio',
      })

      // Assert
      expect(result).toBeValidResultMatching((updatedCustomer: Customer) => {
        expect(updatedCustomer.status).toBe(CustomerStatusEnum.BLOCKED)
        expect(updatedCustomer.uid.value).toBe(customer.uid.value)
      })
    })

    it('deve falhar ao bloquear com motivo insuficiente', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).block(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'short',
      })

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_BLOCK_REASON_TOO_SHORT)
    })

    // deve falahr se ator dor um customer
  })

  describe('CustomerActions - suspend', () => {
    it('deve suspender cliente ativo com motivo válido', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).suspend(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'Motivo válido para suspensão com mais de 20 caracteres',
      })

      // Assert
      expect(result).toBeValidResultMatching((updatedCustomer: Customer) => {
        expect(updatedCustomer.status).toBe(CustomerStatusEnum.SUSPENDED)
        expect(updatedCustomer.uid.value).toBe(customer.uid.value)
      })
    })

    it('deve falhar ao suspender com motivo insuficiente', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).suspend(CustomerStatusTransitionActorEnum.ADMIN, {
        reason: 'short',
      })

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.CUSTOMER_SUSPENSION_REASON_TOO_SHORT)
    })

    // deve falhar ao suspender (se ator for customer)
  })

  describe('CustomerActions - markForDeletion', () => {
    it('deve marcar cliente ativo para exclusão', () => {
      // Act
      const result = CustomerStatusStateMachine.for(customer).markForDeletion(
        CustomerStatusTransitionActorEnum.CUSTOMER
      )

      // Assert
      expect(result).toBeValidResultMatching((updatedCustomer: Customer) => {
        expect(updatedCustomer.status).toBe(CustomerStatusEnum.PENDING_DELETION)
        expect(updatedCustomer.uid.value).toBe(customer.uid.value)
      })
    })

    it('deve falhar ao marcar cliente já pendente para exclusão', () => {
      // Arrange
      const pendingCustomer = CreateTestCustomer({ status: CustomerStatusEnum.PENDING_DELETION })

      // Act
      const result = CustomerStatusStateMachine.for(pendingCustomer).markForDeletion(
        CustomerStatusTransitionActorEnum.CUSTOMER
      )

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_STATUS_TRANSITION)
    })
  })

  describe('CustomerActions - getValidTransitionsFor', () => {
    it('deve retornar transições válidas para ator específico', () => {
      // Act
      const transitions = CustomerStatusStateMachine.for(customer).getValidTransitionsFor(
        CustomerStatusTransitionActorEnum.CUSTOMER
      )

      // Assert
      expect(transitions).toEqual([CustomerStatusEnum.PENDING_DELETION])
    })

    it('deve retornar transições válidas para admin', () => {
      // Act
      const transitions = CustomerStatusStateMachine.for(customer).getValidTransitionsFor(
        CustomerStatusTransitionActorEnum.ADMIN
      )

      // Assert
      expect(transitions).toEqual(expect.arrayContaining([CustomerStatusEnum.BLOCKED, CustomerStatusEnum.SUSPENDED]))
      expect(transitions).toHaveLength(2)
    })
  })

  describe('CustomerActions - getAllValidTransitions', () => {
    it('deve retornar todas as transições válidas para o cliente', () => {
      // Act
      const transitions = CustomerStatusStateMachine.for(customer).getAllValidTransitions()

      // Assert
      expect(transitions).toEqual(
        expect.arrayContaining([
          { status: CustomerStatusEnum.PENDING_DELETION, actor: CustomerStatusTransitionActorEnum.CUSTOMER },
          { status: CustomerStatusEnum.BLOCKED, actor: CustomerStatusTransitionActorEnum.ADMIN },
          { status: CustomerStatusEnum.SUSPENDED, actor: CustomerStatusTransitionActorEnum.ADMIN },
        ])
      )
      expect(transitions).toHaveLength(3)
    })
  })
})
