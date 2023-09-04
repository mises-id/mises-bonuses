/*
 * @Author: lmk
 * @Date: 2022-01-02 21:00:27
 * @LastEditTime: 2022-05-26 17:47:03
 * @LastEditors: lmk
 * @Description:crud
 */
import request from '@/utils/request';
import { AxiosRequestConfig } from 'axios';
const returnUrl = (arr: string[]): string => arr.filter((val) => val).join('/');
/**
 * @description: crud函数
 * @param {any} data 传递给后台的参数
 * @param {string} moduleName api地址的模块名（一般微服务会有多个模块）
 * @param {string} type api的地址子模块
 * @param {string} name api地址的方法名
 * @return {Promise<any>} data:{}
 */

interface crudOption {
  data?: any;
  moduleName: string;
  type: string;
  name?: string;
  method?: string;
}
interface crudResponse {
  url: string;
  method: string;
  data?: any;
  params?: any;
}
const crud = {
  /**
   * @description: 自定义请求类型
   * @return {Promise<any>} data:{}
   */
  crudRequest({
    data,
    moduleName,
    type,
    name = '',
    method = 'get',
  }: crudOption): Promise<any> {
    const url: string = returnUrl([moduleName, type, name]);
    const response: crudResponse = {
      url,
      method,
    };
    if (['post', 'put', 'delete'].includes(method)) {
      response.data = data;
    } else {
      response.params = data;
    }
    return request(response);
  },
  /**
   * @description: 增加
   * @return {Promise<any>} data:{}
   */
  create(
    data: any,
    moduleName: string,
    type: string,
    name: string = '',
  ): Promise<any> {
    return this.crudRequest({ data, moduleName, type, name, method: 'post' });
  },

  /**
   * @description: 删除
   * @return {Promise<any>} data:{}
   */
  deleteIds(
    data: any,
    moduleName: string,
    type: string,
    name: string = '',
  ): Promise<any> {
    return this.crudRequest({ data, moduleName, type, name, method: 'delete' });
  },

  /**
   * @description: 查询
   * @return {Promise<any>} data:{}
   */
  getRequest(
    data: any,
    moduleName: string,
    type: string,
    name: string = '',
  ): Promise<any> {
    return this.crudRequest({ data, moduleName, type, name, method: 'post' });
  },

  /**
   * @description: 改
   * @return {Promise<any>} data:{}
   */
  update(
    data: any,
    moduleName: string,
    type: string,
    name: string = '',
  ): Promise<any> {
    return this.crudRequest({ data, moduleName, type, name, method: 'put' });
  },
  customRequest(params: AxiosRequestConfig): Promise<any> {
    return request(params);
  },
};
export default crud