export type SaleCustomerInput = {
  musteriAdi: string;
  musteriCariKodu?: string;
};

export const transferToSales = async (
  accommodationIds: number[],
  salePrices?: Record<number, { satisFiyati: number; toplamSatisFiyati: number }>,
  saleCustomers?: Record<number, SaleCustomerInput>
) => {
  try {
    const res = await fetch('/api/accommodation-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Cookie'leri göndermek için gerekli
      body: JSON.stringify({ 
        accommodationIds,
        salePrices: salePrices || {},
        saleCustomers: saleCustomers || {},
      })
    });

    if (!res.ok) {
      const error = await res.json();
      
      // Ödeme gerekli hatası
      if (res.status === 402 && error.error === 'PAYMENT_REQUIRED') {
        const paymentError: any = new Error(error.error || 'Satışa aktarma başarısız');
        paymentError.status = 402;
        paymentError.paymentData = {
          accommodationCount: error.accommodationCount || 0,
          accommodationSaleCount: error.accommodationSaleCount || 0,
          message: error.message || 'Ücretsiz plan limitine ulaştınız.',
        };
        throw paymentError;
      }
      
      throw new Error(error.error || 'Satışa aktarma başarısız');
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('Transfer to sales error:', error);
    throw error;
  }
};
