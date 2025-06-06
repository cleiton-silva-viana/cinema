import { faker } from '@faker-js/faker/.'
import {
  analyzeFailureTemplate,
  extractTemplateVariables,
  generateCodeConstant,
  generateFailureCodes,
} from './generate.failure.types'
import { FailureTemplate } from '@/shared/failure/failure.template.type'

function generateTemplate(template?: { pt: string; en: string }) {
  return {
    title: {
      pt: faker.lorem.lines(1),
      en: faker.lorem.lines(1),
    },
    template: template || {
      pt: faker.lorem.lines(1),
      en: faker.lorem.lines(1),
    },
    status: 400,
  }
}

describe('extractTemplateVariables', () => {
  it('deve retornar um array contendo todas as variáveis contídas no template', () => {
    // Arrange
    const fieldName = 'field'
    const fieldType = 'string'
    const field = `${fieldName}:${fieldType}`
    const template = `Este campo '{${field}}' deve ser recuperado pelo array.`

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].field).toBe(fieldName)
    expect(result[0].type).toBe(fieldType)
  })

  it('deve retornar um valor do tipo string se o valor do field for desconhecido', () => {
    // Arrange
    const fieldName = 'property'
    const fieldType = 'property'
    const field = `${fieldName}:${fieldType}`
    const template = `Este é um template com uma {${field}} de tipo desconhecido`

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].field).toBe(fieldName)
    expect(result[0].type).toBe('string')
  })

  it('deve retornar um tipo string quando não for fornecido uma tipagem para a variável', () => {
    // Arrange
    const fieldName = 'property'
    const template = `A variável deste template deve ser do tipo string {${fieldName}}`

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].field).toBe(fieldName)
    expect(result[0].type).toBe('string')
  })

  it('deve retornar um array vazio se não houver qualquer variável no template', () => {
    // Arrange
    const template = 'sem valores para serem recuperados'

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(0)
  })

  it('deve retornar mais de uma propriedade corretamente', () => {
    // Arrange
    const field1 = { name: 'name', type: 'string[]' }
    const field3 = { name: 'max', type: 'number' }
    const field4 = { name: 'hour', type: 'boolean' }
    const template = `{${field1.name}:${field1.type}} - {${field3.name}:${field3.type}} - {${field4.name}:${field4.type}}`

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(3)
    expect(result.some((f) => f.field === field1.name && f.type === field1.type)).toBe(true)
    expect(result.some((f) => f.field === field3.name && f.type === field3.type)).toBe(true)
    expect(result.some((f) => f.field === field4.name && f.type === field4.type)).toBe(true)
  })

  it('deve retornar uma variável com múltiplos tipos', () => {
    // Arrange
    const fieldName = 'value'
    const fieldType1 = 'string'
    const fieldType2 = 'number'
    const variable = `${fieldName}:${fieldType1} | ${fieldType2}`
    const template = `${faker.lorem.lines(1)} {${variable}} ${faker.lorem.lines(1)}`

    // Act
    const result = extractTemplateVariables(template)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].field).toBe(fieldName)
    expect(result[0].type).toContain(fieldType1)
    expect(result[0].type).toContain(fieldType2)
  })
})

describe('analyzeFailureTemplate', () => {
  it('deve retornar um array contendo todos as variáveis contidas nos templates em pt e en', () => {
    // Arrange
    const min = 'min'
    const max = 'max'
    const resource = 'resource'
    const type = 'type'
    const count = 'count'

    const temp = generateTemplate({
      en: `This {${type}} must have length between {${min}} of {${max}}.`,
      pt: `Este {${resource}} deve ter {${count}} valores.`,
    })

    // Act
    const result = analyzeFailureTemplate(temp)

    // Assert
    expect(result).toHaveLength(5)
  })

  it('deve retornar os campos duplicados no template apenas 1 vez', () => {
    // Arrange
    const min = 'min'
    const max = 'max'
    const type = 'type'

    const temp = generateTemplate({
      en: `This {${type}} must have length between {${min}} of {${max}}.`,
      pt: `O {${type}} deve ter uma tamanho entre {${min}} e {${max}}.`,
    })

    // Act
    const result = analyzeFailureTemplate(temp)

    // Assert
    expect(result).toHaveLength(3)
  })

  it('deve retornar um array vazio se não houver variáveis no template', () => {
    // Arrange
    const template = generateTemplate()

    // Act
    const result = analyzeFailureTemplate(template)

    // Assert
    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })
})

describe('generateFailureCodes', () => {
  it('deve gerar os códigos de erro ordenamos corretamente', () => {
    // Arrange
    const failures: Record<string, FailureTemplate> = {
      A_FIRST: generateTemplate(),
      Z_LAST: generateTemplate(),
      B_SECOND: generateTemplate(),
      F_THIRD: generateTemplate(),
    }

    // Act
    const result = generateFailureCodes(failures)

    // Assert
    expect(result).toBeDefined()
    expect(result).toContain('A_FIRST')
    expect(result).toContain('F_THIRD')
    expect(result).toContain('Z_LAST')
    expect(result).toContain('B_SECOND')
    expect(result).toContain('FailureCode')
  })
})

describe('generateCodeConstant', () => {
  it('deve criar', () => {
    // Arrange
    const failures: Record<string, FailureTemplate> = {
      WITHOUT_VAR: generateTemplate({
        pt: 'Sem propriedade alguma',
        en: 'Without any property',
      }),
      WITH_ONE_VAR: generateTemplate({
        pt: 'Com uma {name}, property',
        en: 'With one {name} property',
      }),
      WITH_TWO_VAR: generateTemplate({
        pt: 'Com uma {name}, {property}',
        en: 'With one {name} {property}',
      }),
    }

    // Act
    const result = generateCodeConstant(failures)

    // Assert
    expect(result).toBeDefined()
  })
})
