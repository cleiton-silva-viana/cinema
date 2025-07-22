import { ISanitizationStrategy } from '../interface/sanitization.strategy.interface'
import { IMaskEmailOptions } from '../interface/mask.email.options.interface'
import { Injectable } from '@nestjs/common'

/**
 * Estratégia que mascara parcialmente emails com configurações avançadas
 *
 * Esta classe implementa uma estratégia de mascaramento de emails que:
 * - Permite configurar mascaramento da parte local e do domínio separadamente
 * - Suporta preservação de TLDs e domínios específicos
 * - Inclui proteção contra mascaramento de emails muito curtos
 * - Oferece diferentes estratégias de mascaramento para o domínio
 *
 * @implements {ISanitizationStrategy}
 */
@Injectable()
export class MaskEmailStrategy implements ISanitizationStrategy {
  private readonly commonTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.co', '.io']

  /**
   * Executa o mascaramento do email fornecido
   *
   * @param email - Email a ser mascarado
   * @param options - Opções de configuração do mascaramento
   * @returns Email mascarado ou valor original se inválido
   * @example
   * ```
   *   const email = 'usuario@exemplo.com'
   *   const options = { localRevealStart: 2, localRevealEnd: 1, domainStrategy: 'partial' }
   *   const result = maskEmailStrategy.run(email, options)
   *   console.log(result) // 'us****o@e****o.com'
   * ```
   */
  public run(email: string, options?: Partial<IMaskEmailOptions>): string | undefined {
    if (!email) return email

    const [localPart, domainPart] = email.split('@')
    if (!localPart || !domainPart) return email

    const rule: IMaskEmailOptions = {
      maskChar: '*',
      localRevealStart: 2,
      localRevealEnd: 0,
      localMinLength: 4,
      domainStrategy: 'partial',
      domainRevealStart: 1,
      domainRevealEnd: 4,
      preserveTLD: true,
      preservedDomains: ['gmail.com', 'outlook.com', 'yahoo.com'],
      ...options,
    }

    const maskedLocal = this.maskLocalPart(localPart, rule)
    const maskedDomain = this.maskDomainPart(domainPart, rule)

    return `${maskedLocal}@${maskedDomain}`
  }

  /**
   * Mascara a parte local (antes do @) do email
   *
   * @param localPart - Parte local do email
   * @param rule - Regras de mascaramento aplicadas
   * @returns Parte local mascarada
   */
  private maskLocalPart(localPart: string, rule: IMaskEmailOptions): string {
    /** Se a parte local for muito curta, não mascarar, pois pode ser uma falha de segurança */
    if (localPart.length < rule.localMinLength) {
      return localPart
    }

    const start = Math.min(rule.localRevealStart, localPart.length)
    const end = Math.min(rule.localRevealEnd, localPart.length - start)
    const middleLength = localPart.length - start - end

    if (middleLength <= 0) {
      return localPart
    }

    const startPart = localPart.substring(0, start)
    const endPart = end > 0 ? localPart.substring(localPart.length - end) : ''
    const maskPart = rule.maskChar.repeat(middleLength)

    return `${startPart}${maskPart}${endPart}`
  }

  /**
   * Mascara a parte do domínio (após o @) do email
   *
   * @param domainPart - Parte do domínio do email
   * @param rule - Regras de mascaramento aplicadas
   * @returns Parte do domínio mascarada
   */
  private maskDomainPart(domainPart: string, rule: IMaskEmailOptions): string {
    if (rule.preservedDomains.includes(domainPart.toLowerCase())) {
      return domainPart
    }

    switch (rule.domainStrategy) {
      case 'preserve':
        return domainPart

      case 'full':
        return rule.maskChar.repeat(domainPart.length)

      case 'reveal':
        return domainPart

      case 'partial':
      default:
        return this.maskDomainPartial(domainPart, rule)
    }
  }

  /**
   * Aplica mascaramento parcial na parte do domínio
   *
   * @param domainPart - Parte do domínio a ser mascarada
   * @param rule - Regras de mascaramento aplicadas
   * @returns Domínio com mascaramento parcial aplicado
   */
  private maskDomainPartial(domainPart: string, rule: IMaskEmailOptions): string {
    // Separar TLD se preserveTLD estiver ativo
    let tld = ''
    let mainDomain = domainPart

    if (rule.preserveTLD) {
      const foundTLD = this.commonTLDs.find((t) => domainPart.toLowerCase().endsWith(t))
      if (foundTLD) {
        tld = domainPart.substring(domainPart.length - foundTLD.length)
        mainDomain = domainPart.substring(0, domainPart.length - foundTLD.length)
      }
    }

    // Aplicar mascaramento na parte principal do domínio
    const start = Math.min(rule.domainRevealStart, mainDomain.length)
    const end = Math.min(rule.domainRevealEnd - tld.length, mainDomain.length - start)
    const middleLength = mainDomain.length - start - Math.max(0, end)

    if (middleLength <= 0) {
      return domainPart
    }

    const startPart = mainDomain.substring(0, start)
    const endPart = end > 0 ? mainDomain.substring(mainDomain.length - end) : ''
    const maskPart = rule.maskChar.repeat(middleLength)

    return `${startPart}${maskPart}${endPart}${tld}`
  }
}
