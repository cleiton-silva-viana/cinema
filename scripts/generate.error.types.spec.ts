import { extractTemplateVariables } from "@scripts/gererate.error.types";

describe("extractTemplateVariables", () => {
  it("deve retornar um array contendo todas as variáveis contída sno template", () => {
    // Arrange
    const fieldName = "field";
    const fieldType = "string";
    const field = `${fieldName}:${fieldType}`;
    const template = `Este campo '{${field}}' deve ser recuperado pelo array.`;

    // Act
    const result = extractTemplateVariables(template);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].field).toBe(fieldName);
    expect(result[0].type).toBe(fieldType);
  });

  it("deve retornar um valor do tipo any se o valor do field for desconhecido", () => {
    // Arrange
    const fieldName = "property";
    const fieldType = "property";
    const field = `${fieldName}:${fieldType}`;
    const template = `Este é um template com uma {${field}} de tipo desconhecido`;

    // Act
    const result = extractTemplateVariables(template);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].field).toBe(fieldName);
    expect(result[0].type).toBe("any");
  });

  it("deve retornar um tipo any quando não for fornecido uma tipagem para a variável", () => {
    // Arrange
    const fieldName = "property";
    const template = `A variável deste template deve ser do tipo any {${fieldName}}`;

    // Act
    const result = extractTemplateVariables(template);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].field).toBe(fieldName);
    expect(result[0].type).toBe("any");
  });

  it("deve retornar um array vazio se não houver qualquer variável no template", () => {
    // Arrange
    const template = "sem valores para serem recuperados";

    // Act
    const result = extractTemplateVariables(template);

    // Assert
    expect(result.length).toBe(0);
  });

  it("deve retornar mais de uma propriedade corretamente", () => {
    // Arrange
    const field1 = { name: "name", type: "string" };
    const field3 = { name: "max", type: "number" };
    const field4 = { name: "hour", type: "any" };
    const template = `{${field1.name}:${field1.type}} - {${field3.name}:${field3.type}} - {${field4.name}:${field4.type}}`;

    // Act
    const result = extractTemplateVariables(template);

    // Assert
    expect(result.length).toBe(3);
    expect(result.some((f) => (f) => field1.name && f === field1.type));
    expect(result.some((f) => (f) => field3.name && f === field3.type));
    expect(result.some((f) => (f) => field4.name && f === field4.type));
  });
});
