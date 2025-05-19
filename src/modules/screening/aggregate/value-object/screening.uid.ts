import { UID } from "../../../../shared/value-object/uid";

/**
 * Representa o identificador único de uma exibição (screening) no sistema.
 * 
 * Esta classe estende a classe base UID e define um prefixo específico "SCNG"
 * para identificar facilmente UIDs relacionados a exibições.
 * 
 * O formato do UID gerado será: SCNG.XXXX-XXXX-XXXX, onde X são caracteres
 * alfanuméricos aleatórios que garantem a unicidade do identificador.
 * 
 * @example
 * // Criar um novo UID para uma exibição
 * const screeningId = ScreeningUID.create();
 * 
 * @example
 * // Hidratar um UID existente a partir de uma string
 * const screeningId = ScreeningUID.hydrate("SCNG-1234-5678-90AB");
 */
export class ScreeningUID extends UID {
  protected static PREFIX = "SCNG";
}