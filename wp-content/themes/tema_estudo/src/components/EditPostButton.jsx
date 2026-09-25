import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function EditPostButton({
  postId,
  editUrl,
  title = 'Editar',
  className = '',
}) {
  const { isAuthenticated } = useAuth();

  // O botão só deve aparecer se o usuário estiver logado no WordPress
  const isWpLoggedIn =
    Boolean(window.EstudoApiConfig?.canEditPosts) ||
    Boolean(window.EstudoApiConfig?.isLoggedIn) ||
    Boolean(window.EstudoApiConfig?.isEditMode) ||
    (typeof document !== 'undefined' && document.body?.classList?.contains('logged-in')) ||
    isAuthenticated;

  if (!isWpLoggedIn || !postId) {
    return null;
  }

  // Gera a URL de edição no WordPress wp-admin
  const resolvedUrl =
    editUrl ||
    (window.EstudoApiConfig?.adminUrl
      ? `${window.EstudoApiConfig.adminUrl.replace(/\/$/, '')}/post.php?post=${postId}&action=edit`
      : `/wp-admin/post.php?post=${postId}&action=edit`);

  const btnClasses = ['post-thumb-edit-btn', className].filter(Boolean).join(' ');

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={btnClasses}
      title={`Editar "${title}" no WordPress`}
      aria-label={`Editar "${title}" no WordPress`}
      onClick={(e) => {
        // Evita abrir o card ou a navegação do SPA ao clicar no botão de edição
        e.stopPropagation();
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    </a>
  );
}
