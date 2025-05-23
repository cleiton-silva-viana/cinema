import { faker } from "@faker-js/faker/locale/pt_PT";
import {
  ICreateImageParams,
  IHydrateImageParams,
  Image,
  ISizes,
  ItextContent,
  IUpdateImageParams,
} from "./image";
import { ImageUID } from "./value-object/image.uid";
import { SupportedLanguage } from "../../../shared/value-object/multilingual-content";
import { TechnicalError } from "../../../shared/error/technical.error";
import { SimpleFailure } from "../../../shared/failure/simple.failure.type";
import { validateAndCollect } from "../../../shared/validator/common.validators";

describe("Image", () => {
  const UID = ImageUID.create().value;
  const VALID_TITLE: ItextContent[] = [
    { language: "pt", text: "Título de teste em português" },
    { language: "en", text: "Test title in English" },
  ];
  const VALID_DESCRIPTION: ItextContent[] = [
    {
      language: "pt",
      text: "Descrição de teste com tamanho válido em português",
    },
    { language: "en", text: "Test description with valid length in English" },
  ];
  const SIZES: ISizes = {
    small: faker.internet.url(),
    normal: faker.internet.url(),
    large: faker.internet.url(),
  };

  describe("Static Methods", () => {
    describe("create", () => {
      let failures: SimpleFailure[];

      beforeEach(() => {
        failures = [];
      });

      const VALID_PARAMS: ICreateImageParams = {
        uid: UID,
        title: VALID_TITLE,
        description: VALID_DESCRIPTION,
        sizes: SIZES,
      };

      it("deve criar uma imagem válida", () => {
        // Act
        const result = validateAndCollect(Image.create(VALID_PARAMS), failures);

        // Assert
        expect(result).toBeDefined();
        expect(result.uid).toBeDefined();
        expect(result.title).toBeDefined();
        expect(result.description).toBeDefined();
        expect(result.sizes).toBeDefined();
        expect(result.sizes.small).toBe(SIZES.small);
        expect(result.sizes.normal).toBe(SIZES.normal);
        expect(result.sizes.large).toBe(SIZES.large);
      });

      describe("deve falhar ao tentar criar uma imagem com dados inválidos", () => {
        const failureCases = [
          {
            params: {
              title: [] as Array<any>,
            },
            description: "título inválido",
            expectedFailures: 1,
          },
          {
            params: {
              description: null as Array<any>,
            },
            description: "descrição inválida",
            expectedFailures: 1,
          },
          {
            params: {
              sizes: {
                small: "",
                normal: SIZES.normal,
                large: SIZES.large,
              },
            },
            description: "sizes inválidos",
            expectedFailures: 1,
          },
          {
            params: {
              title: null as Array<any>,
              description: undefined as Array<any>,
            },
            description: "título e descrição inválido",
            expectedFailures: 2,
          },
          {
            params: {
              title: [] as Array<any>,
              description: [] as Array<any>,
              sizes: {
                small: null as any,
                normal: SIZES.normal,
                large: SIZES.large,
              },
            },
            description: "todos os campos inválidos",
            expectedFailures: 3,
          },
        ];

        failureCases.forEach((test) => {
          it(`deve retornar falha para ${test.description}`, () => {
            // Arrange
            const params = {
              ...VALID_PARAMS,
              ...test.params,
            };

            // Act
            const result = validateAndCollect(Image.create(params), failures);

            // Assert
            expect(result).toBeNull();
            expect(failures).toHaveLength(test.expectedFailures);
          });
        });
      });
    });

    describe("hydrate", () => {
      const VALID_PARAMS: IHydrateImageParams = {
        uid: ImageUID.create().value,
        title: VALID_TITLE[0],
        description: VALID_DESCRIPTION[0],
        sizes: SIZES,
      };

      it("deve restaurar uma imagem com os dados fornecidos", () => {
        // Act
        const image = Image.hydrate(VALID_PARAMS);

        // Assert
        expect(image.uid.value).toBe(VALID_PARAMS.uid);
        expect(image.title.content(SupportedLanguage.PT)).toBe(
          VALID_PARAMS.title.text,
        );
        expect(image.description.content(SupportedLanguage.PT)).toBe(
          VALID_PARAMS.description.text,
        );
        expect(image.sizes.small).toBe(SIZES.small);
        expect(image.sizes.normal).toBe(SIZES.normal);
        expect(image.sizes.large).toBe(SIZES.large);
      });

      it("deve lançar erro técnico para valores nulos", () => {
        expect(() => Image.hydrate(null)).toThrow();
      });

      describe("deve lançar erro se alguma propriedade for um valor nulo", () => {
        const failureCases = [
          {
            scenario: "parâmetro uid é nulo",
            params: {
              uid: null as any,
            },
          },
          {
            scenario: "parâmetro título é nulo",
            params: {
              title: null as any,
            },
          },
          {
            scenario: "parâmetro description é nulo",
            params: {
              description: undefined as any,
            },
          },
          {
            scenario: "parâmetro sizes é nulo",
            params: {
              sizes: {} as any,
            },
          },
        ];

        failureCases.forEach((test) => {
          // Arrange
          const params: IHydrateImageParams = {
            ...VALID_PARAMS,
            ...test.params,
          };

          // Act & Assert
          expect(() => Image.hydrate(params)).toThrow(TechnicalError);
        });
      });
    });
  });

  describe("Instance Methods", () => {
    describe("update", () => {
      let instance: Image;
      let failures: SimpleFailure[];

      beforeEach(() => {
        failures = [];
        instance = Image.hydrate({
          uid: UID,
          title: VALID_TITLE[0],
          description: VALID_DESCRIPTION[0],
          sizes: SIZES,
        });
      });

      describe("deve atualizar corretamente as propriedades", () => {
        it("deve atualizar a propriedade title corretamente", () => {
          // Arrange
          const params: IUpdateImageParams = {
            title: [
              { language: "en", text: "updated title" },
              { language: "pt", text: "título atualizado" },
            ],
          };

          // Act
          const result = validateAndCollect(
            instance.update(params as IUpdateImageParams),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.uid.value).toBe(instance.uid.value);
          expect(result.description).toEqual(instance.description);
          expect(result.sizes).toEqual(instance.sizes);
          expect(result.title).not.toEqual(instance.title);
          expect(result.title.content(SupportedLanguage.EN)).toBe(
            params.title[0].text,
          );
          expect(result.title.content(SupportedLanguage.PT)).toBe(
            params.title[1].text,
          );
        });

        it("deve atualizar a propriedade description corretamente", () => {
          // Arrange
          const params: IUpdateImageParams = {
            description: [
              { language: "en", text: "updated description" },
              { language: "pt", text: "descrição atualizada" },
            ],
          };

          // Act
          const result = validateAndCollect(
            instance.update(params as IUpdateImageParams),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.uid.value).toBe(instance.uid.value);
          expect(result.title).toEqual(instance.title);
          expect(result.sizes).toEqual(instance.sizes);
          expect(result.description).not.toEqual(instance.description);
          expect(result.description.content(SupportedLanguage.EN)).toBe(
            params.description[0].text,
          );
          expect(result.description.content(SupportedLanguage.PT)).toBe(
            params.description[1].text,
          );
        });

        it("deve atualiza a propriedade size corretamente", () => {
          // Arrange
          const params: IUpdateImageParams = {
            sizes: {
              small: SIZES.large,
              large: SIZES.small,
              normal: SIZES.normal,
            },
          };

          // Act
          const result = validateAndCollect(
            instance.update(params as IUpdateImageParams),
            failures,
          );

          // Assert
          expect(result).toBeDefined();
          expect(result.uid.value).toBe(instance.uid.value);
          expect(result.title).toEqual(instance.title);
          expect(result.description).toEqual(instance.description);
          expect(result.sizes).not.toEqual(instance.sizes);
          expect(result.sizes.small).toEqual(params.sizes.small);
          expect(result.sizes.normal).toEqual(params.sizes.normal);
          expect(result.sizes.large).toEqual(params.sizes.large);
        });
      });

      describe("deve falhar ao tentar atualizar com dados inválidos", () => {
        const failureCases = [
          {
            scenario: "título é inválido",
            params: {
              title: [] as Array<any>,
            },
          },
          {
            scenario: "description é inválido",
            params: {
              description: [] as Array<any>,
            },
          },
          {
            scenario: "sizes é inválido",
            params: {
              sizes: {} as Array<any>,
            },
          },
        ];

        failureCases.forEach(({ scenario, params }) => {
          it(scenario, () => {
            // Act
            const result = validateAndCollect(
              instance.update(params as IUpdateImageParams),
              failures,
            );

            // Assert
            expect(result).toBeNull();
            expect(failures.length).toBeGreaterThan(0);
          });
        });
      });

      it("deve falhar ao não receber dados para atualização", () => {
        // Act
        const result = validateAndCollect(instance.update(null), failures);

        // Assert
        expect(result).toBeNull();
        expect(failures.length).toBe(1);
      });
    });
  });
});
