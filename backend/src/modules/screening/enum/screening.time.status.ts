/** Define os possíveis estados de exibição baseados no tempo. */
export enum ScreeningTimeStatusEnum {
    /** Agendada, ainda não iniciada. */
    SCHEDULED = 'SCHEDULED',

    /** Em andamento (já iniciada, mas não finalizada). */
    IN_PROGRESS = 'IN_PROGRESS',

    /** Concluída (tempo de término já passou). */
    FINALIZED = 'FINALIZED',
}
