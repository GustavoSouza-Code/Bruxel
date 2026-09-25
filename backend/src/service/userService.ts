import { UserRole, User, CreateUserDTO, UpdateUserDTO } from "../models/user";
import { UserRepository } from "../repository/userRepository";

export class UserService {
  private userRepository = new UserRepository();

  async create(user: CreateUserDTO) {
    const name = user.name;
    const email = user.email;
    const password = user.password;

    // Debug
    console.log("Dados Recebidos em userService.create:");

    // Validadores
    if (!name) {
      console.log("Nome não informado");
      throw new Error("O nome é obrigatório");
    }

    if (!email) {
      console.log("Email não informado");
      throw new Error("O email é obrigatório");
    }

    if (!password) {
      console.log("Senha não informado");
      throw new Error("A senha é obrigatória");
    }

    // Debug
    console.log("Nome:", name);
    console.log("Email:", email);
    console.log("Senha:", password);

    // apenas para teste
    const newUser: User = {
      id: "1",
      name,
      email,
      password,
      role: UserRole.USER,
    };

    console.log("Usuário criado com sucesso:", newUser);

    await this.userRepository.create(newUser);
  }

  async getAll() {
    // Debug
    console.log("Busca de usuarios - GetAll");
    return await this.userRepository.getAll();
  }

  async getById(id: string) {
    console.log("Buscando usuário", id);
    return await this.userRepository.getById(id);
  }

  async update(id: string, data: UpdateUserDTO) {
    // Debug
    console.log("Atualizando usuario", id, data);
    return await this.userRepository.update(id, data);
  }

  async delete(id: string) {
    // Debug
    console.log("Deletando usuario", id);
    return await this.userRepository.delete(id);
  }
}
