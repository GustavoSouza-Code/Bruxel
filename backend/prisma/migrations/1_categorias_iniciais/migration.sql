-- Categorias usadas pelo catálogo e pelo cadastro de produtos.
INSERT INTO categories (nome) VALUES
    ('Tratamento da água'),
    ('Limpeza da Piscina'),
    ('Filtração e circulação'),
    ('Acessórios & Lazer')
ON CONFLICT (nome) DO NOTHING;
