import { CreateUserDTO, UpdateUserDTO } from "../models/user";
import { UserRepository } from "../repository/userRepository";
import { RegraValidacao, validarCamposObrigatorios } from "../utils/validaObrigatorios";
import { AppError } from "../errors/AppError";
import { ehEmail, ehUuid } from "../utils/validacoes";
import bcrypt from "bcrypt";

// campos obrigatórios do cadastro
const regrasCriarUser: RegraValidacao[] = [
    { campo: "nome", mensagem: "O nome é obrigatório." },
    { campo: "email", mensagem: "O E-mail é obrigatório." },
    { campo: "senha", mensagem: "A senha é obrigatória." },
    { campo: "cpf", mensagem: "O CPF é obrigatório." },
];

// tamanhos máximos das colunas usadas no cadastro e na atualização
const TAMANHOS = {
    nome: 150,
    email: 255,
    telefone: 20,
    rua: 150,
    numero: 10,
    bairro: 80,
    cidade: 80,
    estado: 2,
    cep: 8,
} as const;

// mínimo de caracteres para uma senha nova
const SENHA_MIN = 8;

// camada service de usuários, com regras de negócio e validações necessárias
export class UserService {
    private userRepository = new UserRepository();

    // cadastro: normaliza os dados e impede CPF/e-mail duplicados
    async create(user: CreateUserDTO) {
        const corpo = (user ?? {}) as CreateUserDTO;
        const validacao = validarCamposObrigatorios(corpo, regrasCriarUser);
        if (validacao.length > 0) {
            throw new AppError(400, "Dados inválidos.", validacao);
        }

        const dados: CreateUserDTO = {
            nome: this.validarTextoObrigatorio(corpo.nome, "nome", "nome", TAMANHOS.nome),
            email: this.validarEmail(corpo.email),
            senha: this.validarSenha(corpo.senha),
            cpf: this.validarCpf(corpo.cpf),
        };

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

        if (data !== undefined && data !== null && (typeof data !== "object" || Array.isArray(data))) {
            throw new AppError(400, "Dados inválidos.");
        }

        const corpo = (data ?? {}) as UpdateUserDTO;
        const dados: UpdateUserDTO = {};

        if (corpo.senha !== undefined) {
            dados.senha = this.validarSenha(corpo.senha);
            if (exigirSenhaAtual) {
                const hashAtual = await this.userRepository.getSenhaById(id);
                if (typeof corpo.senhaAtual !== "string" || !hashAtual || !(await bcrypt.compare(corpo.senhaAtual, hashAtual))) {
                    throw new AppError(400, "Senha atual incorreta.");
                }
            }
        }

        if (corpo.nome !== undefined) {
            dados.nome = this.validarTextoObrigatorio(corpo.nome, "nome", "nome", TAMANHOS.nome);
        }
        if (corpo.email !== undefined) {
            dados.email = this.validarEmail(corpo.email);
        }
        if (corpo.telefone !== undefined) {
            dados.telefone = this.validarTextoOpcional(corpo.telefone, "telefone", "telefone", TAMANHOS.telefone);
        }
        if (corpo.rua !== undefined) {
            dados.rua = this.validarTextoOpcional(corpo.rua, "rua", "rua", TAMANHOS.rua);
        }
        if (corpo.numero !== undefined) {
            dados.numero = this.validarTextoOpcional(corpo.numero, "numero", "número", TAMANHOS.numero);
        }
        if (corpo.bairro !== undefined) {
            dados.bairro = this.validarTextoOpcional(corpo.bairro, "bairro", "bairro", TAMANHOS.bairro);
        }
        if (corpo.cidade !== undefined) {
            dados.cidade = this.validarTextoOpcional(corpo.cidade, "cidade", "cidade", TAMANHOS.cidade);
        }
        if (corpo.estado !== undefined) {
            dados.estado = this.validarEstado(corpo.estado);
        }
        if (corpo.cep !== undefined) {
            dados.cep = this.validarCep(corpo.cep);
        }

        if (Object.keys(dados).length === 0) {
            throw new AppError(400, "Informe ao menos um campo para atualizar.");
        }

        return this.userRepository.update(id, dados);
    }

    // exclusão: bloqueia a própria conta e a saída do último administrador
    async delete(id: string, solicitanteId: string) {
        if (id === solicitanteId) {
            throw new AppError(400, "Você não pode excluir a própria conta.");
        }

        const usuario = await this.getById(id);

        if (usuario.perfil === "ADMINISTRADOR") {
            const totalAdmins = await this.userRepository.countAdmins();
            if (totalAdmins <= 1) {
                throw new AppError(409, "Não é possível excluir o último administrador.");
            }
        }

        return this.userRepository.delete(id);
    }

    private validarTextoObrigatorio(valor: unknown, campo: string, rotulo: string, maximo: number): string {
        if (typeof valor !== "string") {
            throw this.erroCampo(campo, `O campo ${rotulo} deve ser um texto.`);
        }

        const texto = valor.trim();
        if (texto === "") {
            throw this.erroCampo(campo, `O campo ${rotulo} é obrigatório.`);
        }
        if (texto.length > maximo) {
            throw this.erroCampo(campo, `O campo ${rotulo} deve ter no máximo ${maximo} caracteres.`);
        }
        return texto;
    }

    private validarTextoOpcional(valor: unknown, campo: string, rotulo: string, maximo: number): string | null {
        if (valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo(campo, `O campo ${rotulo} deve ser um texto.`);
        }

        const texto = valor.trim();
        if (texto === "") return null;
        if (texto.length > maximo) {
            throw this.erroCampo(campo, `O campo ${rotulo} deve ter no máximo ${maximo} caracteres.`);
        }
        return texto;
    }

    private validarEmail(valor: unknown): string {
        const email = this.validarTextoObrigatorio(valor, "email", "E-mail", TAMANHOS.email).toLowerCase();

        if (!ehEmail(email)) {
            throw this.erroCampo("email", "Informe um E-mail válido.");
        }
        return email;
    }

    private validarSenha(valor: unknown): string {
        if (typeof valor !== "string" || valor.trim() === "") {
            throw this.erroCampo("senha", "Informe uma senha válida.");
        }
        if (valor.length < SENHA_MIN) {
            throw this.erroCampo("senha", `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`);
        }
        return valor;
    }

    private validarCpf(valor: unknown): string {
        if (typeof valor !== "string") {
            throw this.erroCampo("cpf", "O CPF deve ser um texto.");
        }

        const cpf = valor.replace(/\D/g, "");
        if (cpf.length !== 11) {
            throw this.erroCampo("cpf", "O CPF deve ter 11 dígitos.");
        }
        return cpf;
    }

    private validarEstado(valor: unknown): string | null {
        if (valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo("estado", "A UF deve ser um texto.");
        }

        const estado = valor.trim().toUpperCase();
        if (estado === "") return null;
        if (!/^[A-Z]{2}$/.test(estado)) {
            throw this.erroCampo("estado", "A UF deve ter 2 letras.");
        }
        return estado;
    }

    private validarCep(valor: unknown): string | null {
        if (valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo("cep", "O CEP deve ser um texto.");
        }

        const texto = valor.trim();
        if (texto === "") return null;

        const cep = texto.replace(/\D/g, "");
        if (cep.length !== TAMANHOS.cep) {
            throw this.erroCampo("cep", "O CEP deve ter 8 dígitos.");
        }
        return cep;
    }

    private erroCampo(campo: string, mensagem: string): AppError {
        return new AppError(400, mensagem, [{ campo, mensagem }]);
    }
}
