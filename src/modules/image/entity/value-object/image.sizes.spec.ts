import { faker } from '@faker-js/faker'
import { ICreateImageSizesInput, ImageSizes } from './image.sizes'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'
import { TechnicalError } from '@shared/error/technical.error'

describe('ImageSizes', () => {
  const sizes = {
    small: faker.internet.url(),
    normal: faker.internet.url(),
    large: faker.internet.url(),
  }

  describe('create', () => {
    let failures: SimpleFailure[]

    beforeEach(() => {
      failures = []
    })

    it('deve retornar uma instância de ImageSizes com sucesso', () => {
      // Act
      const result = validateAndCollect(ImageSizes.create(sizes), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result.small).toBe(sizes.small)
      expect(result.normal).toBe(sizes.normal)
      expect(result.large).toBe(sizes.large)
    })

    describe('deve retornar um erro quando os tamanhos são inválidos', () => {
      const failureCases = [
        {
          sizes: null,
          scenario: 'quando o objeto sizes é nulo',
          errorCode: FailureCode.MISSING_REQUIRED_DATA,
        },
        {
          sizes: {
            small: '        ',
            normal: sizes.normal,
            large: sizes.large,
          },
          scenario: 'quando há uma URL vazia',
          errorCode: FailureCode.STRING_CANNOT_BE_EMPTY,
        },

        {
          sizes: {
            small: sizes.small,
            normal: sizes.normal,
            large: null,
          },
          scenario: 'quando há uma URL nula',
          errorCode: FailureCode.MISSING_REQUIRED_DATA,
        },
      ]

      failureCases.forEach(({ sizes, scenario, errorCode }) => {
        it(`deve rejeitar tamanhos de imagem ${scenario}`, () => {
          // Act
          const result = validateAndCollect(ImageSizes.create(sizes as ICreateImageSizesInput), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(errorCode)
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
