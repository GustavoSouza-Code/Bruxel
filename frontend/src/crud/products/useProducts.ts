import { useState } from "react";
import type { Product } from "../../types/product";
import { ALL_PRODUCTS } from "../../data/products";
import type { ProductFormData } from "./ProductForm/ProductForm";

/**
 * CRUD de produtos: guarda a lista e é o único lugar que a altera. As telas
 * só chamam essas funções. Parte de ALL_PRODUCTS e vive só na memória;
 * quando o backend for integrado, as chamadas à API entram aqui dentro sem
 * precisar mexer nas páginas.
 */
export function useProducts() {
  // a função inicial copia a lista, pra não alterar ALL_PRODUCTS (que a Loja também usa)
  const [products, setProducts] = useState<Product[]>(() => [...ALL_PRODUCTS]);

  function createProduct(data: ProductFormData) {
    const newProduct: Product = {
      ...data,
      // TODO: o id virá do backend; por enquanto usa a hora atual só pra ser único na sessão
      id: `produto-${Date.now()}`,
    };
    setProducts((current) => [...current, newProduct]);
  }

  // substitui os dados do produto, mantendo o id
  function updateProduct(id: string, data: ProductFormData) {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...data, id } : product))
    );
  }

  function deleteProduct(id: string) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  return { products, createProduct, updateProduct, deleteProduct };
}
