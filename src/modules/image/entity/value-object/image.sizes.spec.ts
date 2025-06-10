import { faker } from '@faker-js/faker'
import { ICreateImageSizesInput, ImageSizes } from './image.sizes'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@shared/error/technical.error'

describe('ImageSizes', () => {
  const sizes = {
    small: faker.internet.url(),
    normal: faker.internet.url(),
    large: faker.internet.url(),
  }

  describe('create', () => {
    it('deve retornar uma instância de ImageSizes com sucesso', () => {
      // Act
      const result = ImageSizes.create(sizes)

      // Assert
      expect(result).toBeValidResultMatching<ImageSizes>((i) => {
        expect(i.small).toBe(sizes.small)
        expect(i.normal).toBe(sizes.normal)
        expect(i.large).toBe(sizes.large)
      })
    })

    describe('deve retornar um erro quando os tamanhos são inválidos', () => {
      const failureCases = [
        {
          sizes: null,
          scenario: 'quando o objeto sizes é nulo',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          sizes: {
            small: '        ',
            normal: sizes.normal,
            large: sizes.large,
          },
          scenario: 'quando há uma URL vazia',
          code: FailureCode.STRING_CANNOT_BE_EMPTY,
        },

        {
          sizes: {
            small: sizes.small,
            normal: sizes.normal,
            large: null,
          },
          scenario: 'quando há uma URL nula',
          code: FailureCode.MISSING_REQUIRED_DATA,
        },
      ]

      failureCases.forEach(({ sizes, scenario, code }) => {
        it(`deve rejeitar tamanhos de imagem ${scenario}`, () => {
          // Act
          const result = ImageSizes.create(sizes as ICreateImageSizesInput)

          // Assert
          expect(result).toBeInvalidResultWithSingleFailure(code)
        })
      })
    })
  })

  describe('hydrate', () => {
    it('deve criar uma instância de ImageSizes diretamente', () => {
      // Act
      const result = ImageSizes.hydrate(sizes)

      // Assert
      expect(result).toBeInstanceOf(ImageSizes)
      expect(result.small).toBe(sizes.small)
      expect(result.normal).toBe(sizes.normal)
      expect(result.large).toBe(sizes.large)
    })

    it('deve lançar um erro quando o input for nullo', () => {
      expect(() => ImageSizes.hydrate(null as any)).toThrow(TechnicalError)
    })

    describe('deve retornar um erro quando os tamanhos são inválidos', () => {
      const failureCases = [
        {
          scenario: 'quando o tamanho "smal" é inválido',
          sizes: {
            small: null,
          },
        },
        {
          scenario: 'quando o tamanho "normal" é inválido',
          sizes: {
            normal: null,
          },
        },
        {
          scenario: 'quando o tamanho "large" é inválido',
          sizes: {
            large: null,
          },
        },
      ]
      failureCases.forEach(({ sizes, scenario }) => {
        it(`deve rejeitar tamanhos de imagem ${scenario}`, () => {
          // Arrange
          const s = {
            small: faker.internet.url(),
            normal: faker.internet.url(),
            large: faker.internet.url(),
            ...sizes,
          } as unknown as ICreateImageSizesInput

          // Act & Assert
          expect(() => ImageSizes.hydrate(s)).toThrow(TechnicalError)
        })
      })
    })
  })
})
