import axios from 'utils/axios';

// ⬇️ this is the loader for the detail route
export async function loader() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/products/list`);
    return response.data.products;
  } catch (error) {
    return error;
  }
}

export async function filterProducts(filter) {
  return await axios.post(`${import.meta.env.VITE_APP_API_URL}/products/filter`, { filter });
}

export async function productLoader({ params }) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/product/details`, { id: params.id });
    return response.data;
  } catch (error) {
    return error;
  }
}

export async function getRelatedProducts(id) {
  return await axios.post(`${import.meta.env.VITE_APP_API_URL}/product/related`, { id });
}

export async function getProductReviews() {
  return await axios.get(`${import.meta.env.VITE_APP_API_URL}/review/list`);
}

