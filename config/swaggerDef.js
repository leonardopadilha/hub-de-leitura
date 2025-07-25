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
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Token de autenticação ausente ou inválido",
        content: {
          "application/json": {
            example: {
              message: "Não autorizado",
            },
          },
        },
      },
      ServerError: {
        description: "Erro interno do servidor",
        content: {
          "application/json": {
            example: {
              message: "Erro interno do servidor",
            },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Erro de autenticação",
          },
          error: {
            type: "string",
            example: "MISSING_TOKEN",
          },
          hint: {
            type: "string",
            example: "Inclua um token JWT no cabeçalho Authorization",
          },
        },
      },
    },
  },
},

  apis: ["./src/server.js", "./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
