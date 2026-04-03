import { IsString, IsNotEmpty, IsIn, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCheckoutDto {
  @ApiProperty({ enum: ["plus", "pro"], description: "Target plan type" })
  @IsString()
  @IsNotEmpty()
  @IsIn(["plus", "pro"])
  planType: string;

  @ApiProperty({
    description: "URL to redirect after successful checkout",
    required: false,
  })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiProperty({
    description: "URL to redirect after canceled checkout",
    required: false,
  })
  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

export class CancelSubscriptionDto {
  // Empty DTO — companyId comes from JWT
}
