/**
 * Enum que define as estratégias de sanitização disponíveis para dados sensíveis
 */
export enum SanitizationStrategyEnum {
  /** REDACT - Substitui completamente o valor por um marcador (ex: "REDACTED") */
  REDACT = 'REDACT',
  /** ANONYMIZE - Anonimiza os dados mantendo a estrutura mas removendo identificadores */
  ANONYMIZE = 'ANONYMIZE',
  /** MASK_EMAIL - Mascara endereços de email (ex: j***@exemplo.com) */
  MASK_EMAIL = 'MASK_EMAIL',
  /** MASK_PHONE - Mascara números de telefone (ex: (XX) ****-5678) */
  MASK_PHONE = 'MASK_PHONE',
  /** MASK_CREDIT_CARD - Mascara números de cartão de crédito (ex: **** **** **** 1234) */
  MASK_CREDIT_CARD = 'MASK_CREDIT_CARD',
  /** HASH - Converte o valor em um hash criptográfico */
  HASH = 'HASH',
  /** TRUNCATE - Reduz o tamanho do valor mantendo apenas parte inicial/final */
  TRUNCATE = 'TRUNCATE',
  /** GENERALIZE - Substitui valores específicos por categorias mais gerais */
  GENERALIZE = 'GENERALIZE',
  /** REMOVE - Remove completamente o campo/valor dos dados */
  REMOVE = 'REMOVE',
}
