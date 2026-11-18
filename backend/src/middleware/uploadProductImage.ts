import { PRODUCT_IMAGES_DIR } from "../config/uploads";
import { criarReceptorDeImagem } from "./uploadImage";

// Mantém o nome usado pelas rotas de produtos.
export const receberImagemProduto = criarReceptorDeImagem(PRODUCT_IMAGES_DIR);
