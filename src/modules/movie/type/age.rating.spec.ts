import { AgeRating, getAgeRating } from './age.rating'

describe('AgeRating', () => {
  describe('getAgeRating', () => {
    describe('deve retornar a classificação etária correta para diferentes idades', () => {
      const successCases = [
        {
          age: -1,
          expectedRating: AgeRating.L,
          scenario: 'classificação Livre para idades com valores negativos',
        },
        {
          age: 0,
          expectedRating: AgeRating.L,
          scenario: 'classificação Livre para idade 0',
        },
        {
          age: 9,
          expectedRating: AgeRating.L,
          scenario: 'classificação Livre para idade 9',
        },
        {
          age: 10,
          expectedRating: AgeRating.Ten,
          scenario: 'classificação 10 anos para idade 10',
        },
        {
          age: 11,
          expectedRating: AgeRating.Ten,
          scenario: 'classificação 10 anos para idade 11',
        },
        {
          age: 12,
          expectedRating: AgeRating.Twelve,
          scenario: 'classificação 12 anos para idade 12',
        },
        {
          age: 13,
          expectedRating: AgeRating.Twelve,
          scenario: 'classificação 12 anos para idade 13',
        },
        {
          age: 14,
          expectedRating: AgeRating.Fourteen,
          scenario: 'classificação 14 anos para idade 14',
        },
        {
          age: 15,
          expectedRating: AgeRating.Fourteen,
          scenario: 'classificação 14 anos para idade 15',
        },
        {
          age: 16,
          expectedRating: AgeRating.Sixteen,
          scenario: 'classificação 16 anos para idade 16',
        },
        {
          age: 17,
          expectedRating: AgeRating.Sixteen,
          scenario: 'classificação 16 anos para idade 17',
        },
        {
          age: 18,
          expectedRating: AgeRating.Eighteen,
          scenario: 'classificação 18 anos para idade 18',
        },
        {
          age: 19,
          expectedRating: AgeRating.Eighteen,
          scenario: 'classificação 18 para idades acima de 18',
        },
      ]

      successCases.forEach(({ age, expectedRating, scenario }) => {
        it(`deve retornar ${scenario}`, () => {
          // Act
          const result = getAgeRating(age)

          // Assert
          expect(result).toBe(expectedRating)
        })
      })
    })

    // O que retornar para um valor negativo?
    describe('deve lidar com casos especiais', () => {
      it('deve retornar L para idade negativa', () => {
        // Act
        const result = getAgeRating(-1)

        // Assert
        expect(result).toBe('L')
      })
    })
  })
})
