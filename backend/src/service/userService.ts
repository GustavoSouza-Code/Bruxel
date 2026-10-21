import { CreateUserDTO, UpdateUserDTO } from "../models/user";
import { UserRepository } from "../repository/userRepository";
import { RegraValidacao, validarCamposObrigatorios } from "../utils/validaObrigatorios";
import { AppError } from "../errors/AppError";
import { ehUuid } from "../utils/validacoes";
import bcrypt from "bcrypt";

// campos obrigatórios do cadastro
const regrasCriarUser: RegraValidacao[] = [
    { campo: "nome", mensagem: "O nome é obrigatório." },
    { campo: "email", mensagem: "O E-mail é obrigatório." },
    { campo: "senha", mensagem: "A senha é obrigatória." },
    { campo: "cpf", mensagem: "O CPF é obrigatório." },
];

// só estes campos podem ser alterados pelo corpo da requisição (senhaAtual não é salva)
const camposAtualizaveis: (keyof UpdateUserDTO)[] = [
    "nome", "email", "senha", "telefone", "rua", "numero", "bairro", "cidade", "estado", "cep",
];

// camada service de usuários, com regras de negócio e validações necessárias
export class UserService {
    private userRepository = new UserRepository();

    // cadastro: normaliza os dados e impede CPF/e-mail duplicados
    async create(user: CreateUserDTO) {
        const validacao = validarCamposObrigatorios(user ?? {}, regrasCriarUser);
        if (validacao.length > 0) {
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

        return this.userRepository.create(dados);
    }

    // leitura de usuários
    async getAll() {
        return this.userRepository.getAll();
    }

    async getById(id: string) {
        // id fora do formato UUID faria o banco lançar erro (500); aqui já responde 404
        if (!ehUuid(id)) {
            throw new AppError(404, "Usuário não encontrado");
        }

        const usuario = await this.userRepository.getById(id);
        if (!usuario) {
            throw new AppError(404, "Usuário não encontrado");
        }
        return usuario;
    }

    // exigirSenhaAtual: true quando a pessoa altera a própria conta; o admin
    // redefinindo a senha de outro usuário não precisa saber a senha antiga
    async update(id: string, data: UpdateUserDTO, exigirSenhaAtual: boolean) {
        await this.getById(id);

        if (data.senha !== undefined) {
            if (typeof data.senha !== "string" || data.senha.trim() === "") {
                throw new AppError(400, "Informe uma senha válida.");
            }
            if (exigirSenhaAtual) {
                const hashAtual = await this.userRepository.getSenhaById(id);
                if (typeof data.senhaAtual !== "string" || !hashAtual || !(await bcrypt.compare(data.senhaAtual, hashAtual))) {
                    throw new AppError(400, "Senha atual incorreta.");
                }
            }
        }

        const dados: UpdateUserDTO = {};
        for (const campo of camposAtualizaveis) {
            if (data[campo] !== undefined) {
                Object.assign(dados, { [campo]: data[campo] });
            }
        }
        if (typeof dados.email === "string") {
            dados.email = dados.email.trim().toLowerCase();
        }

        return this.userRepository.update(id, dados);
    }

    // exclusão: confirma que o usuário existe antes de apagar
    async delete(id: string) {
        await this.getById(id);
        return this.userRepository.delete(id);
    }
}
