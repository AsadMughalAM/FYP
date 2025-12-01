import React from 'react'
import {BrowserRouter as Router ,Routes ,Route} from 'react-router-dom'

import SignUp from './auth/SignUp/SignUp'
import SignIn from './auth/SignIn/SignIn'
import Home from  './pages/Home.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/signup' element={<SignUp/>}/>
          <Route path='/signin' element={<SignIn/>}/>
          <Route path='/' element={
            <ProtectedRoute> 
            <Home/>
          </ProtectedRoute>}/> 
        </Routes>
      </Router>
    </>
  )
}

export default App
