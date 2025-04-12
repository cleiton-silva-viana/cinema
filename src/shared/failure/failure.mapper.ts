import { HttpStatus } from "@nestjs/common";
import { SimpleFailure } from "./simple.failure.type";
import { RichFailureType } from "./rich.failure.type";
import { IFailureMessageProvider } from "./failure.message.provider.interface";
import { IFailureMapper } from "./failure.mapper.interface";
import { FailureMessageProvider } from "./failure.message.provider";

/**
 * Classe responsável por mapear SimpleFailure para RichFailureType,
 * utilizando as configurações definidas no arquivo failure.messages.json
 */
export class FailureMapper implements IFailureMapper{

  private static instance: FailureMapper | null = null;

  private constructor(
    private readonly messageProvider: IFailureMessageProvider = FailureMessageProvider.getInstance()
  ){}

  public static getInstance(): FailureMapper {
    if (FailureMapper.instance === null) 
      FailureMapper.instance = new FailureMapper()
    return FailureMapper.instance
  }
  
  /**
   * Reseta a instância do singleton (útil para testes)
   */
  public static reset(): void {
    FailureMapper.instance = null;
  }
  
  /**
   * Define um provedor de mensagens personalizado (útil para testes)
   */
  public static setMessageProvider(provider: IFailureMessageProvider): void {
    FailureMapper.reset();
    FailureMapper.instance = new FailureMapper(provider);
  }

  /**
   * Converte um objeto SimpleFailure em um objeto RichFailureType
   * 
   * @param failure O objeto SimpleFailure a ser convertido
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Um objeto RichFailureType com informações completas sobre o erro
   */
  public toRichFailure(failure: SimpleFailure, language: 'pt' | 'en' = 'pt'): RichFailureType {
    const messageConfig = this.messageProvider.getMessageConfig(failure.code);
    
    if (!messageConfig) {
      // Improved handling for unknown error codes
      const defaultMessages = {
        pt: `Erro não catalogado: ${failure.code}`,
        en: `Uncatalogued error: ${failure.code}`
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
    
    // Obtém a mensagem no idioma solicitado ou em inglês como fallback
    const title = messageConfig.message[language] || messageConfig.message.en;
    
    // Converte o status code numérico para o enum HttpStatus
    const status = messageConfig.statusCode as HttpStatus;
    
    // Cria o objeto RichFailureType
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
  public toRichFailures(failures: SimpleFailure[], language: 'pt' | 'en' = 'pt'): RichFailureType[] {
    return failures.map(failure => this.toRichFailure(failure, language));
  }

  /**
   * Converte o objeto de detalhes de um SimpleFailure para o formato esperado em RichFailureType
   *
   * @param details Objeto de detalhes do SimpleFailure
   * @returns Objeto de detalhes no formato esperado pelo RichFailureType
   */
  private convertDetailsToRecord(details: Record<string, any>): Record<string, string | number> {
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