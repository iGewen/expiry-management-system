import request from '@/utils/request'

export function getCategories() {
  return request({
    url: '/categories',
    method: 'get'
  })
}

export function getDefaultCategories() {
  return request({
    url: '/categories/defaults',
    method: 'get'
  })
}

export function createCategory(data: { name: string; color?: string }) {
  return request({
    url: '/categories',
    method: 'post',
    data
  })
}

export function updateCategory(id: number, data: { name: string; color?: string }) {
  return request({
    url: `/categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteCategory(id: number) {
  return request({
    url: `/categories/${id}`,
    method: 'delete'
  })
}
