import axios from './axios';

// BẢNG GIÁ
export const getPriceBoard = () => {
  return axios.get('/prices/board');
};

// LỊCH SỬ GIÁ
export const getPriceHistory = (variantId) => {
  return axios.get(`/prices/variant/${variantId}`);
};

// THÊM / CẬP NHẬT GIÁ
export const createPrice = (variantId, priceData) => {
  return axios.post(`/prices/variant/${variantId}`, {
    price: priceData.price,
    currencyId: null
  });
};

// XOÁ GIÁ
export const deletePrice = (priceId) => {
  return axios.delete(`/prices/${priceId}`);
};


// ===== GIÁ THEO NHÓM =====
export const getPriceGroupBoard = () => {
  return axios.get('/pricing/price-group/list');
};

// TẠO / CẬP NHẬT GIÁ NHÓM
export const saveGroupPrice = (variantId, loaiKhach, price) => {
  return axios.post(`/pricing/price-group`, {
    variantId,
    loaiKhach,
    price
  });



};
