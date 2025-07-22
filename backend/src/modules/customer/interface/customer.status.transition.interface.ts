import { CustomerStatusEnum } from '@modules/customer/enum/customer.status.enum'
import { CustomerStatusTransitionActorEnum } from '@modules/customer/enum/customer.status.transiction.action.enum'
import { Customer } from '@modules/customer/entity/customer'
import { ICustomerStatusTransitionContext } from '@modules/customer/interface/customer.status.transition.context.interface'
import { Result } from '@shared/result/result'

/**
 * Interface que define uma transição de status
 */
export interface ICustomerStatusTransition {
  from: CustomerStatusEnum
  to: CustomerStatusEnum
  actor: CustomerStatusTransitionActorEnum
  validator?: (customer: Customer, context?: ICustomerStatusTransitionContext) => Result<void>
}
