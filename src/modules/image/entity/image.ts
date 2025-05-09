import { failure, Result, success } from "../../../shared/result/result";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { ImageUID } from "./value-object/image-uid.vo";
import { ImageTitle } from "./value-object/image-title";
import { ImageDescription } from "./value-object/image-description";
import { ImageSizes } from "./value-object/image-sizes";
import { Validate } from "../../../shared/validator/validate";
import { isNull } from "../../../shared/validator/validator";
import { TechnicalError } from "../../../shared/error/technical.error";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";

/**
 * Interface que define o conteúdo textual em um idioma específico.
 * Utilizada para armazenar textos multilíngues como títulos e descrições.
 *
 * @property language - Código do idioma (ex: "pt", "en")
 * @property text - Texto no idioma especificado
 */
export interface ItextContent {
  language: string;
  text: string;
}

/**
 * Interface que define os diferentes tamanhos de uma imagem.
 * Cada propriedade representa uma URL para uma versão da imagem em tamanho específico.
 *
 * @property small - URL da imagem em tamanho pequeno
 * @property normal - URL da imagem em tamanho normal/médio
 * @property large - URL da imagem em tamanho grande
 */
export interface ISizes {
  small: string;
  normal: string;
  large: string;
}

/**
 * Interface que define os parâmetros necessários para criar uma nova imagem.
 * Contém todos os dados obrigatórios para instanciar uma entidade Image válida.
 *
 * @property uid - Identificador único da imagem
 * @property title - Array de conteúdos textuais para o título em diferentes idiomas
 * @property description - Array de conteúdos textuais para a descrição em diferentes idiomas
 * @property sizes - Objeto contendo as URLs para os diferentes tamanhos da imagem
 */
export interface ICreateImageParams {
  uid: string;
  title: ItextContent[];
  description: ItextContent[];
  sizes: ISizes;
}

/**
 * Interface que define os parâmetros para hidratação de uma imagem.
 * Utilizada principalmente para reconstruir objetos a partir de dados persistidos.
 *
 * @property uid - Identificador único da imagem
 * @property title - Conteúdo textual do título em um idioma específico
 * @property description - Conteúdo textual da descrição em um idioma específico
 * @property sizes - Objeto contendo as URLs para os diferentes tamanhos da imagem
 */
export interface IHydrateImageParams {
  uid: string;
  title: ItextContent;
  description: ItextContent;
  sizes: ISizes;
}

/**
 * Interface que define os parâmetros para atualização de uma imagem.
 * Todos os campos são opcionais, permitindo atualização parcial dos metadados.
 *
 * @property title - Array de conteúdos textuais para o título em diferentes idiomas
 * @property description - Array de conteúdos textuais para a descrição em diferentes idiomas
 * @property sizes - Objeto contendo as URLs para os diferentes tamanhos da imagem
 */
export interface IUpdateImageParams {
  title?: ItextContent[];
  description?: ItextContent[];
  sizes?: ISizes;
}

/**
 * Representa os metadados de uma imagem processada no sistema de cinema.
 *
 * Esta classe implementa o padrão de Value Object para garantir a imutabilidade
 * e encapsular as regras de validação específicas para imagens. Uma imagem é
 * caracterizada por seu identificador único, título e descrição multilíngues,
 * e URLs para diferentes tamanhos da imagem processada.
 *
 * A classe é imutável. Qualquer atualização resulta em uma nova instância.
 */
export class Image {
  /**
   * Construtor privado para garantir que instâncias sejam criadas apenas
   * através dos métodos estáticos `create` e `hydrate`.
   *
   * @param uid - Identificador único da imagem
   * @param title - Título da imagem em múltiplos idiomas
   * @param description - Descrição da imagem em múltiplos idiomas
   * @param sizes - URLs para os diferentes tamanhos da imagem
   */
  private constructor(
    public readonly uid: ImageUID,
    public readonly title: ImageTitle,
    public readonly description: ImageDescription,
    public readonly sizes: ImageSizes,
  ) {}

  /**
   * Cria uma nova instância de Image com validação completa.
   *
   * Este método valida todos os dados de entrada e retorna um Result que pode
   * conter a nova instância de Image ou um conjunto de falhas de validação.
   *
   * Possíveis falhas incluem:
   * - UID inválido (formato incorreto)
   * - Título inválido (formato, idiomas obrigatórios, comprimento)
   * - Descrição inválida (formato, idiomas obrigatórios, comprimento)
   * - URLs de tamanhos inválidas (vazias ou ausentes)
   *
   * @param params - Parâmetros para criação da imagem
   * @returns Result<Image> - Um objeto Result contendo a nova instância de Image ou
   * um array de falhas (SimpleFailure) caso a validação falhe.
   */
  public static create(params: ICreateImageParams): Result<Image> {
    const failures: SimpleFailure[] = [];

    const uidResult = ImageUID.parse(params.uid);
    const titleResult = ImageTitle.create(params.title);
    const descriptionResult = ImageDescription.create(params.description);
    const sizesResult = ImageSizes.create(params.sizes);

    if (uidResult.invalid) failures.push(...uidResult.failures);
    if (titleResult.invalid) failures.push(...titleResult.failures);
    if (descriptionResult.invalid) failures.push(...descriptionResult.failures);
    if (sizesResult.invalid) failures.push(...sizesResult.failures);

    return failures.length > 0
      ? failure(failures)
      : success(
          new Image(
            uidResult.value,
            titleResult.value,
            descriptionResult.value,
            sizesResult.value,
          ),
        );
  }

  /**
   * Cria uma instância de Image a partir de dados já validados.
   *
   * Este método é utilizado principalmente para reconstruir objetos a partir
   * de dados persistidos, assumindo que já foram validados anteriormente.
   *
   * @param params - Parâmetros para hidratação da imagem
   * @returns Image - Uma nova instância de Image com os dados fornecidos
   * @throws TechnicalError com código MISSING_REQUIRED_DATA se params for nulo
   */
  public static hydrate(params: IHydrateImageParams): Image {
    TechnicalError.if(isNull(params), FailureCode.MISSING_REQUIRED_DATA, {
      field: "params",
    });

    return new Image(
      ImageUID.hydrate(params.uid),
      ImageTitle.hydrate(params.title.language, params.title.text),
      ImageDescription.hydrate(
        params.description.language,
        params.description.text,
      ),
      ImageSizes.hydrate(params.sizes),
    );
  }

  /**
   * Atualiza os metadados da imagem criando uma nova instância.
   *
   * Este método mantém a imutabilidade da classe, criando uma nova instância
   * com os dados atualizados em vez de modificar a instância atual.
   *
   * Possíveis falhas incluem:
   * - Parâmetros nulos ou vazios
   * - Título inválido (formato, idiomas obrigatórios, comprimento)
   * - Descrição inválida (formato, idiomas obrigatórios, comprimento)
   * - URLs de tamanhos inválidas (vazias ou ausentes)
   *
   * @param params - Parâmetros para atualização da imagem
   * @returns Result<Image> - Um objeto Result contendo a instância atualizada de Image
   * ou um array de falhas (SimpleFailure) caso a validação falhe.
   */
  public update(params: IUpdateImageParams): Result<Image> {
    const failures: SimpleFailure[] = [];
    let title = this.title;
    let description = this.description;
    let sizes = this.sizes;

    Validate.object(params)
      .field("params")
      .failures(failures)
      .isRequired()
      .isNotEmpty()
      .guard(
        () =>
          params !== null &&
          (!!params.sizes || !!params.title || !!params.description),
      )
      .optionalProperty("title", () => {
        const result = ImageTitle.create(params.title);
        if (result.invalid) failures.push(...result.failures);
        if (!result.invalid) title = result.value;
      })
      .optionalProperty("description", () => {
        const result = ImageDescription.create(params.description);
        if (result.invalid) failures.push(...result.failures);
        if (!result.invalid) description = result.value;
      })
      .optionalProperty("sizes", () => {
        const result = ImageSizes.create(params.sizes);
        if (result.invalid) failures.push(...result.failures);
        if (!result.invalid) sizes = result.value;
      });

    return failures.length > 0
      ? failure(failures)
      : success(new Image(this.uid, title, description, sizes));
  }
}
