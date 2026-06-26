import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ultra App API",
      version: "1.0.0",
      description: "Module 1 foundation endpoints",
    },
    servers: [{ url: "http://localhost:4000" }],
  },
  apis: ["./src/modules/**/*.ts"],
});
