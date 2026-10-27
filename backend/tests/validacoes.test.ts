// teste unitário das funções do arquivo "validacoes.ts", que compreendem E-mail e UUID.

import {describe, expect, it} from 'vitest';
import {ehUuid, ehEmail} from '../src/utils/validacoes';

// testes de e-mail
describe('testes email', () => {
    it('testa casos de e-mail válido', () => {
        const email_valido: string = 'teste@gmail.com';
        const resultado: boolean = ehEmail(email_valido);
        expect(resultado).toBe(true);

        const outro_valido: string = 'gabriel.wadenphul@universo.univates.br';
        const resultado_outro: boolean = ehEmail(outro_valido);
        expect(resultado_outro).toBe(true);
    });

    it('recusa e-mail com string vazia', () => {
        const string_vazia: string = '';
        const resultado: boolean = ehEmail(string_vazia);
        expect(resultado).toBe(false);
    });

    it('recusa e-mail sem domínio', () => {
        const sem_dominio: string = 'gabriel.wadenphul@gmail'
        const resultado: boolean = ehEmail(sem_dominio);
        expect(resultado).toBe(false);
    });

    it('recusa e-mail sem @', () => {
        const sem_dominio: string = 'gabriel.wadenphulgmail.com'
        const resultado: boolean = ehEmail(sem_dominio);
        expect(resultado).toBe(false);
    });

    it('recusa espaços no e-mail', () => {
        const espacos: string = 'gabriel wadenphul@universo.univates.br'
        const resultado: boolean = ehEmail(espacos);
        expect(resultado).toBe(false);

    });
});

//testes de UUID
describe ('testes de UUID', () => {
    it('testa casos de UUID válido', () => {
        const uuid_valido: string = '3f2fa233-444b-4e87-a5c4-0277499c4be4';
        const resultado: boolean = ehUuid(uuid_valido);
        expect(resultado).toBe(true);

        const uuid_maiuscula: string = '3F2FA233-444B-4E87-A5C4-0277499C4bE4'
        const resultado_maiuscula: boolean = ehUuid(uuid_maiuscula);
        expect(resultado_maiuscula).toBe(true);
    });

    it('casos de UUID sem hífen', () => {
        const sem_hifen: string = '3f2fa233444b4e87a5c40277499c4be4'
        const resultado: boolean = ehUuid(sem_hifen);
        expect(resultado).toBe(false);
    });

    it('hífens no lugar errado', () => {
        const hifen_errado: string = '3f2fa2334-44b4-e87-a5c4-0277499c4be4'
        const resultado: boolean = ehUuid(hifen_errado)
        expect(resultado).toBe(false);
    });

    it('UUID menor do que o tamanho esperado', () => {
        const uuid_menor: string = '3f2fa233-444b-4e87-a5c4-0277499c4';
        const resultado: boolean = ehUuid(uuid_menor);
        expect(resultado).toBe(false);
    });

    it('UUID menor do que o tamanho esperado - começo', () => {
        const uuid_menor: string = 'fa233-444b-4e87-a5c4-0277499c4be4';
        const resultado: boolean = ehUuid(uuid_menor);
        expect(resultado).toBe(false);
    });

    it('string do UUID completamente vazia', () => {
        const string_vazia: string = '';
        const resultado: boolean = ehUuid(string_vazia);
        expect(resultado).toBe(false);
    });

    it('casos de caracteres fora do padrão hexadecimal', () => {
        const hexadecimal: string = '3f2fh233-444b-4g87-a5c4-0277499z4bi4'
        const resultado: boolean = ehUuid(hexadecimal);
        expect(resultado).toBe(false);
    });

});