// src/swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "DataGlimpse API",
      version: "1.0.0",
      description:
        "API docs for DataGlimpse backend — auth, otp, upload, AI endpoints, PDF drafts, visualizations, etc.",
    },
    servers: [
      { url: "http://localhost:5000", description: "Local (no /api prefix here)" },
      { url: "https://api.example.com", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: { type: "object", nullable: true },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        UploadResponse: {
          type: "object",
          properties: {
            datasetId: { type: "string" },
            message: { type: "string" },
          },
        },
        DatasetPreview: {
          type: "object",
          properties: {
            id: { type: "string" },
            fileName: { type: "string" },
            rowSample: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
            columns: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        PDFDraft: {
          type: "object",
          properties: {
            id: { type: "string" },
            vizId: { type: "string" },
            title: { type: "string" },
            content: { type: "object", additionalProperties: true },
            createdBy: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Visualization: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            config: { type: "object", additionalProperties: true },
            owner: { $ref: "#/components/schemas/User" },
            public: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AIHistoryItem: {
          type: "object",
          properties: {
            insightId: { type: "string" },
            vizId: { type: "string" },
            userId: { type: "string" },
            prompt: { type: "string" },
            content: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // scanned for JSDoc annotations
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app, path = "/docs") {
  app.use(path, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get("/docs.json", (req, res) => res.json(swaggerSpec));
}

export default swaggerSpec;
