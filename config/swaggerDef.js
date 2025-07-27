const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "📚 Hub de Leitura - API para QA",
      version: "1.0.0",
      description: "Sistema de biblioteca educacional para aprendizado de QA",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor Local",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtido através do login. IMPORTANTE: Cole apenas o hash do token (sem 'Bearer '). O Swagger adiciona automaticamente o prefixo 'Bearer '."
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Token de autenticação ausente ou inválido",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              examples: {
                token_missing: {
                  summary: "Token não fornecido",
                  value: {
                    message: "Token de acesso necessário",
                    error: "MISSING_TOKEN",
                    hint: "Faça login para obter um token e inclua no cabeçalho: Authorization: Bearer {token}"
                  }
                },
                token_expired: {
                  summary: "Token expirado",
                  value: {
                    message: "Token expirado",
                    error: "EXPIRED_TOKEN",
                    hint: "Faça login novamente para obter um novo token"
                  }
                },
                token_invalid: {
                  summary: "Token inválido",
                  value: {
                    message: "Token inválido",
                    error: "INVALID_TOKEN",
                    hint: "Verifique se o token está correto e no formato: Bearer {token}"
                  }
                }
              }
            },
          },
        },
        ForbiddenError: {
          description: "Acesso negado - Privilégios insuficientes",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              examples: {
                admin_required: {
                  summary: "Acesso de admin necessário",
                  value: {
                    message: "Acesso negado. Apenas administradores podem realizar esta ação.",
                    error: "ADMIN_REQUIRED",
                    userRole: "user",
                    requiredRole: "admin"
                  }
                },
                resource_access_denied: {
                  summary: "Acesso ao recurso negado",
                  value: {
                    message: "Acesso negado. Você só pode acessar seus próprios recursos.",
                    error: "RESOURCE_ACCESS_DENIED"
                  }
                }
              }
            },
          },
        },
        NotFoundError: {
          description: "Recurso não encontrado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              examples: {
                not_found: {
                  summary: "Recurso não encontrado",
                  value: {
                    message: "Recurso não encontrado.",
                    error: "NOT_FOUND"
                  }
                }
              }
            },
          },
        },
        ValidationError: {
          description: "Erro de validação dos dados",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              examples: {
                validation_failed: {
                  summary: "Dados inválidos",
                  value: {
                    message: "Dados fornecidos são inválidos.",
                    error: "VALIDATION_ERROR",
                    details: "Descrição específica do erro"
                  }
                }
              }
            },
          },
        },
        ServerError: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              },
              example: {
                message: "Erro interno do servidor",
                error: "INTERNAL_SERVER_ERROR",
                timestamp: "2024-01-15T10:30:00Z"
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          description: "Estrutura padrão de erro da API",
          properties: {
            message: {
              type: "string",
              description: "Mensagem de erro legível",
              example: "Erro de autenticação",
            },
            error: {
              type: "string",
              description: "Código do erro para tratamento programático",
              example: "MISSING_TOKEN",
            },
            hint: {
              type: "string",
              description: "Dica de como resolver o erro",
              example: "Inclua um token JWT no cabeçalho Authorization",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Timestamp do erro",
              example: "2024-01-15T10:30:00Z",
            },
            details: {
              type: "string",
              description: "Detalhes adicionais do erro",
              example: "Informações específicas sobre o erro",
            }
          },
          required: ["message"]
        },
        Book: {
          type: "object",
          description: "Livro do acervo da biblioteca",
          properties: {
            id: {
              type: "integer",
              description: "ID único do livro",
              example: 1,
            },
            title: {
              type: "string",
              description: "Título do livro",
              example: "Dom Casmurro",
              maxLength: 255,
            },
            author: {
              type: "string",
              description: "Autor do livro",
              example: "Machado de Assis",
              maxLength: 255,
            },
            description: {
              type: "string",
              description: "Descrição ou sinopse do livro",
              example: "Romance clássico da literatura brasileira",
              maxLength: 1000,
            },
            category: {
              type: "string",
              description: "Categoria do livro",
              example: "Literatura Brasileira",
              maxLength: 100,
            },
            isbn: {
              type: "string",
              description: "Código ISBN do livro",
              example: "978-85-260-1318-3",
              maxLength: 20,
            },
            editor: {
              type: "string",
              description: "Editora do livro",
              example: "Editora Companhia das Letras",
              maxLength: 255,
            },
            language: {
              type: "string",
              description: "Idioma do livro",
              example: "Português",
              default: "Português",
              maxLength: 50,
            },
            publication_year: {
              type: "integer",
              description: "Ano de publicação",
              example: 1899,
              minimum: 1000,
              maximum: 2030,
            },
            pages: {
              type: "integer",
              description: "Número de páginas",
              example: 256,
              minimum: 1,
            },
            format: {
              type: "string",
              enum: ["Físico", "Digital", "Audiobook"],
              description: "Formato do livro",
              example: "Físico",
              default: "Físico",
            },
            total_copies: {
              type: "integer",
              description: "Total de exemplares no acervo",
              example: 5,
              minimum: 0,
            },
            available_copies: {
              type: "integer",
              description: "Exemplares disponíveis para empréstimo",
              example: 3,
              minimum: 0,
            },
            cover_image: {
              type: "string",
              description: "Nome do arquivo da capa do livro",
              example: "dom-casmurro.jpg",
              maxLength: 255,
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Data de cadastro do livro",
              example: "2024-01-15T10:30:00Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Data da última atualização",
              example: "2024-01-20T15:45:00Z",
            },
            is_available: {
              type: "boolean",
              description: "Se o livro está disponível (calculated field)",
              example: true,
            }
          },
          required: ["id", "title", "author", "total_copies", "available_copies"]
        },
        BookCreateRequest: {
          type: "object",
          description: "Dados para criar um novo livro",
          properties: {
            title: {
              type: "string",
              description: "Título do livro",
              example: "O Cortiço",
              minLength: 1,
              maxLength: 255,
            },
            author: {
              type: "string",
              description: "Autor do livro",
              example: "Aluísio Azevedo",
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: "string",
              description: "Descrição do livro",
              example: "Romance naturalista brasileiro",
              maxLength: 1000,
            },
            category: {
              type: "string",
              description: "Categoria do livro",
              example: "Literatura Brasileira",
              minLength: 1,
              maxLength: 100,
            },
            isbn: {
              type: "string",
              description: "Código ISBN",
              example: "978-85-260-1320-6",
              maxLength: 20,
            },
            editor: {
              type: "string",
              description: "Editora",
              example: "Editora Ática",
              maxLength: 255,
            },
            language: {
              type: "string",
              description: "Idioma do livro",
              example: "Português",
              default: "Português",
              maxLength: 50,
            },
            publication_year: {
              type: "integer",
              description: "Ano de publicação",
              example: 1890,
              minimum: 1000,
              maximum: 2030,
            },
            pages: {
              type: "integer",
              description: "Número de páginas",
              example: 312,
              minimum: 1,
            },
            format: {
              type: "string",
              enum: ["Físico", "Digital", "Audiobook"],
              description: "Formato do livro",
              example: "Físico",
              default: "Físico",
            },
            total_copies: {
              type: "integer",
              description: "Total de exemplares",
              example: 4,
              minimum: 1,
            },
            available_copies: {
              type: "integer",
              description: "Exemplares disponíveis",
              example: 4,
              minimum: 0,
            },
            cover_image: {
              type: "string",
              description: "Nome do arquivo da capa",
              example: "o-cortico.jpg",
              maxLength: 255,
            }
          },
          required: ["title", "author", "category", "total_copies"]
        },
        PaginationInfo: {
          type: "object",
          description: "Informações de paginação",
          properties: {
            total: {
              type: "integer",
              description: "Total de itens",
              example: 25
            },
            showing: {
              type: "integer", 
              description: "Quantidade exibida nesta página",
              example: 10
            },
            currentPage: {
              type: "integer",
              description: "Página atual",
              example: 1
            },
            totalPages: {
              type: "integer", 
              description: "Total de páginas",
              example: 3
            },
            hasNext: {
              type: "boolean",
              description: "Se há próxima página",
              example: true
            },
            hasPrev: {
              type: "boolean",
              description: "Se há página anterior", 
              example: false
            },
            limit: {
              type: "integer",
              description: "Limite por página",
              example: 10
            },
            offset: {
              type: "integer",
              description: "Offset atual",
              example: 0
            }
          }
        },
        BooksListResponse: {
          type: "object",
          description: "Lista paginada de livros",
          properties: {
            books: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Book"
              }
            },
            pagination: {
              $ref: "#/components/schemas/PaginationInfo"
            },
            filters: {
              type: "object",
              description: "Filtros aplicados",
              properties: {
                search: {
                  type: "string",
                  example: "machado"
                },
                category: {
                  type: "string", 
                  example: "Literatura Brasileira"
                },
                author: {
                  type: "string",
                  example: "Machado de Assis"
                },
                available: {
                  type: "string",
                  example: "true"
                }
              }
            }
          }
        }
      },
    },
  },
  apis: ["./src/server.js", "./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;