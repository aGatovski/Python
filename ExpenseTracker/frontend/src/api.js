import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const getTransactions = (params = {}) =>
    axios.get(`${BASE_URL}/transactions`, { params });

export const getSummary = (month) =>
    axios.get(`${BASE_URL}/summary/${month}`);

export const getCategories = () =>
    axios.get(`${BASE_URL}/categories`);

export const addTransaction = (data) =>
    axios.post(`${BASE_URL}/transactions`, data);

export const addTransactions = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axios.post(`${BASE_URL}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
