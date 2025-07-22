import { CustomerStatusTransitionActorEnum } from '../enum/customer.status.transiction.action.enum'

/**
 * Contexto para transições de status
 */
export interface ICustomerStatusTransitionContext {
  actor: CustomerStatusTransitionActorEnum
  reason?: string
  adminUID?: string
  metadata?: Record<string, any>
}
