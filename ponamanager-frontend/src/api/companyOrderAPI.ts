import apiClient from './client';

export const companyOrderAPI = {
  getAll: (params?: { status?: string; ponaType?: string }) =>
    apiClient.get('/company-orders', { params }),

  getById: (id: string) => apiClient.get(`/company-orders/${id}`),

  create: (data: {
    ponaType: string;
    paymentAmount: number;
    ratePerPL: number;
    expectedDate: string;
    notes?: string;
  }) => apiClient.post('/company-orders', data),

  update: (id: string, data: any) => apiClient.patch(`/company-orders/${id}`, data),

  receive: (
    id: string,
    data: {
      mirValue: number;
      totalPoly: number;
      paidToCompany?: number;
      batchId?: string;
      notes?: string;
    },
  ) => apiClient.patch(`/company-orders/${id}/receive`, data),

  delete: (id: string) => apiClient.delete(`/company-orders/${id}`),
};
