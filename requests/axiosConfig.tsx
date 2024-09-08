import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.0.186:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export default instance;
