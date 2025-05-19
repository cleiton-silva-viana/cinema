/**
 * DTO para agendamento de atividades em uma sala (limpeza ou manutenção)
 */
export class ScheduleActivityDTO {
  /**
   * Data e hora de início da atividade
   */
  startDate: Date;

  /**
   * Duração da atividade em minutos
   */
  duration: number;
}
