import { useEffect } from 'react';
import Aos from 'aos';

import './App.css';

import Header from './components/Header/Header';
import Hero from './components/UI/Hero';
import About from './components/UI/About';
import Portfolio from './components/UI/Portfolio';
import Contact from './components/UI/Contact';
import Experiences from './components/UI/Experiences';
import Journey from './components/UI/Journey';

function App() {
  useEffect(() => {
    Aos.init();
  }, []);

  return <>
    <Header />
    <main>
      <Hero />
      <About />
      <Experiences />
      <Journey />
      <Portfolio />
      <Contact />
    </main>
  </>
}

export default App;
