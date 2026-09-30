export class AppError extends Error {
    statusCode: number;
    detalhes?: unknown;

    constructor(statusCode: number, message: string, detalhes?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.detalhes = detalhes;
    }
}