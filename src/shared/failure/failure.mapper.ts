import { HttpStatus } from "@nestjs/common";
import { SimpleFailure } from "./simple.failure.type";
import { RichFailureType } from "./rich.failure.type";
import { FailureMessageProvider, FailureMessageConfig } from "./failure.message.provider";

/**
 * Interface para provedores de mensagens de falha
 */
export interface IFailureMessageProvider {
  getMessageConfig(code: string): FailureMessageConfig | undefined;
}

/**
 * Classe responsável por mapear SimpleFailure para RichFailureType,
 * utilizando as configurações definidas no arquivo failure.messages.json
 */
export class FailureMapper {
  private static messageProvider: IFailureMessageProvider = FailureMessageProvider.getInstance();

  /**
   * Define um provedor de mensagens personalizado para o mapper
   * Útil para testes e cenários onde se deseja substituir o provedor padrão
   * 
   * @param provider O provedor de mensagens a ser utilizado
   */
  public static setMessageProvider(provider: IFailureMessageProvider): void {
    this.messageProvider = provider;
  }

  /**
   * Restaura o provedor de mensagens para o padrão
   */
  public static resetMessageProvider(): void {
    this.messageProvider = FailureMessageProvider.getInstance();
  }

  /**
   * Converte um objeto SimpleFailure em um objeto RichFailureType
   * 
   * @param failure O objeto SimpleFailure a ser convertido
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Um objeto RichFailureType com informações completas sobre o erro
   */
  public static toRichFailure(failure: SimpleFailure, language: 'pt' | 'en' = 'pt'): RichFailureType {
    const messageConfig = this.messageProvider.getMessageConfig(failure.code);
    
    if (!messageConfig) {
      // Improved handling for unknown error codes
      const defaultMessages = {
        pt: `Erro desconhecido`,
        en: `Unknown error`
      };
      
      return {
        code: failure.code,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        title: defaultMessages[language] || defaultMessages.en,
        details: {
          ...this.convertDetailsToRecord(failure.details || {}),
        }
      };
    }
    
    const title = messageConfig.message[language] || messageConfig.message.en;
    
    const status = messageConfig.statusCode as HttpStatus;
    
    return {
      code: failure.code,
      status,
      title,
      details: this.convertDetailsToRecord(failure.details || {})
    };
  }
  
  /**
   * Converte múltiplos objetos SimpleFailure em objetos RichFailureType
   * 
   * @param failures Array de objetos SimpleFailure a serem convertidos
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Array de objetos RichFailureType
   */
  public static toRichFailures(failures: SimpleFailure[], language: 'pt' | 'en' = 'pt'): RichFailureType[] {
    return failures.map(failure => this.toRichFailure(failure, language));
  }
  
  /**
   * Converte o objeto de detalhes de um SimpleFailure para o formato esperado em RichFailureType
   * 
   * @param details Objeto de detalhes do SimpleFailure
   * @returns Objeto de detalhes no formato esperado pelo RichFailureType
   */
  private static convertDetailsToRecord(details: Record<string, any>): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    
    // Itera sobre as propriedades do objeto de detalhes
    for (const [key, value] of Object.entries(details)) {
      // Ignora propriedades complexas como objetos e arrays
      if (typeof value === 'string' || typeof value === 'number') {
        result[key] = value;
      } else if (value !== null && value !== undefined) {
        // Converte outros tipos para string
        result[key] = String(value);
      }
    }
    
    return result;
  }
}