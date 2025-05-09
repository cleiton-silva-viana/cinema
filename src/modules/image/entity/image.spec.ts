import { faker } from "@faker-js/faker/locale/pt_PT";
import {
  ICreateImageParams,
  IHydrateImageParams,
  Image,
  ISizes,
  ItextContent,
  IUpdateImageParams,
} from "./image";
import { ImageUID } from "./value-object/image-uid.vo";
import { SupportedLanguage } from "../../../shared/value-object/multilingual-content";
import { TechnicalError } from "../../../shared/error/technical.error";

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
      const VALID_PARAMS: ICreateImageParams = {
        uid: UID,
        title: VALID_TITLE,
        description: VALID_DESCRIPTION,
        sizes: SIZES,
      };

      it("deve criar uma imagem válida", () => {
        // Act
        const result = Image.create(VALID_PARAMS);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.uid).toBeDefined();
        expect(result.value.title).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.sizes).toBeDefined();
        expect(result.value.sizes.small).toBe(SIZES.small);
        expect(result.value.sizes.normal).toBe(SIZES.normal);
        expect(result.value.sizes.large).toBe(SIZES.large);
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
            const result = Image.create(params);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures).toHaveLength(test.expectedFailures);
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
              title: null as Array<any>,
            },
          },
          {
            scenario: "parâmetro description é nulo",
            params: {
              description: undefined as Array<any>,
            },
          },
          {
            scenario: "parâmetro sizes é nulo",
            params: {
              sizes: {} as Array<any>,
            },
          },
        ];

        failureCases.forEach((test) => {
          // Arrange
          const params = { ...VALID_PARAMS, ...test.params };

          // Act & Assert
          expect(() => Image.hydrate(null)).toThrow(TechnicalError);
        });
      });
    });
  });

  describe("Instance Methods", () => {
    describe("update", () => {
      let instance: Image;

      beforeEach(() => {
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
          const result = instance.update(params as IUpdateImageParams);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.uid.value).toBe(instance.uid.value);
          expect(result.value.description).toEqual(instance.description);
          expect(result.value.sizes).toEqual(instance.sizes);
          expect(result.value.title).not.toEqual(instance.title);
          expect(result.value.title.content(SupportedLanguage.EN)).toBe(
            params.title[0].text,
          );
          expect(result.value.title.content(SupportedLanguage.PT)).toBe(
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
          const result = instance.update(params as IUpdateImageParams);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.uid.value).toBe(instance.uid.value);
          expect(result.value.title).toEqual(instance.title);
          expect(result.value.sizes).toEqual(instance.sizes);
          expect(result.value.description).not.toEqual(instance.description);
          expect(result.value.description.content(SupportedLanguage.EN)).toBe(
            params.description[0].text,
          );
          expect(result.value.description.content(SupportedLanguage.PT)).toBe(
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
          const result = instance.update(params as IUpdateImageParams);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.uid.value).toBe(instance.uid.value);
          expect(result.value.title).toEqual(instance.title);
          expect(result.value.description).toEqual(instance.description);
          expect(result.value.sizes).not.toEqual(instance.sizes);
          expect(result.value.sizes.small).toEqual(params.sizes.small);
          expect(result.value.sizes.normal).toEqual(params.sizes.normal);
          expect(result.value.sizes.large).toEqual(params.sizes.large);
        });
      });

      describe("deve falhar ao tentar atualizar com dados inválidos", () => {
        const failureCases = [
          {
            scenario: "títluo é inválido",
            params: {
              title: [] as Array<any>,
            },
          },
          {
            scenario: "description é inválido",
            params: {
              description: null as any,
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
            const result = instance.update(params as IUpdateImageParams);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBeGreaterThan(0);
          });
        });
      });

      it("deve falhar ao não receber dados para atualização", () => {
        // Act
        const result = instance.update(null);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures.length).toBe(1);
      });
    });
  });
});
