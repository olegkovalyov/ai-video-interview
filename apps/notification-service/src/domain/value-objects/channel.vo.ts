import { ValueObject } from "../base/base.value-object";

export const CHANNELS = ["email", "in_app", "webhook"] as const;
export type ChannelType = (typeof CHANNELS)[number];

interface ChannelProps {
  value: ChannelType;
}

export class Channel extends ValueObject<ChannelProps> {
  private constructor(props: ChannelProps) {
    super(props);
  }

  public static create(value: string): Channel {
    if (!CHANNELS.includes(value as ChannelType)) {
      throw new Error(
        `Invalid channel: ${value}. Must be one of: ${CHANNELS.join(", ")}`,
      );
    }
    return new Channel({ value: value as ChannelType });
  }

  public get value(): ChannelType {
    return this.props.value;
  }

  public isEmail(): boolean {
    return this.props.value === "email";
  }

  public isInApp(): boolean {
    return this.props.value === "in_app";
  }

  public isWebhook(): boolean {
    return this.props.value === "webhook";
  }

  public toString(): string {
    return this.props.value;
  }
}
