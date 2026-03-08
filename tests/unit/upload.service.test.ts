import { describe, expect, it } from "vitest";
import { validateUploadPayload } from "../../src/modules/chapter/upload.service";

describe("upload payload validation", () => {
  it("accepts valid cbr/cbz payload", () => {
    expect(() => validateUploadPayload("chapter.cbz", 1024)).not.toThrow();
    expect(() => validateUploadPayload("chapter.cbr", 1024)).not.toThrow();
  });

  it("rejects invalid extension", () => {
    expect(() => validateUploadPayload("chapter.zip", 1024)).toThrow(/Formato no soportado/i);
  });

  it("rejects empty file", () => {
    expect(() => validateUploadPayload("chapter.cbz", 0)).toThrow(/vacio/i);
  });
});