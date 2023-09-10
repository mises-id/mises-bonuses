import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import Web3Provider from './components/Web3Provider';
import InitPageProvider from './components/pageProvider/InitPageProvider';


function App() {
  return (
    <div className="App">
      <InitPageProvider>
        <Web3Provider>
          <BrowserRouter>
            <Routes />
          </BrowserRouter>
        </Web3Provider>
      </InitPageProvider>
    </div>
  );
}

export default App;
