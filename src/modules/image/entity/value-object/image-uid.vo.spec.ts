import { ImageUID } from "./image-uid.vo";
import { v4, v7 } from "uuid";

describe("ImageUID", () => {
  describe("generate", () => {
    it("deve criar uma instância de ImageUID quando um UID válido é fornecido", () => {
      // Arrange
      const uid = v4();

      // Act
      const result = ImageUID.generate(uid);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value.value).toBeDefined();
      expect(result.value.value).toContain(uid);
    });

    it("deve retornar falha quando um UID inválido é fornecido", () => {
      // Arrange
      const uids = [v7(), null, undefined, "   "];

      // Act
      uids.forEach((uid) => {
        const result = ImageUID.generate(uid);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toEqual([
          {
            code: "invalidUidProvided",
          },
        ]);
      });
    });
  });
});
