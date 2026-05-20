import Canvas from './components/Canvas'
import {  BrowserRouter, Routes, Route } from 'react-router-dom'
import DesignLibrary from './components/DesignLibrary'

function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesignLibrary/>} />
        <Route path="/design/new" element={<Canvas />} />
        <Route path="/design/:designId" element={<Canvas />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App