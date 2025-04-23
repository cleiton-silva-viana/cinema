import { faker } from "@faker-js/faker/locale/pt_PT";
import { Image, textContent, Sizes } from "./image";
import { ImageUID } from "./value-object/image-uid.vo";
import { SupportedLanguage } from "../../../shared/value-object/multilingual-content";

describe("Image", () => {
  const validTitleContents: textContent[] = [
    { language: "pt", text: "Título de teste em português" },
    { language: "en", text: "Test title in English" }
  ];
  const validDescriptionContents: textContent[] = [
    { language: "pt", text: "Descrição de teste com tamanho válido em português" },
    { language: "en", text: "Test description with valid length in English" }
  ];
  const sizes: Sizes = {
    small: faker.internet.url(),
    normal: faker.internet.url(),
    large: faker.internet.url()
  };

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar uma imagem válida", () => {
        // Act
        const result = Image.create(validTitleContents, validDescriptionContents, sizes);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.uid).toBeDefined();
        expect(result.value.title).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.sizes).toBeDefined();
        expect(result.value.sizes.small).toBe(sizes.small);
        expect(result.value.sizes.normal).toBe(sizes.normal);
        expect(result.value.sizes.large).toBe(sizes.large);
      });

     [
        {
          titleContents: [],
          description: "título inválido",
          expectedFailures: 1
        },
        {
          descriptionContents: null,
          description: "descrição inválida",
          expectedFailures: 1
        },
        {
          sizes: {
            small: "not-a-valid-url",
            normal: sizes.normal,
            large: sizes.large
          },
          description: "URL inválida",
          expectedFailures: 1
        },
        {
          titleContents: null,
          descriptionContents: undefined,
          description: "título e descrição inválido",
          expectedFailures: 2
        },
        {
          titleContents: [],
          descriptionContents: [],
          sizes: {
            small: "not-a-valid-url",
            normal: sizes.normal,
            large: sizes.large
          },
          description: "todos os campos inválidos",
          expectedFailures: 3
        }
      ].forEach((test) => {
        it(`deve retornar falha para ${test.description}`, () => {
          // Arrange
          const titleContents = 'titleContents' in test ? test.titleContents : validTitleContents;
          const descriptionContents = 'descriptionContents' in test ? test.descriptionContents : validDescriptionContents;
          const sizeForTest = 'sizes' in test ? test.sizes : sizes;

          // Act
          const result = Image.create(titleContents, descriptionContents, sizeForTest);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures).toHaveLength(test.expectedFailures);
        });
      });
    });

    describe("hydrate", () => {
      const titleContent = { language: 'pt', text: "Título de teste" };
      const descriptionContent = { language: 'pt', text: "Descrição de teste com tamanho válido" };

      it("deve restaurar uma imagem com os dados fornecidos", () => {
        // Arrange
        const imageUid = ImageUID.create();

        // Act
        const image = Image.hydrate(imageUid.value, titleContent, descriptionContent, sizes);

        // Assert
        expect(image.uid.value).toBe(imageUid.value);
        expect(image.title.content(SupportedLanguage.PT)).toBe(titleContent.text);
        expect(image.description.content(SupportedLanguage.PT)).toBe(descriptionContent.text);
        expect(image.sizes.small).toBe(sizes.small);
        expect(image.sizes.normal).toBe(sizes.normal);
        expect(image.sizes.large).toBe(sizes.large);
      });

      it("deve lançar erro técnico para valores nulos", () => {
        // Act & Assert
        expect(() =>
          Image.hydrate(null, titleContent, descriptionContent, sizes)
        ).toThrow();
      });
    });
  });
});