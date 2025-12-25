import request from '@/utils/request'
import type { ApiResponse, Product, ProductForm, ProductFilter, Statistics, PageData } from '@/types'

export const productApi = {
  // 获取商品列表
  getList(params?: ProductFilter) {
    return request.get<ApiResponse<PageData & { products: Product[] }>>('/products', { params })
  },

  // 获取商品详情
  getById(id: number) {
    return request.get<ApiResponse<Product>>(`/products/${id}`)
  },

  // 创建商品
  create(data: ProductForm) {
    return request.post<ApiResponse<Product>>('/products', data)
  },

  // 更新商品
  update(id: number, data: ProductForm) {
    return request.put<ApiResponse<Product>>(`/products/${id}`, data)
  },

  // 删除商品
  delete(id: number) {
    return request.delete<ApiResponse>(`/products/${id}`)
  },

  // 批量删除
  batchDelete(ids: number[]) {
    return request.post<ApiResponse>('/products/batch/delete', { ids })
  },

  // 批量导入
  batchImport(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse>('/products/batch/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 下载导入模板
  downloadTemplate() {
    return request.get('/products/template/export', {
      responseType: 'blob'
    })
  },

  // 获取统计数据
  getStatistics() {
    return request.get<ApiResponse<Statistics>>('/products/stats')
  }
}

// 导出便捷函数
export const getProducts = (params?: ProductFilter) => productApi.getList(params).then(res => res.data)
export const getProduct = (id: number) => productApi.getById(id).then(res => res.data)
export const createProduct = (data: ProductForm) => productApi.create(data).then(res => res.data)
export const updateProduct = (id: number, data: ProductForm) => productApi.update(id, data).then(res => res.data)
export const deleteProduct = (id: number) => productApi.delete(id).then(res => res.data)
export const batchDeleteProducts = (ids: number[]) => productApi.batchDelete(ids).then(res => res.data)
export const getProductStats = () => productApi.getStatistics().then(res => res.data)
export const importProducts = (products: any[]) => request.post('/products/batch/import', { products }).then(res => res.data)
export const exportProducts = (params?: any) => productApi.getList(params).then(res => res.data?.products || [])
