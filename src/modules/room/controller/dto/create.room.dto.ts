export class SeatRowConfigurationDTO {
  /**
   * Número da fileira
   * */
  rowNumber: number;
  /**
   * Última letra da fileira atual (letra da última poltrona)
   * */
  lastColumnLetter: string;
  /**
   * Array contendo as letras das poltronas preferenciais
   * */
  preferentialSeatLetters?: string[];
}

export class CreateRoomDTO {
  /**
   * O número da sala de cinema
   * Usado para identificar e exibir a sala para os clientes
   */
  roomId: number;

  /**
   * Configuração dos assentos da sala
   */
  seatConfiguration: SeatRowConfigurationDTO[];

  /**
   * Tamanho da tela de projeção em metros
   * Deve ter pelo menos 1 metro
   */
  screenSize: number;

  /**
   * Tipo de tela da sala
   */
  screenType: string;

  /**
   * Status inicial da sala
   */
  status?: string;
}
