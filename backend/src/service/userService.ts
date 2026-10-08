import {CreateUserDTO, UpdateUserDTO} from "../models/user";
import {UserRepository} from "../repository/userRepository";
import {validarCamposObrigatorios, regraValidacao} from "../utils/validaObrigatorios";
import {AppError} from "../errors/AppError";

// array de regras
const regrasCriarUser: regraValidacao[] = [
    {campo: 'nome', mensagem: 'O nome é obrigatório. '},
    {campo: 'email', mensagem: 'O E-mail é obrigatório.'},
    {campo: 'senha', mensagem: 'A senha é obrigatória.'},
    {campo: 'cpf', mensagem: 'O CPF é obrigatório.'},
]

// camada service de usuários, com regras de negócio e validações necessárias

export class UserService {
    private userRepository = new UserRepository();

    async create(user: CreateUserDTO) {
        const validacao = validarCamposObrigatorios(user ?? {}, regrasCriarUser);

        if (validacao.length > 0) {
            console.log("VALIDAÇÃO:", JSON.stringify(validacao, null, 2));
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const dados: CreateUserDTO = {
            nome: String(user.nome).trim(),
            email: String(user.email).trim().toLowerCase(),
            senha: String(user.senha),
            cpf: String(user.cpf).replace(/\D/g, ""),
        };

        if (dados.cpf.length !== 11) {
            throw new AppError(400, "O CPF deve ter 11 dígitos.");
        }

        const cpfJaExiste = await this.userRepository.getByCPF(dados.cpf);
        if (cpfJaExiste) {
            throw new AppError(409, "Um usuário com esse CPF já existe.");
        }

        const emailJaExiste = await this.userRepository.getByEmail(dados.email);
        if (emailJaExiste) {
            throw new AppError(409, "Um usuário com esse E-mail já existe.");
        }

        return await this.userRepository.create(dados);
    }

    async getAll() {
        return await this.userRepository.getAll();
    }

    async getById(id: string) {
        const usuario = await this.userRepository.getById(id);
        if (!usuario) {
            throw new AppError(404, "Usuário não encontrado");
        }
        return usuario;
    }

    async update(id: string, data: UpdateUserDTO) {
        await this.getById(id);

        const permitidos = ["nome", "email", "senha", "telefone", "rua", "numero", "bairro", "cidade", "estado", "cep"] as const;
        const dados: Record<string, unknown> = {};
        for (const campo of permitidos) {
            const valor = (data as Record<string, unknown>)[campo];
            if (valor !== undefined) dados[campo] = valor;
        }
        if (typeof dados.email === "string") dados.email = dados.email.trim().toLowerCase();

        return await this.userRepository.update(id, dados as UpdateUserDTO);
    }

    async delete(id: string) {
        await this.getById(id);
        return await this.userRepository.delete(id);
    }
}
