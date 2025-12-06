import { ValueObject } from '../base/base.value-object';

export enum ResponseTypeEnum {
  TEXT = 'text',
  CODE = 'code',
  VIDEO = 'video',
}

export interface ResponseTypeProps {
  value: ResponseTypeEnum;
}

export class ResponseType extends ValueObject<ResponseTypeProps> {
  private constructor(props: ResponseTypeProps) {
    super(props);
  }

  get value(): ResponseTypeEnum {
    return this.props.value;
  }

  static create(value: string): ResponseType {
    if (!Object.values(ResponseTypeEnum).includes(value as ResponseTypeEnum)) {
      throw new Error(
        `Invalid response type: ${value}. Must be one of: ${Object.values(ResponseTypeEnum).join(', ')}`,
      );
    }

    return new ResponseType({ value: value as ResponseTypeEnum });
  }

  static text(): ResponseType {
    return new ResponseType({ value: ResponseTypeEnum.TEXT });
  }

  static code(): ResponseType {
    return new ResponseType({ value: ResponseTypeEnum.CODE });
  }

  static video(): ResponseType {
    return new ResponseType({ value: ResponseTypeEnum.VIDEO });
  }

  isText(): boolean {
    return this.value === ResponseTypeEnum.TEXT;
  }

  isCode(): boolean {
    return this.value === ResponseTypeEnum.CODE;
  }

  isVideo(): boolean {
    return this.value === ResponseTypeEnum.VIDEO;
  }

  toString(): string {
    return this.value;
  }
}
