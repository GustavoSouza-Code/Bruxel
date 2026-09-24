import { UserRole, User, CreateUserDTO, UpdateUserDTO } from "../models/user";

export class UserService {
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

    const newUser: User = {
      id: "1",
      name,
      email,
      password,
      role: UserRole.USER,
    };

    console.log("Usuário criado com sucesso:", newUser);
    return newUser;
  }

  async getAll() {
    // Debug
    console.log("Busca de usuarios - GetAll");

    //return await this.userRepository.findAll();
  }
  async update(id: string, data: UpdateUserDTO) {
    // Debug
    console.log("Atualizando usuario", id, data);
  }

  async delete(id: string) {}
}
