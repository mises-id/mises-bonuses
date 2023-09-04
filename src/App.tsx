/*
 * @Author: lmk
 * @Date: 2022-05-25 22:53:45
 * @LastEditTime: 2022-05-25 23:51:51
 * @LastEditors: lmk
 * @Description: 
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </div>
  );
}

export default App;
