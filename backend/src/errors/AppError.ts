// erro com status HTTP e detalhes opcionais, tratado no server
export class AppError extends Error {
    readonly statusCode: number;
    readonly detalhes?: unknown;

    constructor(statusCode: number, message: string, detalhes?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.detalhes = detalhes;
    }
}
