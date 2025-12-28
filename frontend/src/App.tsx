import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    axios.get('http://localhost:3000/api/health')
      .then(response => {
        setMessage(response.data.message)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        setMessage('Error connecting to backend')
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          X-Ray Project
        </h1>
        <p className="text-gray-700">
          Backend Status: <span className="font-semibold text-green-600">{message}</span>
        </p>
      </div>
    </div>
  )
}

export default App
