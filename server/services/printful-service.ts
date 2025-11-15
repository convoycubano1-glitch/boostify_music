/**
 * Servicio para interactuar con la API de Printful
 * Gestiona productos del catálogo, productos sincronizados y órdenes
 */
import axios, { AxiosInstance } from 'axios';
import type {
  PrintfulProduct,
  PrintfulSyncProduct,
  PrintfulVariant,
  PrintfulCatalogProduct,
  PrintfulCatalogVariant,
  PrintfulOrder,
  CreatePrintfulOrder,
  PrintfulStoreInfo
} from '../types/printful';

export class PrintfulService {
  private api: AxiosInstance;

  constructor() {
    const apiToken = process.env.PRINTFUL_API_TOKEN;
    
    if (!apiToken) {
      console.error('⚠️ PRINTFUL_API_TOKEN no está configurado en las variables de entorno');
      throw new Error('PRINTFUL_API_TOKEN no está configurado');
    }

    console.log('✅ Printful Service inicializado correctamente');
    this.api = axios.create({
      baseURL: 'https://api.printful.com',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Obtiene información de la tienda
   */
  async getStoreInfo(): Promise<PrintfulStoreInfo> {
    const response = await this.api.get('/store');
    return response.data.result;
  }

  // ==================== CATALOG API ====================
  
  /**
   * Obtiene lista de productos del catálogo de Printful
   * @param category_id ID de categoría opcional para filtrar
   */
  async getCatalogProducts(category_id?: number): Promise<PrintfulCatalogProduct[]> {
    const params = category_id ? { category_id } : {};
    const response = await this.api.get('/products', { params });
    return response.data.result;
  }

  /**
   * Obtiene detalles de un producto del catálogo
   * @param productId ID del producto en el catálogo
   */
  async getCatalogProduct(productId: number): Promise<PrintfulCatalogProduct> {
    const response = await this.api.get(`/products/${productId}`);
    return response.data.result;
  }

  /**
   * Obtiene variantes disponibles de un producto del catálogo
   * @param productId ID del producto en el catálogo
   */
  async getCatalogVariants(productId: number): Promise<PrintfulCatalogVariant[]> {
    const response = await this.api.get(`/products/${productId}`);
    return response.data.result.variants || [];
  }

  /**
   * Obtiene detalles de una variante específica del catálogo
   * @param variantId ID de la variante
   */
  async getCatalogVariant(variantId: number): Promise<PrintfulCatalogVariant> {
    const response = await this.api.get(`/products/variant/${variantId}`);
    return response.data.result;
  }

  // ==================== SYNC PRODUCTS API ====================
  
  /**
   * Obtiene todos los productos sincronizados de la tienda
   */
  async getSyncProducts(): Promise<PrintfulSyncProduct[]> {
    const response = await this.api.get('/store/products');
    return response.data.result;
  }

  /**
   * Obtiene detalles de un producto sincronizado
   * @param syncProductId ID del producto sincronizado
   */
  async getSyncProduct(syncProductId: number): Promise<PrintfulSyncProduct> {
    const response = await this.api.get(`/store/products/${syncProductId}`);
    return response.data.result.sync_product;
  }

  /**
   * Obtiene variantes de un producto sincronizado
   * @param syncProductId ID del producto sincronizado
   */
  async getSyncVariants(syncProductId: number): Promise<PrintfulVariant[]> {
    const response = await this.api.get(`/store/products/${syncProductId}`);
    return response.data.result.sync_variants || [];
  }

  /**
   * Crea un nuevo producto sincronizado
   * @param productData Datos del producto a crear
   */
  async createSyncProduct(productData: {
    sync_product: {
      name: string;
      thumbnail?: string;
    };
    sync_variants: Array<{
      variant_id: number;
      retail_price: string;
      files: Array<{
        url: string;
        type?: string;
      }>;
    }>;
  }): Promise<PrintfulSyncProduct> {
    const response = await this.api.post('/store/products', productData);
    return response.data.result.sync_product;
  }

  /**
   * Actualiza un producto sincronizado existente
   */
  async updateSyncProduct(
    syncProductId: number,
    productData: {
      sync_product?: {
        name?: string;
        thumbnail?: string;
      };
      sync_variants?: Array<{
        id?: number;
        variant_id: number;
        retail_price: string;
        files?: Array<{
          url: string;
          type?: string;
        }>;
      }>;
    }
  ): Promise<PrintfulSyncProduct> {
    const response = await this.api.put(`/store/products/${syncProductId}`, productData);
    return response.data.result.sync_product;
  }

  /**
   * Elimina un producto sincronizado
   */
  async deleteSyncProduct(syncProductId: number): Promise<void> {
    await this.api.delete(`/store/products/${syncProductId}`);
  }

  // ==================== ORDERS API ====================
  
  /**
   * Obtiene lista de órdenes
   * @param status Estado de las órdenes (draft, pending, failed, canceled, onhold, inprocess, partial, fulfilled)
   * @param limit Número máximo de órdenes a retornar
   * @param offset Offset para paginación
   */
  async getOrders(
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PrintfulOrder[]> {
    const params: any = { limit, offset };
    if (status) params.status = status;
    
    const response = await this.api.get('/orders', { params });
    return response.data.result;
  }

  /**
   * Obtiene detalles de una orden específica
   * @param orderId ID de la orden (puede ser @external_id:valor)
   */
  async getOrder(orderId: string | number): Promise<PrintfulOrder> {
    const response = await this.api.get(`/orders/${orderId}`);
    return response.data.result;
  }

  /**
   * Crea una nueva orden
   * @param orderData Datos de la orden
   * @param confirm Si es true, confirma la orden inmediatamente
   */
  async createOrder(
    orderData: CreatePrintfulOrder,
    confirm: boolean = false
  ): Promise<PrintfulOrder> {
    const params = confirm ? { confirm: 'true' } : {};
    const response = await this.api.post('/orders', orderData, { params });
    return response.data.result;
  }

  /**
   * Estima costos de una orden sin crearla
   * @param orderData Datos de la orden para estimar
   */
  async estimateOrderCosts(orderData: CreatePrintfulOrder): Promise<PrintfulOrder> {
    const response = await this.api.post('/orders/estimate-costs', orderData);
    return response.data.result;
  }

  /**
   * Confirma una orden en estado draft
   * @param orderId ID de la orden
   */
  async confirmOrder(orderId: string | number): Promise<PrintfulOrder> {
    const response = await this.api.post(`/orders/${orderId}/confirm`);
    return response.data.result;
  }

  /**
   * Cancela una orden
   * @param orderId ID de la orden
   */
  async cancelOrder(orderId: string | number): Promise<PrintfulOrder> {
    const response = await this.api.delete(`/orders/${orderId}`);
    return response.data.result;
  }

  /**
   * Actualiza una orden existente (solo draft)
   * @param orderId ID de la orden
   * @param orderData Datos actualizados de la orden
   */
  async updateOrder(
    orderId: string | number,
    orderData: Partial<CreatePrintfulOrder>,
    confirm: boolean = false
  ): Promise<PrintfulOrder> {
    const params = confirm ? { confirm: 'true' } : {};
    const response = await this.api.put(`/orders/${orderId}`, orderData, { params });
    return response.data.result;
  }

  // ==================== SHIPPING RATES ====================
  
  /**
   * Calcula tarifas de envío para una orden
   */
  async calculateShippingRates(orderData: CreatePrintfulOrder): Promise<any> {
    const response = await this.api.post('/shipping/rates', orderData);
    return response.data.result;
  }

  // ==================== HELPER METHODS ====================
  
  /**
   * Busca productos del catálogo por nombre o tipo
   */
  async searchCatalog(searchTerm: string): Promise<PrintfulCatalogProduct[]> {
    const allProducts = await this.getCatalogProducts();
    return allProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Obtiene productos populares del catálogo (camisetas, hoodies, etc.)
   */
  async getPopularProducts(): Promise<PrintfulCatalogProduct[]> {
    const allProducts = await this.getCatalogProducts();
    // IDs de productos populares en Printful
    const popularIds = [71, 146, 19, 380, 12, 13]; // T-shirts, Hoodies, Mugs, etc.
    return allProducts.filter(p => popularIds.includes(p.id));
  }
}

// Singleton instance - se inicializa bajo demanda
let printfulServiceInstance: PrintfulService | null = null;

export function getPrintfulService(): PrintfulService {
  if (!printfulServiceInstance) {
    try {
      printfulServiceInstance = new PrintfulService();
    } catch (error) {
      console.error('Error al inicializar Printful Service:', error);
      throw error;
    }
  }
  return printfulServiceInstance;
}
