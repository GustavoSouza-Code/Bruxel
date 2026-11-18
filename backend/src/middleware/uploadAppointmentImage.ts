import { APPOINTMENT_IMAGES_DIR } from "../config/uploads";
import { criarReceptorDeImagem } from "./uploadImage";

export const receberImagemAtendimento = criarReceptorDeImagem(APPOINTMENT_IMAGES_DIR);
