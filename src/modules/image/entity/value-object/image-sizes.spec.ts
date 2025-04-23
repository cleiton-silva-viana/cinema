import { ImageSizes, codes } from "./image-sizes";
import { faker } from "@faker-js/faker";

describe("ImageSizes", () => {
  const sizes = {
    small: faker.internet.url(),
    normal: faker.internet.url(),
    large: faker.internet.url(),
  };

  describe("create", () => {
    it("deve retornar uma instância de ImageSizes com sucesso", () => {
      // Act
      const result = ImageSizes.create(sizes);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeInstanceOf(ImageSizes);
      expect(result.value.small).toBe(sizes.small);
      expect(result.value.normal).toBe(sizes.normal);
      expect(result.value.large).toBe(sizes.large);
    });

    describe("deve retornar um erro quando os tamanhos são inválidos", () => {
      const failureCases = [
        {
          sizes: null,
          scenario: "quando o objeto sizes é nulo",
          errorCode: codes.contentNullOrEmpty,
        },
        {
          sizes: {
            small: '        ',
            normal: sizes.normal,
            large: sizes.large,
          },
          scenario: "quando há uma URL vazia",
          errorCode: codes.contentNullOrEmpty,
        },
        {
          sizes: {
            small: sizes.small,
            normal: 'not-a-valid-url',
            large: sizes.large,
          },
          scenario: "quando há uma URL inválida",
          errorCode: codes.invalidUrl,
        },

        {
          sizes: {
            small: sizes.small,
            normal: sizes.normal,
            large: null,
          },
          scenario: "quando há uma URL nula",
          errorCode: codes.contentNullOrEmpty,
        },
      ];

      failureCases.forEach(({ sizes, scenario, errorCode }) => {
        it(`deve rejeitar tamanhos de imagem ${scenario}`, () => {
          // Act
          const result = ImageSizes.create(sizes);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(errorCode);
        });
      });
    });
  });

  describe("hydrate", () => {
    it("deve criar uma instância de ImageSizes diretamente", () => {
      // Act
      const result = ImageSizes.hydrate(sizes);

      // Assert
      expect(result).toBeInstanceOf(ImageSizes);
      expect(result.small).toBe(sizes.small);
      expect(result.normal).toBe(sizes.normal);
      expect(result.large).toBe(sizes.large);
    });
  });
});
