import { SimpleFailure } from "../failure/simple.failure.type";
import { failure, Result, success } from "../result/result";
import { TechnicalError } from "../error/technical.error";
import { FailureCode } from "../failure/failure.codes.enum";
import { Validate } from "../validator/validate";

/**
 * Idiomas suportados pela aplicação
 */
export enum SupportedLanguage {
  PT = "pt",
  EN = "en",
}

/**
 * Interface para entrada de conteúdo multilíngue
 * Exemplo:
 * ```ts
 * { text: "Olá Mundo", language: "pt" }
 * ```
 */
export interface IMultilingualInput {
  text: string;
  language: string;
}

/**
 * Interface que define a estrutura de um conteúdo em um idioma específico
 * Exemplo:
 * ```ts
 * { text: "Hello World", language: SupportedLanguage.EN }
 * ```
 */
export interface ILanguageContent {
  text: string;
  language: SupportedLanguage;
}

/**
 * Classe abstrata para representar conteúdo multilíngue com validações rigorosas.
 * Garante que:
 * - O conteúdo não seja vazio
 * - Os idiomas sejam válidos (suportados)
 * - Não haja idiomas duplicados
 * - Os idiomas obrigatórios estejam sempre presentes
 * - O texto siga regras de formato e tamanho
 */
export abstract class MultilingualContent {
  /**
   * Configurações de validação que podem ser sobrescritas pelas classes derivadas
   */
  protected static readonly MIN_LENGTH: number = 1;
  protected static readonly MAX_LENGTH: number = 500;

  /**
   * Idiomas obrigatórios por padrão (ex: 'pt' e 'en')
   */
  protected static readonly REQUIRED_LANGUAGES: SupportedLanguage[] = [
    SupportedLanguage.PT,
    SupportedLanguage.EN,
  ];

  /**
   * Expressão regular para validar o formato do texto:
   * - Permite letras (incluindo acentos), números, espaços e alguns símbolos
   * - Não permite caracteres especiais como @, #, etc.
   */
  protected static readonly FORMAT_REGEX: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-._]+$/;

  protected constructor(
    protected readonly contents: Map<SupportedLanguage, string>,
  ) {}

  /**
   * Cria uma instância válida de conteúdo multilíngue com validações completas.
   * @param contents Array de objetos com texto e idioma
   * @returns Result<T> com falha nos seguintes casos:
   * - `FailureCode.NULL_ARGUMENT`: Se o array for nulo
   * - `FailureCode.EMPTY_FIELD`: Se o array estiver vazio
   * - `FailureCode.CONTENT_INVALID_LANGUAGE`: Se o idioma não for suportado
   * - `FailureCode.INVALID_FIELD_SIZE`: Se o texto estiver fora do limite de caracteres (1–500)
   * - `FailureCode.CONTENT_INVALID_FORMAT`: Se o texto contiver caracteres inválidos
   * - `FailureCode.CONTENT_DUPLICATE_LANGUAGE`: Se houver idiomas duplicados
   * - `FailureCode.CONTENT_MISSING_REQUIRED_LANGUAGE`: Se faltar algum idioma obrigatório
   */
  public static create<T extends MultilingualContent>(
    contents: IMultilingualInput[],
  ): Result<T> {
    const failures: SimpleFailure[] = [];

    MultilingualContent.validateContentArray(contents, failures);
    if (failures.length > 0) return failure(failures);

    const contentsParsed: ILanguageContent[] = [];
    contents.forEach((content) => {
      contentsParsed.push(this.toLanguageContent(content, failures));
    });
    if (failures.length > 0) return failure(failures);

    this.validateContents(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    this.validateRequiredLanguages(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    const contentsMap = new Map<SupportedLanguage, string>();
    contentsParsed.forEach((content) => {
      contentsMap.set(content.language, content.text);
    });

    return success(new (this as any)(contentsMap));
  }

  /**
   * Cria uma nova instância de conteúdo com apenas um idioma.
   * Usado principalmente para reconstruir entidades a partir de dados persistentes.
   * @param lang Idioma do conteúdo
   * @param value Conteúdo textual
   * @returns Instância de conteúdo multilíngue
   * @throws TechnicalError se o idioma ou texto forem vazios
   * @throws TechnicalError se o idioma não for suportado
   */
  public static hydrate<T extends MultilingualContent>(
    lang: string,
    value: string,
  ): T {
    const fields: string[] = [];

    if (!lang) fields.push("language");
    if (!value) fields.push("value");

    TechnicalError.if(fields.length > 0, FailureCode.MISSING_REQUIRED_DATA, {
      fields: fields,
    });

    const langEnum = this.toSupportedLanguage(lang);
    TechnicalError.if(!langEnum, FailureCode.INVALID_ENUM_VALUE);

    const contentMap = new Map<SupportedLanguage, string>();
    contentMap.set(langEnum, value);

    return new (this as any)(contentMap);
  }

  /**
   * Obtém o conteúdo em um idioma específico
   * @param language Idioma a ser buscado
   * @returns Texto correspondente ou undefined se não existir
   */
  public content(language: SupportedLanguage): string | undefined {
    return this.contents.get(language);
  }

  /**
   * Verifica se possui conteúdo em um idioma específico
   * @param language Idioma a ser verificado
   * @returns true se o idioma existir, false caso contrário
   */
  public hasLanguage(language: SupportedLanguage): boolean {
    return this.contents.has(language);
  }

  /**
   * Obtém todos os idiomas disponíveis
   * @returns Array de idiomas presentes na instância atual
   */
  public languages(): SupportedLanguage[] {
    return Array.from(this.contents.keys());
  }

  /**
   * Converte uma string para o enum SupportedLanguage (case-insensitive).
   * Exemplo: "PT" → SupportedLanguage.PT
   * @param language Idioma a ser convertido
   * @returns O enum SupportedLanguage correspondente ou undefined se inválido
   */
  private static toSupportedLanguage(language: string): SupportedLanguage {
    if (typeof language === "string") {
      return Object.values(SupportedLanguage).find(
        (lang) => lang === language.toLowerCase(),
      );
    }
  }

  /**
   * Converte um MultilingualInput para LanguageContent
   * @param content Conteúdo a ser convertido
   * @param failures Array para armazenar os erros encontrados
   * @returns LanguageContent válido ou undefined se inválido
   */
  private static toLanguageContent(
    content: IMultilingualInput,
    failures: SimpleFailure[],
  ): ILanguageContent | undefined {
    const languageEnum = MultilingualContent.toSupportedLanguage(
      content.language,
    );
    if (!languageEnum) {
      failures.push({
        code: FailureCode.CONTENT_WITH_INVALID_LANGUAGE,
        details: {
          language: content.language,
        },
      });
      return;
    }
    return {
      language: languageEnum,
      text: content.text,
    };
  }

  /**
   * Valida os inputs básicos do conteúdo
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContentArray(
    contents: any[],
    failures: SimpleFailure[],
  ): void {
    Validate.array({ contents }, failures).isRequired().isNotEmpty();
  }

  /**
   * Valida um conteúdo individual quanto a:
   * - Não ser nulo
   * - Ter texto e idioma válidos
   * - Estar dentro do comprimento permitido (MIN_LENGTH - MAX_LENGTH)
   * - Seguir o formato permitido (expressão regular)
   * @param content Conteúdo a ser validado
   * @param failures Array para armazenar os erros encontrados
   * @returns true se válido, false se inválido
   */
  private static validateContent(
    content: ILanguageContent,
    failures: SimpleFailure[],
  ): boolean {
    const flag = failures.length;

    Validate.object({ content }, failures)
      .isRequired()
      .isNotEmpty()
      .hasProperty("text")
      .hasProperty("language");

    if (flag > failures.length) return false;

    Validate.string({ text: content.text }, failures)
      .isRequired()
      .isNotEmpty()
      .hasLengthBetween(this.MIN_LENGTH, this.MAX_LENGTH)
      .matchesPattern(this.FORMAT_REGEX);

    Validate.string({ language: content.language }, failures)
      .isRequired()
      .isNotEmpty()
      .isInEnum(SupportedLanguage);

    return failures.length === flag;
  }

  /**
   * Valida todos os conteúdos no array e verifica duplicatas de idioma.
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContents(
    contents: ILanguageContent[],
    failures: SimpleFailure[],
  ): void {
    const seenLanguages = new Set<SupportedLanguage>();

    for (const content of contents) {
      const isInvalid = !this.validateContent(content, failures);
      if (isInvalid) continue;

      if (seenLanguages.has(content.language)) {
        failures.push({
          code: FailureCode.TEXT_DUPLICATED_FOR_LANGUAGE,
          details: { language: content.language },
        });
        continue;
      }

      seenLanguages.add(content.language);
    }
  }

  /**
   * Valida se todos os idiomas obrigatórios estão presentes.
   * Por padrão, exige: 'pt' e 'en'
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateRequiredLanguages(
    contents: ILanguageContent[],
    failures: SimpleFailure[],
  ): void {
    const languages = new Set(contents.map((content) => content.language));

    for (const requiredLang of this.REQUIRED_LANGUAGES) {
      if (!languages.has(requiredLang)) {
        failures.push({
          code: FailureCode.TEXT_LANGUAGE_REQUIRED,
          details: {
            language: requiredLang,
          },
        });
      }
    }
  }
}
