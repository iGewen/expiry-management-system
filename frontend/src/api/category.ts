import request from '@/utils/request'

export function getCategories() {
  return request.get('/categories')
}

export function getDefaultCategories() {
  return request.get('/categories/defaults')
}

export function createCategory(data: { name: string; color?: string }) {
  return request.post('/categories', data)
}

export function updateCategory(id: number, data: { name: string; color?: string }) {
  return request.put(`/categories/${id}`, data)
}

export function deleteCategory(id: number) {
  return request.delete(`/categories/${id}`)
}

// 获取分类详情（带商品列表）
export function getCategoryDetail(id: number) {
  return request.get(`/categories/${id}/detail`)
}
