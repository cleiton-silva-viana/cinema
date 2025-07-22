import * as path from 'node:path'
import * as fs from 'node:fs'
import * as process from 'node:process'
import { generateCodeConstant, generateFailureCodes } from './generate.failure.types'
import { FailureTemplate } from 'src/shared/failure/failure.template'
import { execSync } from 'node:child_process'

type ErrorMessages = Record<string, FailureTemplate>

export function generateFailureScript(): void {
  const failureMessagesPath = path.join(process.cwd(), 'src', 'i18n', 'failure.messages.json')
  const enumCodesOutputPath = path.join(process.cwd(), 'src', 'shared', 'failure', 'failure.codes.enum.ts')
  const failureCreatorOutputPath = path.join(process.cwd(), 'src', 'shared', 'failure', 'failure.factory.ts')

  console.log('Iniciando geração dos arquivos de erro...')

  try {
    const errorMessages = loadErrorMessages(failureMessagesPath)
    generateFailureCodeEnum(errorMessages, enumCodesOutputPath)
    generateFailureFactory(errorMessages, failureCreatorOutputPath)
    console.log('Geração dos arquivos de erro concluída com sucesso!')
  } catch (e) {
    console.error('Ocorreu um erro durante a geração dos arquivos de erro:', e)
    process.exit(1)
  }
}

function loadErrorMessages(filePath: string): ErrorMessages {
  console.log(`Lendo mensagens de erro de: ${filePath}`)
  const messagesContent = fs.readFileSync(filePath, 'utf-8')
  const errorMessages: ErrorMessages = JSON.parse(messagesContent)
  console.log(`${Object.keys(errorMessages).length} mensagens de erro carregadas.`)
  return errorMessages
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    console.log(`Diretório ${dirPath} não encontrado. Criando...`)
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Diretório ${dirPath} criado com sucesso!`)
  }
}

function writeFileAndFormat(filePath: string, content: string, description: string): void {
  const dirPath = path.dirname(filePath)
  ensureDirectoryExists(dirPath)

  fs.writeFileSync(filePath, content)
  console.log(`${description} gerado com sucesso em: ${filePath}`)

  console.log(`Executando o linter e formatação no arquivo: ${filePath}`)
  execSync('npm run format', { stdio: 'inherit' })
  console.log(`Linter e formatação executados com sucesso no arquivo: ${filePath}`)
}

function generateFailureCodeEnum(errorMessages: ErrorMessages, outputPath: string): void {
  console.log(`Gerando enum FailureCode para: ${outputPath}`)
  const content = generateFailureCodes(errorMessages)
  writeFileAndFormat(outputPath, content, 'Enum FailureCode')
}

function generateFailureFactory(errorMessages: ErrorMessages, outputPath: string): void {
  console.log(`Gerando constantes de criação de erro para: ${outputPath}`)
  const content = generateCodeConstant(errorMessages)
  writeFileAndFormat(outputPath, content, 'Constantes de criação de erro')
}

generateFailureScript()
