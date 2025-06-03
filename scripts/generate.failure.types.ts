import { FailureTemplate } from '@shared/failure/failure.template.type'

type Failures = Record<string, FailureTemplate>
type TemplateVariable = { field: string; type: string }

/**
 * Extrai todas as variáveis de um template usando regex
 * @Example "O campo '{field:string}' deve ter entre {min:number} e {max:number}" -> [ {field: 'field', type: 'string'} ]
 * */
export function extractTemplateVariables(template: string): Array<TemplateVariable> {
  const regexp = /\{(\w+)(?::([\w\s|\[\]]+))?\}/g
  const variables: Array<{ field: string; type: string }> = []
  let match

  while ((match = regexp.exec(template)) !== null) {
    const field = match[1]
    let type = match[2] ? match[2].trim() : 'string'

    // Validate and normalize types
    const validTypes = ['string', 'number', 'boolean', 'Date', 'string[]', 'number[]', 'boolean[]', 'Date[]']
    const types = type.split('|').map((t) => t.trim())
    const filteredTypes = types.filter((t) => {
      return validTypes.includes(t)
    })

    type = filteredTypes.length > 0 ? filteredTypes.join(' | ') : 'string'

    if (!variables.some((v) => v.field === field)) {
      variables.push({ field, type })
    }
  }

  return variables
}

/**
 * Analisa um erro e retorna todas as variáveis necessárias
 * */
export function analyzeFailureTemplate(err: FailureTemplate): Array<TemplateVariable> {
  const ptVar = extractTemplateVariables(err.template.pt)
  const enVar = extractTemplateVariables(err.template.en)

  const uniqueVars = new Map<string, TemplateVariable>()

  ptVar.forEach((variable) => {
    uniqueVars.set(variable.field, variable)
  })

  enVar.forEach((variable) => {
    uniqueVars.set(variable.field, variable)
  })

  return Array.from(uniqueVars.values())
}

/**
 * Gera uma string de enum contendo todos os códigos de erro contídos no objeto passado por parâmetro
 * */
export function generateFailureCodes(failures: Failures): string {
  const codes = Object.keys(failures)
    .sort()
    .map((code) => `  ${code} = '${code}'`)
    .join(',\n')

  return `export enum FailureCode {\n${codes}\n}\n// Este arquivo é gerado automaticamente. NÃO EDITE MANUALMENTE!`
}

/**
 * Gera uma constante contendo as funções de criação de simpleFailure
 * */
export function generateCodeConstant(failures: Failures): string {
  const entries = Object.entries(failures)

  let codes: string = ''

  entries.forEach(([code, template]) => {
    const params = analyzeFailureTemplate(template)
    if (params.length === 0) {
      codes += `${code}: (): SimpleFailure => ({ 
        code: FailureCode.${code}, 
        details: {} 
      }),\n`
      return
    }

    let functionArguments: string = ''
    let detailsKey: string = ''
    params.forEach((p) => {
      const variable = `${p.field}: ${p.type}`
      functionArguments += functionArguments.length === 0 ? variable : `, ${variable}`
      detailsKey += detailsKey === '' ? p.field : `, ${p.field}`
    })

    codes += `${code}: (${functionArguments}): SimpleFailure => ({ 
      code: FailureCode.${code}, 
      details: { ${detailsKey} }
    }),\n`
  })

  return `
  import { FailureCode } from './failure.codes.enum'
  import { SimpleFailure } from './simple.failure.type'
  
  export const FailureFactory = {
    ${codes}
  }`
}
