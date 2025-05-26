import { UID } from '@shared/value-object/uid'

/**
 * Representa o identificador único de uma pessoa no sistema.
 *
 * Esta classe estende a classe base UID e define um prefixo específico
 * para identificadores de pessoas, permitindo que sejam facilmente
 * reconhecidos e validados no sistema.
 *
 * O prefixo "PRSN" é usado para diferenciar IDs de pessoas de outros
 * tipos de identificadores no sistema.
 */
export class PersonUID extends UID {
  protected static readonly PREFIX: string = 'PRSN'
}
