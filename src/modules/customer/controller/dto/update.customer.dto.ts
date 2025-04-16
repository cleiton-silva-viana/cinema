import { IsString, IsDateString, IsOptional, Length, IsEmail } from "class-validator";

export class UpdateCustomerDTO {
  @IsOptional()
  @IsString()
  @Length(3, 24)
  public readonly name?: string;

  @IsOptional()
  @IsDateString()
  public readonly birthDate?: Date;

  @IsOptional()
  @IsEmail()
  public readonly email?: string;
}