import { faker } from '@faker-js/faker/locale/pt_PT'
import { ICreateImageParams, IHydrateImageParams, Image, ITextContent, IUpdateImageMetadataParams } from './image'
import { CreateTestImage, CreateTestImageParams } from '@test/builder/image.builder'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { CreateMultilingualTextContent, CreateTestTextContent } from '@test/builder/muiltilignual.content.builder'
import { v4 } from 'uuid'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { CreateTestSizes } from '@test/builder/sizes.builder'

describe('Image', () => {
  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar uma imagem válida', () => {
        // Arrange
        const params = CreateTestImageParams()

        // Act
        const result = Image.create(params)

        // Assert
        expect(result).toBeValidResultMatching<Image>((i) => {
          expect(i.uid).toBeDefined()
          expect(i.title.content(SupportedLanguageEnum.PT)).toBe(params.title[0].text)
          expect(i.title.content(SupportedLanguageEnum.EN)).toBe(params.title[1].text)
          expect(i.description.content(SupportedLanguageEnum.PT)).toBe(params.description[0].text)
          expect(i.description.content(SupportedLanguageEnum.EN)).toBe(params.description[1].text)
          expect(i.sizes.small).toBe(params.sizes.small)
          expect(i.sizes.normal).toBe(params.sizes.normal)
          expect(i.sizes.large).toBe(params.sizes.large)
        })
      })

      describe('deve falhar ao tentar criar uma imagem com dados inválidos', () => {
        const failureCases = [
          {
            params: {
              title: {},
            },
            description: 'título inválido',
            failureCount: 1,
          },
          {
            params: {
              description: null as unknown as Record<SupportedLanguageEnum, ITextContent>,
            },
            description: 'descrição inválida',
            failureCount: 1,
          },
          {
            params: {
              sizes: {
                small: '',
                normal: faker.image.url(),
                large: faker.image.url(),
              },
            },
            description: 'sizes inválidos',
            failureCount: 1,
          },
          {
            params: {
              title: null as unknown as Record<SupportedLanguageEnum, ITextContent>,
              description: undefined as unknown as Record<SupportedLanguageEnum, ITextContent>,
            },
            description: 'título e descrição inválido',
            failureCount: 2,
          },
          {
            params: {
              title: {},
              description: {},
              sizes: {
                small: null as unknown as string,
                normal: faker.image.url(),
                large: faker.image.url(),
              },
            },
            description: 'todos os campos inválidos',
            failureCount: 3,
          },
        ]

        failureCases.forEach(({ description, params, failureCount }) => {
          it(`deve retornar falha para ${description}`, () => {
            // Arrange
            const input: ICreateImageParams = {
              ...CreateTestImageParams(),
              ...(params as any),
            }

            // Act
            const result = Image.create(input)

            // Assert
            expect(result).toBeInvalidResultWithFailureCount(failureCount)
          })
        })
      })
    })

    describe('hydrate', () => {
      const validHydrateInput: IHydrateImageParams = {
        uid: v4(),
        sizes: CreateTestSizes(),
        title: CreateTestTextContent(),
        description: CreateTestTextContent(),
      }

      it('deve restaurar uma imagem com os dados fornecidos', () => {
        // Arrange
        const params: IHydrateImageParams = {
          uid: ImageUID.create().value,
          title: CreateTestTextContent({ language: SupportedLanguageEnum.PT }),
          description: CreateTestTextContent({ language: SupportedLanguageEnum.PT }),
          sizes: CreateTestSizes(),
        }

        // Act
        const image = Image.hydrate(params)

        // Assert
        expect(image.uid.value).toBe(params.uid)
        expect(image.title.content(SupportedLanguageEnum.PT)).toBe(params.title.text)
        expect(image.description.content(SupportedLanguageEnum.PT)).toBe(params.description.text)
        expect(image.sizes.small).toBe(params.sizes.small)
        expect(image.sizes.normal).toBe(params.sizes.normal)
        expect(image.sizes.large).toBe(params.sizes.large)
      })

      it('deve lançar erro técnico para valores nulos', () => {
        expect(() => Image.hydrate(null as any)).toThrow()
      })

      describe('deve lançar erro se alguma propriedade for um valor nulo', () => {
        const failureCases = [
          {
            scenario: 'parâmetro uid é nulo',
            params: {
              uid: null as any,
            },
          },
          {
            scenario: 'parâmetro título é nulo',
            params: {
              title: null as any,
            },
          },
          {
            scenario: 'parâmetro description é nulo',
            params: {
              description: undefined as any,
            },
          },
          {
            scenario: 'parâmetro sizes é nulo',
            params: {
              sizes: {} as any,
            },
          },
        ]

        failureCases.forEach(({ scenario, params }) => {
          it(scenario, () => {
            // Arrange
            const input: IHydrateImageParams = {
              ...validHydrateInput,
              ...params,
            }

            // Act & Assert
            expect(() => Image.hydrate(input)).toThrowTechnicalError()
          })
        })
      })
    })
  })

  describe('Instance Methods', () => {
    describe('update', () => {
      let instance: Image

      beforeEach(() => {
        instance = CreateTestImage()
      })

      describe('deve atualizar corretamente as propriedades', () => {
        it('deve atualizar a propriedade title corretamente', () => {
          // Arrange
          const params: IUpdateImageMetadataParams = {
            title: CreateMultilingualTextContent(),
          }

          // Act
          const result = instance.updateMetadata(params)

          // Assert
          expect(result).toBeValidResultMatching<Image>((i) => {
            expect(i.uid.value).toBe(instance.uid.value)
            expect(i.description).toEqual(instance.description)
            expect(i.sizes).toEqual(instance.sizes)
            expect(i.title).not.toEqual(instance.title)
            expect(i.title.content(SupportedLanguageEnum.PT)).toBe(params.title![0].text)
            expect(i.title.content(SupportedLanguageEnum.EN)).toBe(params.title![1].text)
            expect(i.title.content(SupportedLanguageEnum.PT)).not.toBe(instance.title.content(SupportedLanguageEnum.PT))
            expect(i.title.content(SupportedLanguageEnum.EN)).not.toBe(instance.title.content(SupportedLanguageEnum.EN))
          })
        })

        it('deve atualizar a propriedade description corretamente', () => {
          // Arrange
          const params: IUpdateImageMetadataParams = {
            description: CreateMultilingualTextContent(),
          }

          // Act
          const result = instance.updateMetadata(params)

          // Assert
          expect(result).toBeValidResultMatching<Image>((I) => {
            expect(I.uid.value).toBe(instance.uid.value)
            expect(I.title).toEqual(instance.title)
            expect(I.sizes).toEqual(instance.sizes)
            expect(I.description).not.toEqual(instance.description)
            expect(I.description.content(SupportedLanguageEnum.PT)).toBe(params.description![0].text)
            expect(I.description.content(SupportedLanguageEnum.EN)).toBe(params.description![1].text)
            expect(I.description.content(SupportedLanguageEnum.EN)).not.toBe(
              instance.description.content(SupportedLanguageEnum.EN)
            )
            expect(I.description.content(SupportedLanguageEnum.PT)).not.toBe(
              instance.description.content(SupportedLanguageEnum.PT)
            )
          })
        })

        it('deve atualizar as propriedades title e description corretamente', () => {})
      })

      describe('deve falhar ao tentar atualizar com dados inválidos', () => {
        const failureCases = [
          {
            scenario: 'título é inválido',
            params: {
              title: {},
            },
          },
          {
            scenario: 'description é inválido',
            params: {
              description: {},
            },
          },
        ]

        failureCases.forEach(({ scenario, params }) => {
          it(scenario, () => {
            // Act
            const result = instance.updateMetadata(params as unknown as IUpdateImageMetadataParams)

            // Assert
            expect(result).toBeInvalidResult()
          })
        })
      })

      it('deve falhar ao não receber dados para atualização', () => {
        // Act
        const result = instance.updateMetadata(null as any)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
      })
    })
  })
})
