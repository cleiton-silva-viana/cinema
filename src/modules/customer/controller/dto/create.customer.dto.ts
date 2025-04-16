import { IsString, IsEmail, Length, IsDate } from "class-validator";

export class CreateCustomerDTO {
  @IsString()
  @Length(3, 24)
  public readonly name: string;

  @IsEmail()
  public readonly email: string;

  @IsDate()
  public readonly birthDate: Date;
}
