import * as fs from 'node:fs'
import * as path from 'node:path'
import {generateFailureScript} from './generate.failures.script'

describe('GenerateFailureScript', () => {
    const enumCodesOutputPath = path.join(process.cwd(), 'src', 'shared', 'failure', 'failure.codes.enum.ts')
    const failureCreatorOutputPath = path.join(process.cwd(), 'src', 'shared', 'failure', 'failure.factory.ts')

    const backupFiles = () => {
        if (fs.existsSync(enumCodesOutputPath)) {
            fs.copyFileSync(enumCodesOutputPath, `${enumCodesOutputPath}.bak`)
        }
        if (fs.existsSync(failureCreatorOutputPath)) {
            fs.copyFileSync(failureCreatorOutputPath, `${failureCreatorOutputPath}.bak`)
        }
    }

    const restoreFiles = () => {
        if (fs.existsSync(`${enumCodesOutputPath}.bak`)) {
            fs.copyFileSync(`${enumCodesOutputPath}.bak`, enumCodesOutputPath)
            fs.unlinkSync(`${enumCodesOutputPath}.bak`)
        } else if (fs.existsSync(enumCodesOutputPath)) {
            fs.unlinkSync(enumCodesOutputPath)
        }

        if (fs.existsSync(`${failureCreatorOutputPath}.bak`)) {
            fs.copyFileSync(`${failureCreatorOutputPath}.bak`, failureCreatorOutputPath)
            fs.unlinkSync(`${failureCreatorOutputPath}.bak`)
        } else if (fs.existsSync(failureCreatorOutputPath)) {
            fs.unlinkSync(failureCreatorOutputPath)
        }
    }

    beforeEach(() => {
        backupFiles()

        const enumCodesDir = path.dirname(enumCodesOutputPath)
        const failureCreatorDir = path.dirname(failureCreatorOutputPath)

        if (!fs.existsSync(enumCodesDir)) {
            fs.mkdirSync(enumCodesDir, {recursive: true})
        }

        if (!fs.existsSync(failureCreatorDir)) {
            fs.mkdirSync(failureCreatorDir, {recursive: true})
        }
    })

    afterEach(() => {
        restoreFiles()
    })

    it('deve gerar arquivos de erro sem lançar exceções', () => {
        expect(() => generateFailureScript()).not.toThrow()

        expect(fs.existsSync(enumCodesOutputPath)).toBe(true)
        expect(fs.existsSync(failureCreatorOutputPath)).toBe(true)

        const enumContent = fs.readFileSync(enumCodesOutputPath, 'utf-8')
        const factoryContent = fs.readFileSync(failureCreatorOutputPath, 'utf-8')

        expect(enumContent.length).toBeGreaterThan(0)
        expect(factoryContent.length).toBeGreaterThan(0)
    })
})
