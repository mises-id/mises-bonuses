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
import Web3Provider from './components/Web3Provider';


function App() {
  return (
    <div className="App">
      <Web3Provider>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Web3Provider>
    </div>
  );
}

export default App;
