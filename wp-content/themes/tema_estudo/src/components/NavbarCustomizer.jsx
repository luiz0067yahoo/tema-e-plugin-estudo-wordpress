import React, { useState } from 'react';

const PRESET_COLORS = [
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Rosa Neon', value: '#ec4899' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Violeta', value: '#8b5cf6' },
];

export default function NavbarCustomizer({ config, onUpdateConfig, onResetConfig }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante para abrir o painel de personalização da navbar */}
      <button
        className="navbar-customizer-trigger"
        onClick={() => setIsOpen(true)}
        title="Personalizar Navbar"
        aria-label="Personalizar Navbar"
      >
        <span className="trigger-icon">🎨</span>
        <span className="trigger-label">Navbar</span>
      </button>

      {/* Drawer / Painel Lateral */}
      {isOpen && (
        <div className="customizer-overlay" onClick={() => setIsOpen(false)}>
          <div className="customizer-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="customizer-header">
              <div className="customizer-title-wrap">
                <span className="header-icon">⚙️</span>
                <div>
                  <h4>Personalização da Navbar</h4>
                  <p>Ajuste o design da barra de categorias</p>
                </div>
              </div>
              <button
                className="customizer-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="customizer-body">
              {/* 1. Estilo dos Botões */}
              <div className="customizer-section">
                <label className="section-label">Estilo Visual dos Links</label>
                <div className="style-grid">
                  {[
                    { id: 'pill', label: 'Pill (Padrão)', desc: 'Botões arredondados com glow' },
                    { id: 'underline', label: 'Underline', desc: 'Linha animada inferior' },
                    { id: 'glass', label: 'Glass', desc: 'Translúcido futurista' },
                    { id: 'minimal', label: 'Minimal', desc: 'Clean, focado no texto' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`style-option-btn ${config.style === style.id ? 'is-active' : ''}`}
                      onClick={() => onUpdateConfig({ style: style.id })}
                    >
                      <span className="option-title">{style.label}</span>
                      <span className="option-desc">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Alinhamento */}
              <div className="customizer-section">
                <label className="section-label">Alinhamento dos Itens</label>
                <div className="segmented-control">
                  {[
                    { id: 'left', label: 'Esquerda' },
                    { id: 'center', label: 'Centro' },
                    { id: 'right', label: 'Direita' },
                  ].map((align) => (
                    <button
                      key={align.id}
                      type="button"
                      className={`segment-btn ${config.align === align.id ? 'is-active' : ''}`}
                      onClick={() => onUpdateConfig({ align: align.id })}
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Toggles */}
              <div className="customizer-section">
                <label className="section-label">Opções de Exibição</label>
                <div className="toggle-list">
                  <label className="toggle-item">
                    <span className="toggle-label">
                      <strong>Fixar no Topo (Sticky)</strong>
                      <small>Permanece visível durante a rolagem</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.sticky}
                      onChange={(e) => onUpdateConfig({ sticky: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>

                  <label className="toggle-item">
                    <span className="toggle-label">
                      <strong>Contador de Posts</strong>
                      <small>Exibe a quantidade de itens por categoria</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.showCounts}
                      onChange={(e) => onUpdateConfig({ showCounts: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>

              {/* 4. Cores de Destaque */}
              <div className="customizer-section">
                <label className="section-label">Cor de Destaque (Accent)</label>
                <div className="color-palette">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-swatch ${config.accent === color.value ? 'is-active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => onUpdateConfig({ accent: color.value })}
                      title={color.name}
                    />
                  ))}
                  <div className="color-input-wrap">
                    <input
                      type="color"
                      value={config.accent}
                      onChange={(e) => onUpdateConfig({ accent: e.target.value })}
                      className="native-color-picker"
                      title="Escolher cor personalizada"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="customizer-footer">
              <button
                type="button"
                className="reset-btn"
                onClick={onResetConfig}
                title="Voltar para a configuração salva no WordPress"
              >
                Restaurar Padrões WP
              </button>
              <button
                type="button"
                className="apply-btn"
                onClick={() => setIsOpen(false)}
              >
                Pronto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
