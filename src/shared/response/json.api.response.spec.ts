import { JsonApiResponse } from "./json.api.response";
import { SimpleFailure } from "../failure/simple.failure.type";
import { IFailureMapper } from "../failure/failure.mapper.interface";

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("JsonApiResponse", () => {
  const mockFailureMapper: IFailureMapper = {
    toRichFailures: jest.fn().mockImplementation((failures: SimpleFailure[]) => {
      return failures.map(failure => ({
        code: failure.code,
        status: 400,
        title: `Error: ${failure.code}`,
        details: failure.details || {}
      }));
    }),
    toRichFailure: jest.fn().mockImplementation((failure: SimpleFailure) => {
      return {
        code: failure.code,
        status: 400,
        title: `Error: ${failure.code}`,
        details: failure.details || {}
      };
    })
  };

  let response: JsonApiResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    response = new JsonApiResponse(mockFailureMapper);
  });

  describe("Construção básica", () => {
    it("deve criar uma resposta vazia com valores padrão", () => {
      // Act
      const json = response.toJSON();

      // Assert
      expect(json.jsonapi).toEqual({ version: "1.1" });
      expect(json.data).toBeNull();
      expect(json.errors).toBeUndefined();
      expect(json.included).toBeUndefined();
      expect(json.meta).toBeUndefined();
      expect(json.links).toBeUndefined();
    });

    it("deve definir o status HTTP corretamente", () => {
      const status = [ 200, 201, 500, 599]
      
      // Act
      status.forEach(s => {
        response.status(s);
        
        // Assert
        expect((response as any)._httpStatus).toBe(s);
      });
    });

    it("deve ignorar status HTTP inválidos", () => {
      // Arrange
      const status = [100, 199, 601, 700, 999 ]

      // Act
      status.forEach(s => {
        response.status(s); // Inválido

      // Assert
      expect(response.toJSON().status).not.toBe(s);
      })
    });
  });

  describe("data", () => {
    it("deve adicionar um recurso único como data", () => {
      // Arrange
      const resource = {
        id: "1",
        type: "users",
        attributes: { name: "John Doe" }
      };

      // Act
      response.data(resource);

      // Assert
      expect(response.toJSON().data).toEqual(resource);
    });

    it("deve ignorar recurso sem id", () => {
      // Arrange
      const resource = {
        id: "",
        type: "users"
      };

      // Act
      response.data(resource);

      // Assert
      expect(response.toJSON().data).toBeNull();
    });

    it("deve ignorar recurso sem type", () => {
      // Arrange
      const resource = {
        id: "1",
        type: ""
      };

      // Act
      response.data(resource);

      // Assert
      expect(response.toJSON().data).toBeNull();
    });
  });

  describe("datas", () => {
    it("deve adicionar múltiplos recursos como data", () => {
      // Arrange
      const resources = [
        { id: "1", type: "users", attributes: { name: "John" } },
        { id: "2", type: "users", attributes: { name: "Jane" } }
      ];

      // Act
      response.datas(resources);

      // Assert
      expect(response.toJSON().data).toEqual(resources);
    });

    it("deve ignorar recursos duplicados em datas", () => {
      // Arrange
      const resources = [
        { id: "1", type: "users", attributes: { name: "John" } },
        { id: "1", type: "users", attributes: { name: "Duplicate" } }
      ];

      // Act
      response.datas(resources);

      // Assert
      expect((response.toJSON().data as any[]).length).toBe(1);
      expect((response.toJSON().data as any[])[0].attributes.name).toBe("John");
    });

    it("deve ignorar recursos inválidos em datas", () => {
      // Arrange
      const resources = [
        { id: "1", type: "users" },
        { id: "", type: "users" }, // ID inválido
        { id: "3", type: "" }, // Type inválido
        { } as any // Totalmente inválido
      ];

      // Act
      response.datas(resources);

      // Assert
      expect((response.toJSON().data as any[]).length).toBe(1);
      expect((response.toJSON().data as any[])[0].id).toBe("1");
    });
  });

  describe("errors", () => {
    it("deve adicionar erros corretamente usando o mapper", () => {
      // Arrange
      const failure: SimpleFailure = { code: "ERR-001", details: { field: "name" } };

      // Act
      response.errors(failure);
      const json = response.toJSON();

      // Assert
      expect(mockFailureMapper.toRichFailures).toHaveBeenCalledWith([failure]);
      expect(json.errors.length).toBe(1);
      expect(json.errors[0].code).toBe("ERR-001");
      expect(json.errors[0].title).toBe("Error: ERR-001");
      expect(json.errors[0].meta).toEqual({ field: "name" });
    });

    it("deve adicionar múltiplos erros", () => {
      // Arrange
      const failures: SimpleFailure[] = [
        { code: "ERR-001", details: { field: "name" } },
        { code: "ERR-002", details: { field: "email" } }
      ];

      // Act
      response.errors(failures);
      const json = response.toJSON();

      // Assert
      expect(mockFailureMapper.toRichFailures).toHaveBeenCalledWith(failures);
      expect(json.errors.length).toBe(2);
      expect(json.errors[0].code).toBe("ERR-001");
      expect(json.errors[1].code).toBe("ERR-002");
    });

    it("não deve chamar o mapper quando failure é null", () => {
      // Act
      response.errors(null as any);
      
      // Assert
      expect(mockFailureMapper.toRichFailures).not.toHaveBeenCalled();
    });
  });

  describe("included", () => {
    it("deve adicionar recursos incluídos", () => {
      // Arrange
      const mainResource = { id: "1", type: "articles", attributes: { title: "Hello World" } };
      const includedResource = { id: "101", type: "authors", attributes: { name: "John Doe" } };

      // Act
      response
        .data(mainResource)
        .included(includedResource);
      const json = response.toJSON();

      // Assert
      expect(json.data).toEqual(mainResource);
      expect(json.included).toEqual([includedResource]);
    });

    it("não deve adicionar recursos incluídos duplicados", () => {
      // Arrange
      const mainResource = { id: "1", type: "articles" };
      const includedResource = { id: "101", type: "authors", attributes: { name: "John Doe" } };

      // Act
      response
        .data(mainResource)
        .included(includedResource)
        .included(includedResource);
      const json = response.toJSON();

      // Assert
      expect(json.included.length).toBe(1);
      expect(json.included[0]).toEqual(includedResource);
    });

    it("deve ignorar recursos incluídos inválidos", () => {
      // Arrange
      const mainResource = { id: "1", type: "articles" };
      const validResource = { id: "101", type: "authors" };
      const invalidResource1 = { id: "", type: "comments" }; // id inválido
      const invalidResource2 = { id: "102", type: "" }; // type inválido
      
      // Act
      response
        .data(mainResource)
        .included([validResource, invalidResource1, invalidResource2]);
      const json = response.toJSON();

      // Assert
      expect(json.included.length).toBe(1);
      expect(json.included[0]).toEqual(validResource);
    });
  });

  describe("Manipulação de metadados e links", () => {
    it("deve adicionar metadados", () => {
      // Arrange
      const metaData = { totalCount: 100, page: 1 };

      // Act
      response.meta(metaData);
      const json = response.toJSON()

      // Assert
      expect(json.meta).toEqual(metaData);
    });

    it("deve mesclar metadados quando chamado múltiplas vezes", () => {
      // Act
      response
        .meta({ count: 100 })
        .meta({ page: 1 });

      // Assert
      expect(response.toJSON().meta).toEqual({ count: 100, page: 1 });
    });

    it("deve ignorar metadados inválidos", () => {
      // Act
      response.meta(null as any);

      // Assert
      expect(response.toJSON().meta).toBeUndefined();
    });
  });

  describe('link', () => {
    it("deve adicionar links", () => {
      // Arrange
      const links = { self: "https://api.example.com/articles/1" };

      // Act
      response.links(links);
      const json = response.toJSON();

      // Assert
      expect(json.links).toEqual(links);
    });

    it("deve ignorar links inválidos", () => {
      // Act
      response.links(null as any);

      // Assert
      expect(response.toJSON().links).toBeUndefined();
    });
  })

  describe("Exclusividade entre data e errors", () => {
    it("deve priorizar errors sobre data na resposta final", () => {
      // Arrange
      const resource = { id: "1", type: "users" };
      const failure: SimpleFailure = { code: "ERR-001" };
      
      // Act
      response.data(resource).errors(failure);
      const json = response.toJSON();
      
      // Assert
      expect(json.errors).toBeDefined();
      expect(json.data).toBeUndefined();
    });

    it("deve impedir a adição de data quando errors já existe", () => {
      // Arrange
      const failure: SimpleFailure = { code: "ERR-001" };
      const resource = { id: "1", type: "users" };
      
      // Act
      response.errors(failure);
      response.datas(resource);
      
      // Assert
      expect((response as any)._data).toBeNull();
    });
  });
  
  describe("Serialização final", () => {
    it("deve omitir seções vazias na resposta final", () => {
      // Act
      const json = response.toJSON();

      // Assert
      expect(Object.keys(json)).toEqual(["jsonapi", "data"]);
    });

    it("deve incluir todas as seções não-vazias", () => {
      // Arrange
      const resource = { id: "1", type: "users" };
      const includedResource = { id: "2", type: "profiles" };
      const meta = { count: 1 };
      const links = { self: "https://api.example.com/users/1" };

      // Act
      response
        .data(resource)
        .included(includedResource)
        .meta(meta)
        .links(links);
      const json = response.toJSON();

      // Assert
      expect(Object.keys(json).sort()).toEqual(
        ["jsonapi", "data", "included", "meta", "links"].sort()
      );
    });
  });
});

