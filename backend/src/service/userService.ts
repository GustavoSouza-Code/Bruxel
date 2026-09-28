import {CreateUserDTO, UpdateUserDTO} from "../models/user";
import {UserRepository} from "../repository/userRepository";
import {validarCamposObrigatorios, regraValidacao} from "../utils/validaObrigatorios";

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
        const nome = user.nome;
        const email = user.email;
        const senha = user.senha;
        const cpf = user.cpf

        const validacao = validarCamposObrigatorios(user, regrasCriarUser)

        if (validacao.length > 0) {
            throw new Error(JSON.stringify(validacao));
        }

        const cpfJaExiste = await this.userRepository.getByCPF(user.cpf);
        if(cpfJaExiste) {
            throw new Error("Um usuário com esse CPF já existe.")
        }

        const emailJaExiste = await this.userRepository.getByEmail(user.email);
        if(emailJaExiste) {
            throw new Error("Um usuário com esse E-mail já existe.")
        }

        const novoUsuario = await this.userRepository.create(user);
        return novoUsuario;
    }

    async getAll() {
        return await this.userRepository.getAll();
    }

    async getById(id: string) {
        const usuario = await this.userRepository.getById(id);
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }
        return usuario;
    }

    async update(id: string, data: UpdateUserDTO) {
        await this.getById(id);
        return await this.userRepository.update(id, data);
    }

    async delete(id: string) {
        await this.getById(id);
        return await this.userRepository.delete(id);
    }
}
