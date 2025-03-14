import React from 'react'
import { Link } from "wouter"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-6">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Link href="/">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md">
            Volver al inicio
          </button>
        </Link>
      </div>
    </div>
  );
}