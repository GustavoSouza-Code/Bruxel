import { UserRole, User, CreateUserDTO } from "../models/user";

export class UserService {

  async create (user: CreateUserDTO) {
        const name = user.name
        const email = user.email
        const password = user.password
        const cpf = user.cpf

        // Debug
        console.log("Dados Recebidos em userService.create:")

    
        // Validadores
        if (!name) {
            throw new Error("O nome é obrigatório")
            console.log("Nome não informado")
        }
    
        if (!email) {
            console.log("Email não informado")
            throw new Error("O email é obrigatório")
        }
    
        if (!password) {
            console.log("Senha não informado")
            throw new Error("A senha é obrigatória")
        }
    
        if (!cpf) {
            console.log("CPF não informado")
            throw new Error("O CPF é obrigatório")
        }

        // Debug
        console.log("Nome:", name)
        console.log("Email:", email)
        console.log("Senha:", password)
        console.log("CPF:", cpf)
    
        const newUser: User = {
            id:"1",
            name,
            email,
            password,
            cpf,
            role: UserRole.USER
        }
    
        console.log("Usuário criado com sucesso:", newUser)
        return newUser
    }

}
