/**
 * Helper para criação de datas em testes, substituindo o faker para maior consistência
 */
export class DateHelper {
  static formatDateToISOString(date: Date): string {
    if (!date) {
      return 'null'
    }
    return date.toISOString().split('T')[0]
  }

  /**
   * Cria uma data no futuro baseada em uma data de referência
   * @param days Número de dias no futuro
   * @param refDate Data de referência (padrão: data atual)
   * @returns Nova data no futuro
   */
  static addDays(days: number, refDate?: Date | number): Date {
    const reference = refDate ? new Date(refDate) : new Date()
    const result = new Date(reference)
    result.setDate(result.getDate() + days)
    return result
  }

  /**
   * Cria uma data no passado baseada em uma data de referência
   * @param days Número de dias no passado
   * @param refDate Data de referência (padrão: data atual)
   * @returns Nova data no passado
   */
  static subtractDays(days: number, refDate?: Date | number): Date {
    const reference = refDate ? new Date(refDate) : new Date()
    const result = new Date(reference)
    result.setDate(result.getDate() - days)
    return result
  }

  /**
   * Cria uma data no futuro (alias para addDays para compatibilidade com faker)
   * @param days Número de dias no futuro
   * @param refDate Data de referência (padrão: data atual)
   * @returns Nova data no futuro
   */
  static soon(days: number, refDate?: Date | number): Date {
    return this.addDays(days, refDate)
  }

  /**
   * Cria uma data no passado (alias para subtractDays para compatibilidade com faker)
   * @param days Número de dias no passado
   * @param refDate Data de referência (padrão: data atual)
   * @returns Nova data no passado
   */
  static recent(days: number, refDate?: Date | number): Date {
    return this.subtractDays(days, refDate)
  }

  /**
   * Cria uma data no passado baseada em uma data de referência, permitindo especificar minutos, horas, dias e anos
   * @param config Objeto de configuração com minutos, horas, dias e anos a serem subtraídos
   * @param refDate Data de referência (padrão: data atual)
   * @returns Nova data no passado
   */
  static past(
    config: { minutes?: number; hours?: number; days?: number; years?: number },
    refDate?: Date | number
  ): Date {
    const { minutes, hours, days, years } = config
    const reference = refDate ? new Date(refDate) : new Date()
    const result = new Date(reference)

    if (minutes) result.setMinutes(result.getMinutes() - minutes)
    if (hours) result.setHours(result.getHours() - hours)
    if (days) result.setDate(result.getDate() - days)
    if (years) result.setFullYear(result.getFullYear() - years)

    return result
  }

  /**
   * Cria uma data com hora zerada (00:00:00.000)
   * @param date Data base (padrão: data atual)
   * @returns Nova data com hora zerada
   */
  static startOfDay(date?: Date | number): Date {
    const result = date ? new Date(date) : new Date()
    result.setHours(0, 0, 0, 0)
    return result
  }

  /**
   * Cria uma data com hora final do dia (23:59:59.999)
   * @param date Data base (padrão: data atual)
   * @returns Nova data com hora final do dia
   */
  static endOfDay(date?: Date | number): Date {
    const result = date ? new Date(date) : new Date()
    result.setHours(23, 59, 59, 999)
    return result
  }
}
