import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-view">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Página não encontrada</h2>
        <p>O endereço acessado não existe ou foi removido.</p>
        <Link to="/" className="not-found-btn">
          Ir para a Página Inicial
        </Link>
      </div>
    </div>
  );
}
