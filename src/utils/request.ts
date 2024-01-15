import { Toast } from 'antd-mobile';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
const codeMessage: Record<number, string> = {
  200: 'The server successfully returned the requested data.',
  201: 'The data was created or modified successfully.',
  202: 'A request has been queued for background processing (asynchronous task).',
  204: 'The data was deleted successfully.',
  400: 'The request was incorrect and the server did not create or modify any data.',
  401: 'The user is not authorized (token, username, password incorrect).',
  403: 'The user is authorized but access is forbidden.',
  404: 'The requested record does not exist and the server did not perform any operation.',
  406: 'The requested format is not available.',
  410: 'The requested resource has been permanently deleted and will not be available again.',
  422: 'A validation error occurred when creating an object.',
  500: 'An error occurred on the server, please check the server.',
  502: 'Bad gateway error.',
  503: 'The service is temporarily unavailable, the server is overloaded or under maintenance.',
  504: 'Gateway timeout.',
};

const errorHandler = (error: {
  response: AxiosResponse;
  config: AxiosRequestConfig;
}) => {
  const { response } = error;
  if (response && response.status) {
    const errorText =
      response?.data.message || codeMessage[response.status] || response.statusText;
    // const { status } = response;
    Toast.show(errorText);
    return Promise.reject(error);
  }

  if (!response) {
    console.log('No response from server.')
    Toast.show('Bad gateway error.');
    return Promise.reject(error);
  }

  // if (config) {
  //   Toast.show('Unknown error');
  // }
  // return response;
  return Promise.reject(error);
};
const isProd = process.env.REACT_APP_NODE_ENV==='production'
// if(istest){
//   headers['Mises-Env'] = 'development'
// }

const baseURL = isProd ? 'https://api.alb.mises.site/api' : 'https://api.test.mises.site/api'

const request = axios.create({
  headers: { 'Content-Type': 'application/json' },
  baseURL: baseURL,
  timeout: 50000,
});

// 添加请求拦截器
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if(!config.headers) config.headers = {};
    return config;
  },
  function (error:any) {

    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 添加响应拦截器
request.interceptors.response.use((response: AxiosResponse) => {
  const { data } = response;
  if (data.code === 0) return data;
  
  Toast.show(data.msg);
  return Promise.reject(data.data);
}, errorHandler);

export default request;
