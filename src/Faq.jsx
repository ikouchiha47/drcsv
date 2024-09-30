import React from 'react';

import { registerAllModules } from 'handsontable/registry';

import './App.css';
import './Home.css';
import './stylesheets/Faq.css';

import Logo from './Logo';
import FaqContent from './components/FaqContent';

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

registerAllModules();

function Header() {
  return (
    <header className="App-header">
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Logo fillColor='#61dafb' width='200' height='100' />
      </a>
    </header>
  )
}

function Faq() {
  return (
    <div className='App'>
      <Header />
      <section className='App-container'>
        <FaqContent />
      </section>
    </div>
  )
}

export default Faq;
