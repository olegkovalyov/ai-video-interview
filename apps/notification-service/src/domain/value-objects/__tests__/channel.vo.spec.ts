import { Channel } from "../channel.vo";

describe("Channel Value Object", () => {
  it("should create a valid email channel", () => {
    const channel = Channel.create("email");
    expect(channel.value).toBe("email");
    expect(channel.isEmail()).toBe(true);
    expect(channel.isInApp()).toBe(false);
    expect(channel.isWebhook()).toBe(false);
  });

  it("should create a valid in_app channel", () => {
    const channel = Channel.create("in_app");
    expect(channel.value).toBe("in_app");
    expect(channel.isInApp()).toBe(true);
  });

  it("should create a valid webhook channel", () => {
    const channel = Channel.create("webhook");
    expect(channel.value).toBe("webhook");
    expect(channel.isWebhook()).toBe(true);
  });

  it("should throw on invalid channel", () => {
    expect(() => Channel.create("sms")).toThrow(
      "Invalid channel: sms. Must be one of: email, in_app, webhook",
    );
  });

  it("should return string representation", () => {
    const channel = Channel.create("email");
    expect(channel.toString()).toBe("email");
  });
});
