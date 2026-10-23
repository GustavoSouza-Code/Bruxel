import { AppError } from "../errors/AppError";
import { status_agendamento, tipo_servico } from "../generated/prisma/enums";
import {
    CreateAppointmentDTO,
    DadosCriacaoAtendimento,
    FiltrosAtendimento,
    ItemOsComPreco,
    ItemOsDTO,
    UpdateAppointmentOsDTO,
    UpdateAppointmentStatusDTO,
} from "../models/appointment";
import { UsuarioAutenticado } from "../models/user";
import { AppointmentsRepository } from "../repository/appointmentsRepository";
import { ProductsRepository } from "../repository/productsRepository";
import { UserRepository } from "../repository/userRepository";
import { ehUuid } from "../utils/validacoes";

const TIPOS_SERVICO = Object.values(tipo_servico) as readonly string[];
const STATUS_VALIDOS = Object.values(status_agendamento) as readonly string[];

// transições permitidas no andamento da OS
const TRANSICOES: Partial<Record<status_agendamento, status_agendamento[]>> = {
    AGUARDANDO: ["AGENDADO", "RECUSADO"],
    AGENDADO: ["EM_ANDAMENTO", "CANCELADO"],
    EM_ANDAMENTO: ["CONCLUIDO"],
};

const DESCRICAO_MIN = 10;
const DESCRICAO_MAX = 1000;
const MENSAGEM_CLIENTE_MIN = 10;
const MENSAGEM_CLIENTE_MAX = 500;
const OBSERVACOES_MAX = 2000;
const FOTO_URL_MAX = 2000;
const MAXIMO_DE_ITENS = 100;

// limites das colunas de contato copiadas do pedido
const TAMANHOS = {
    telefone: 20,
    rua: 150,
    numero: 10,
    bairro: 80,
    cidade: 80,
    estado: 2,
    cep: 8,
} as const;

// camada service da Ordem de Serviço: valida o pedido, o andamento e a OS
export class AppointmentsService {
    private appointmentsRepository = new AppointmentsRepository();
    private productsRepository = new ProductsRepository();
    private userRepository = new UserRepository();

    // cliente abre a própria OS; o administrador pode escolher um cliente cadastrado
    async create(usuario: UsuarioAutenticado, dados: CreateAppointmentDTO) {
        const corpo = this.validarCorpo(dados);
        const cliente = await this.resolverCliente(usuario, corpo.usuario_id);
        const tipo = this.validarTipo(corpo.tipo);
        const descricao = this.validarDescricao(corpo.descricao);
        const dataHora = this.validarDataHora(corpo.data_hora);
        const tecnicoId = await this.validarTecnico(corpo.tecnico_id);

        if (tecnicoId) {
            const conflito = await this.appointmentsRepository.getConflitoDeHorario(tecnicoId, dataHora);
            if (conflito) {
                throw new AppError(409, "Esse técnico já tem um atendimento nesse horário.");
            }
        }

        const pedido: DadosCriacaoAtendimento = {
            usuario_id: cliente.id,
            aberto_na_loja: cliente.abertoNaLoja,
            tipo,
            descricao,
            data_hora: dataHora,
            tecnico_id: tecnicoId,
            foto_url: this.validarFotoUrl(corpo.foto_url),
            telefone: this.validarTextoOpcional(corpo.telefone, "telefone", "telefone", TAMANHOS.telefone),
            rua: this.validarTextoOpcional(corpo.rua, "rua", "rua", TAMANHOS.rua),
            numero: this.validarTextoOpcional(corpo.numero, "numero", "número", TAMANHOS.numero),
            bairro: this.validarTextoOpcional(corpo.bairro, "bairro", "bairro", TAMANHOS.bairro),
            cidade: this.validarTextoOpcional(corpo.cidade, "cidade", "cidade", TAMANHOS.cidade),
            estado: this.validarEstado(corpo.estado),
            cep: this.validarCep(corpo.cep),
        };

        return this.appointmentsRepository.create(pedido);
    }

    // admin vê todas as ordens; o cliente vê apenas as dele
    async getAll(usuario: UsuarioAutenticado, filtrosRecebidos: unknown) {
        const filtros = this.validarFiltros(filtrosRecebidos);

        return usuario.perfil === "ADMINISTRADOR"
            ? this.appointmentsRepository.getAll(filtros)
            : this.appointmentsRepository.getAllByUsuario(usuario.id, filtros);
    }

    // detalhe: o cliente só acessa a própria ordem
    async getById(usuario: UsuarioAutenticado, id: string) {
        const atendimento = await this.buscarPorId(id);

        if (usuario.perfil !== "ADMINISTRADOR" && atendimento.usuario_id !== usuario.id) {
            throw new AppError(403, "Não autorizado.");
        }

        return atendimento;
    }

    // confirma, inicia, recusa, cancela ou conclui o atendimento
    async updateStatus(id: string, dados: UpdateAppointmentStatusDTO) {
        const atendimento = await this.buscarPorId(id);
        const corpo = this.validarCorpo(dados);
        const novoStatus = this.validarStatus(corpo.status);

        const permitidos = TRANSICOES[atendimento.status] ?? [];
        if (!permitidos.includes(novoStatus)) {
            throw new AppError(
                409,
                `Não é possível mudar a ordem de "${atendimento.status}" para "${novoStatus}".`
            );
        }

        const mensagem =
            novoStatus === "RECUSADO" || novoStatus === "CANCELADO"
                ? this.validarMensagemCliente(corpo.mensagem_cliente)
                : undefined;

        // a conclusão baixa o estoque e muda o status na mesma transação
        if (novoStatus === "CONCLUIDO") {
            return this.appointmentsRepository.concluirComBaixaDeEstoque(atendimento.id);
        }

        return this.appointmentsRepository.updateStatus(atendimento.id, novoStatus, mensagem);
    }

    // observações, produtos e mão de obra preenchidos durante o atendimento
    async updateOs(id: string, dados: UpdateAppointmentOsDTO) {
        const atendimento = await this.buscarPorId(id);
        const corpo = this.validarCorpo(dados);

        const osEditavel =
            atendimento.status === "EM_ANDAMENTO" ||
            (atendimento.status === "CONCLUIDO" && atendimento.pago_em === null);

        if (!osEditavel) {
            throw new AppError(409, "A OS não pode mais ser alterada nessa situação.");
        }

        const temObservacoes = corpo.observacoes_tecnico !== undefined;
        const temValor = corpo.valor_mao_de_obra !== undefined;
        const temItens = corpo.itens !== undefined;

        if (!temObservacoes && !temValor && !temItens) {
            throw new AppError(400, "Informe ao menos um dado da OS para atualizar.");
        }

        // a baixa já foi feita na conclusão; trocar itens depois deixaria o estoque errado
        if (temItens && atendimento.status === "CONCLUIDO") {
            throw new AppError(409, "Os produtos da OS não podem ser alterados após a conclusão.");
        }

        const dadosOs: { observacoes_tecnico?: string | null; valor_mao_de_obra?: string | null } = {};

        if (temObservacoes) {
            dadosOs.observacoes_tecnico = this.validarObservacoes(corpo.observacoes_tecnico);
        }
        if (temValor) {
            dadosOs.valor_mao_de_obra = this.validarValorMaoDeObra(corpo.valor_mao_de_obra);
        }

        const itens = temItens ? await this.montarItens(corpo.itens) : undefined;

        return this.appointmentsRepository.updateOs(atendimento.id, dadosOs, itens);
    }

    // registra o pagamento de uma OS concluída
    async marcarPago(id: string) {
        const atendimento = await this.buscarPorId(id);

        if (atendimento.status !== "CONCLUIDO") {
            throw new AppError(409, "Só é possível registrar o pagamento de uma ordem concluída.");
        }
        if (atendimento.pago_em !== null) {
            throw new AppError(409, "O pagamento dessa ordem já foi registrado.");
        }

        return this.appointmentsRepository.marcarPago(atendimento.id);
    }

    private async buscarPorId(id: string) {
        if (!ehUuid(id)) {
            throw new AppError(404, "Ordem de serviço não encontrada.");
        }

        const atendimento = await this.appointmentsRepository.getById(id);
        if (!atendimento) {
            throw new AppError(404, "Ordem de serviço não encontrada.");
        }
        return atendimento;
    }

    private validarFiltros(filtros: unknown): FiltrosAtendimento {
        if (filtros === undefined || filtros === null) return {};
        if (typeof filtros !== "object" || Array.isArray(filtros)) {
            throw new AppError(400, "Filtros inválidos.");
        }

        const { status, tecnico_id } = filtros as Record<string, unknown>;
        const resultado: FiltrosAtendimento = {};

        if (status !== undefined && status !== "") {
            resultado.status = this.validarStatus(status);
        }
        if (tecnico_id !== undefined && tecnico_id !== "") {
            if (typeof tecnico_id !== "string" || !ehUuid(tecnico_id)) {
                throw this.erroCampo("tecnico_id", "Técnico inválido.");
            }
            resultado.tecnico_id = tecnico_id;
        }

        return resultado;
    }

    private validarCorpo<T extends object>(dados: T): T {
        if (dados === undefined || dados === null || typeof dados !== "object" || Array.isArray(dados)) {
            throw new AppError(400, "Dados inválidos.");
        }
        return dados;
    }

    private validarTipo(valor: unknown): tipo_servico {
        if (typeof valor !== "string" || !TIPOS_SERVICO.includes(valor)) {
            throw this.erroCampo("tipo", "Escolha um tipo de serviço válido.");
        }
        return valor as tipo_servico;
    }

    private validarDescricao(valor: unknown): string {
        if (typeof valor !== "string") {
            throw this.erroCampo("descricao", "Descreva o problema.");
        }

        const descricao = valor.trim();
        if (descricao.length < DESCRICAO_MIN) {
            throw this.erroCampo("descricao", `Descreva o problema com pelo menos ${DESCRICAO_MIN} caracteres.`);
        }
        if (descricao.length > DESCRICAO_MAX) {
            throw this.erroCampo("descricao", `A descrição pode ter até ${DESCRICAO_MAX} caracteres.`);
        }
        return descricao;
    }

    private validarDataHora(valor: unknown): Date {
        if (typeof valor !== "string" || valor.trim() === "") {
            throw this.erroCampo("data_hora", "Informe a data e o horário da visita.");
        }

        const dataHora = new Date(valor);
        if (Number.isNaN(dataHora.getTime())) {
            throw this.erroCampo("data_hora", "Data e horário inválidos.");
        }
        return dataHora;
    }

    // sem cliente informado, a OS fica para o usuário logado (fluxo antigo)
    private async resolverCliente(usuario: UsuarioAutenticado, valor: unknown) {
        if (valor === undefined || valor === null || valor === "") {
            return { id: usuario.id, abertoNaLoja: false };
        }

        if (usuario.perfil !== "ADMINISTRADOR") {
            throw new AppError(403, "Apenas administradores podem criar uma OS para outro cliente.");
        }
        if (typeof valor !== "string" || !ehUuid(valor)) {
            throw this.erroCampo("usuario_id", "Cliente inválido.");
        }

        const cliente = await this.userRepository.getById(valor);
        if (!cliente) {
            throw new AppError(404, "Cliente não encontrado.");
        }
        if (cliente.perfil !== "CLIENTE") {
            throw this.erroCampo("usuario_id", "Selecione um cliente cadastrado.");
        }

        return { id: cliente.id, abertoNaLoja: true };
    }

    private async validarTecnico(valor: unknown): Promise<string | null> {
        if (valor === undefined || valor === null || valor === "") return null;

        if (typeof valor !== "string" || !ehUuid(valor)) {
            throw this.erroCampo("tecnico_id", "Técnico inválido.");
        }

        const tecnico = await this.userRepository.getById(valor);
        if (!tecnico) {
            throw this.erroCampo("tecnico_id", "Técnico não encontrado.");
        }
        return tecnico.id;
    }

    private validarFotoUrl(valor: unknown): string | null {
        if (valor === undefined || valor === null || valor === "") return null;
        if (typeof valor !== "string") {
            throw this.erroCampo("foto_url", "A foto deve ser um link.");
        }

        const url = valor.trim();
        if (url.length > FOTO_URL_MAX) {
            throw this.erroCampo("foto_url", `O link da foto pode ter até ${FOTO_URL_MAX} caracteres.`);
        }
        return url === "" ? null : url;
    }

    private validarTextoOpcional(valor: unknown, campo: string, rotulo: string, maximo: number): string | null {
        if (valor === undefined || valor === null) return null;
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

    private validarEstado(valor: unknown): string | null {
        const estado = this.validarTextoOpcional(valor, "estado", "UF", TAMANHOS.estado);
        if (estado === null) return null;

        const uf = estado.toUpperCase();
        if (!/^[A-Z]{2}$/.test(uf)) {
            throw this.erroCampo("estado", "A UF deve ter 2 letras.");
        }
        return uf;
    }

    private validarCep(valor: unknown): string | null {
        if (valor === undefined || valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo("cep", "O CEP deve ser um texto.");
        }

        const cep = valor.replace(/\D/g, "");
        if (cep === "") return null;
        if (cep.length !== TAMANHOS.cep) {
            throw this.erroCampo("cep", "O CEP deve ter 8 dígitos.");
        }
        return cep;
    }

    private validarStatus(valor: unknown): status_agendamento {
        if (typeof valor !== "string" || !STATUS_VALIDOS.includes(valor)) {
            throw this.erroCampo("status", "Situação inválida.");
        }
        if (valor === "DISPONIVEL") {
            throw this.erroCampo("status", "Situação inválida.");
        }
        return valor as status_agendamento;
    }

    private validarMensagemCliente(valor: unknown): string {
        if (typeof valor !== "string") {
            throw this.erroCampo("mensagem_cliente", "Escreva a mensagem para o cliente.");
        }

        const mensagem = valor.trim();
        if (mensagem.length < MENSAGEM_CLIENTE_MIN) {
            throw this.erroCampo(
                "mensagem_cliente",
                `Escreva a mensagem para o cliente (pelo menos ${MENSAGEM_CLIENTE_MIN} caracteres).`
            );
        }
        if (mensagem.length > MENSAGEM_CLIENTE_MAX) {
            throw this.erroCampo("mensagem_cliente", `A mensagem pode ter até ${MENSAGEM_CLIENTE_MAX} caracteres.`);
        }
        return mensagem;
    }

    private validarObservacoes(valor: unknown): string | null {
        if (valor === null) return null;
        if (typeof valor !== "string") {
            throw this.erroCampo("observacoes_tecnico", "As observações devem ser um texto.");
        }

        const observacoes = valor.trim();
        if (observacoes.length > OBSERVACOES_MAX) {
            throw this.erroCampo("observacoes_tecnico", `As observações podem ter até ${OBSERVACOES_MAX} caracteres.`);
        }
        return observacoes === "" ? null : observacoes;
    }

    private validarValorMaoDeObra(valor: unknown): string | null {
        if (valor === null) return null;
        if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
            throw this.erroCampo("valor_mao_de_obra", "Informe um valor de mão de obra válido.");
        }
        if (valor > 99999999.99) {
            throw this.erroCampo("valor_mao_de_obra", "O valor da mão de obra é muito alto.");
        }
        return valor.toFixed(2);
    }

    private async montarItens(valor: unknown): Promise<ItemOsComPreco[]> {
        const itens = this.validarItens(valor);
        const produtos = await this.productsRepository.getByIds(itens.map((item) => item.produto_id));
        const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

        return itens.map((item) => {
            const produto = produtosPorId.get(item.produto_id);
            if (!produto) {
                throw new AppError(404, `Produto não encontrado: ${item.produto_id}.`);
            }
            if (!produto.ativo) {
                throw new AppError(409, `Produto indisponível: ${produto.nome}.`);
            }
            if (produto.estoque < item.quantidade) {
                throw new AppError(
                    409,
                    `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`
                );
            }

            return {
                produto_id: produto.id,
                quantidade: item.quantidade,
                preco_unitario: Number(produto.preco).toFixed(2),
            };
        });
    }

    private validarItens(valor: unknown): ItemOsDTO[] {
        if (!Array.isArray(valor)) {
            throw this.erroCampo("itens", "A lista de produtos da OS é inválida.");
        }
        if (valor.length > MAXIMO_DE_ITENS) {
            throw this.erroCampo("itens", "A OS tem produtos demais.");
        }

        const vistos = new Set<string>();

        return valor.map((item, indice) => {
            const numero = indice + 1;
            if (!item || typeof item !== "object") {
                throw this.erroCampo("itens", `Item ${numero} inválido.`);
            }

            const { produto_id, quantidade } = item as Record<string, unknown>;

            if (typeof produto_id !== "string" || !ehUuid(produto_id)) {
                throw this.erroCampo("itens", `Produto inválido no item ${numero}.`);
            }
            if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade < 1) {
                throw this.erroCampo("itens", `Quantidade inválida no item ${numero}.`);
            }
            if (vistos.has(produto_id)) {
                throw this.erroCampo("itens", "O mesmo produto foi informado mais de uma vez na OS.");
            }

            vistos.add(produto_id);
            return { produto_id, quantidade };
        });
    }

    private erroCampo(campo: string, mensagem: string): AppError {
        return new AppError(400, mensagem, [{ campo, mensagem }]);
    }
}
