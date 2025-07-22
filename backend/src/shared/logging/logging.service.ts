import { Logger } from '@nestjs/common'
import { ResourceTypesEnum } from '@shared/constant/resource.types'

export class LoggerService {
  private static readonly instances = new Map<string, LoggerService>()

  private readonly logger: Logger

  private constructor(private readonly context: ResourceTypesEnum) {
    this.logger = new Logger(context)
  }

  public static getInstance(resource: ResourceTypesEnum): LoggerService {
    if (!this.instances.has(resource)) {
      this.instances.set(resource, new LoggerService(resource))
    }
    return this.instances.get(resource)!
  }

  public info(template: string, context?: Record<string, unknown>): void {
    this.logger.log(this.formatMessage(template, context), this.context)
  }

  public warn(template: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.formatMessage(template, context), this.context)
  }

  public error(template: string, context?: Record<string, unknown>): void {
    this.logger.error(this.formatMessage(template, context), this.context)
  }

  private formatMessage(template: string, context?: Record<string, unknown>): string {
    if (!context) return template

    return Object.entries(context).reduce(
      (msg, [key, value]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    )
  }
}
