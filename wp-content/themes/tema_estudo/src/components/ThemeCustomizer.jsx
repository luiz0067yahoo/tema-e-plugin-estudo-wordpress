import React, { useState } from 'react';

// Presets completos de cores para todo o tema
export const THEME_PRESETS = [
  {
    id: 'dark-default',
    name: 'Escuro Moderno',
    desc: 'Paleta padrão com azul ardósia e índigo',
    colors: {
      bgMain: '#0b0f19',
      bgSurface: '#111827',
      bgCard: '#111827',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      primary: '#6366f1',
      accent: '#06b6d4',
    },
  },
  {
    id: 'midnight-oled',
    name: 'Midnight OLED',
    desc: 'Preto puro com contraste ultra-nítido',
    colors: {
      bgMain: '#000000',
      bgSurface: '#09090b',
      bgCard: '#121215',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      primary: '#3b82f6',
      accent: '#38bdf8',
    },
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    desc: 'Ambiente escuro futurista com roxo e neon',
    colors: {
      bgMain: '#0d091a',
      bgSurface: '#160f2e',
      bgCard: '#1f163f',
      textPrimary: '#fdf4ff',
      textSecondary: '#d8b4fe',
      primary: '#a855f7',
      accent: '#ec4899',
    },
  },
  {
    id: 'emerald-tech',
    name: 'Esmeralda Tech',
    desc: 'Tons esmeralda profundos e verde menta',
    colors: {
      bgMain: '#041612',
      bgSurface: '#08251e',
      bgCard: '#0d352b',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      primary: '#10b981',
      accent: '#14b8a6',
    },
  },
  {
    id: 'clean-light',
    name: 'Clean Claro',
    desc: 'Modo claro sofisticado com alto contraste',
    colors: {
      bgMain: '#f1f5f9',
      bgSurface: '#ffffff',
      bgCard: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      primary: '#4f46e5',
      accent: '#0284c7',
    },
  },
];

// Presets individuais para a Navbar
const NAVBAR_PRESET_ACCENTS = [
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Rosa Neon', value: '#ec4899' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Violeta', value: '#8b5cf6' },
];

const NAVBAR_PRESET_BG_COLORS = [
  { name: 'Escuro Padrão', value: '#111827' },
  { name: 'Ardósia', value: '#1e293b' },
  { name: 'Noite Profunda', value: '#0f172a' },
  { name: 'Preto Total', value: '#000000' },
  { name: 'Roxo Noturno', value: '#1e1b4b' },
  { name: 'Claro Clean', value: '#ffffff' },
];

const NAVBAR_PRESET_TEXT_COLORS = [
  { name: 'Cinza Médio (Padrão)', value: '#94a3b8' },
  { name: 'Branco Puro', value: '#ffffff' },
  { name: 'Cinza Claro', value: '#cbd5e1' },
  { name: 'Ciano Pastel', value: '#67e8f9' },
  { name: 'Menta', value: '#6ee7b7' },
  { name: 'Dourado Suave', value: '#fde047' },
];

// Presets de cores rápidas para cada atributo do tema
const SWATCHES_BG = ['#0b0f19', '#000000', '#0f172a', '#18122b', '#061a15', '#f8fafc', '#ffffff'];
const SWATCHES_CARD = ['#111827', '#121215', '#1e293b', '#21193d', '#0d382e', '#ffffff', '#f1f5f9'];
const SWATCHES_TEXT_MAIN = ['#f8fafc', '#ffffff', '#e2e8f0', '#fdf4ff', '#ecfdf5', '#0f172a', '#1e293b'];
const SWATCHES_TEXT_MUTED = ['#94a3b8', '#a1a1aa', '#cbd5e1', '#d8b4fe', '#6ee7b7', '#475569', '#64748b'];
const SWATCHES_PRIMARY = ['#6366f1', '#3b82f6', '#a855f7', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'];

export const isEditModeActive = () => {
  if (typeof window === 'undefined') return false;

  // 1. Injetado pelo WordPress via wp_localize_script (is_customize_preview || is_user_logged_in)
  if (window.EstudoApiConfig?.isEditMode) return true;

  // 2. Classes nativas do WordPress no body
  if (
    document.body.classList.contains('customize-preview') ||
    document.body.classList.contains('logged-in') ||
    document.body.classList.contains('wp-admin')
  ) {
    return true;
  }

  // 3. Barra de administração do WordPress no topo
  if (document.getElementById('wpadminbar')) return true;

  // 4. Parâmetros de pré-visualização ou edição
  const search = window.location.search;
  if (
    search.includes('customize_changeset_uuid') ||
    search.includes('customize') ||
    search.includes('edit=1') ||
    search.includes('preview=true')
  ) {
    return true;
  }

  // 5. Objeto wp.customize disponível
  if (window.wp && window.wp.customize) return true;

  return false;
};

export default function ThemeCustomizer({
  themeColors,
  onUpdateThemeColors,
  onResetThemeColors,
  navbarConfig,
  onUpdateNavbarConfig,
  onResetNavbarConfig,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('theme'); // 'theme' | 'navbar'

  // Só exibe as opções de personalização se estiver em modo de edição / logado
  if (!isEditModeActive()) {
    return null;
  }

  const handleApplyPreset = (preset) => {
    onUpdateThemeColors(preset.colors);
  };

  const handleResetAll = () => {
    if (activeTab === 'theme') {
      onResetThemeColors();
    } else {
      onResetNavbarConfig();
    }
  };

  return (
    <>
      {/* Botão flutuante para abrir o painel de personalização */}
      <button
        className="navbar-customizer-trigger"
        onClick={() => setIsOpen(true)}
        title="Personalizar Tema e Navbar"
        aria-label="Personalizar Tema e Navbar"
      >
        <span className="trigger-icon">🎨</span>
        <span className="trigger-label">Personalizar Tema</span>
      </button>

      {/* Drawer / Painel Lateral */}
      {isOpen && (
        <div className="customizer-overlay" onClick={() => setIsOpen(false)}>
          <div className="customizer-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Cabeçalho */}
            <div className="customizer-header">
              <div className="customizer-title-wrap">
                <span className="header-icon">⚙️</span>
                <div>
                  <h4>Personalização do Tema</h4>
                  <p>Ajuste as cores gerais do site e da navbar</p>
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

            {/* Abas de Navegação */}
            <div className="customizer-tabs">
              <button
                type="button"
                className={`customizer-tab-btn ${activeTab === 'theme' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('theme')}
              >
                🎨 Cores do Tema
              </button>
              <button
                type="button"
                className={`customizer-tab-btn ${activeTab === 'navbar' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('navbar')}
              >
                📑 Navbar
              </button>
            </div>

            {/* Corpo do Drawer */}
            <div className="customizer-body">
              {activeTab === 'theme' ? (
                /* ==========================================================
                   ABA 1: CORES DO TEMA
                   ========================================================== */
                <>
                  {/* Presets Rápidos */}
                  <div className="customizer-section">
                    <label className="section-label">Presets de Paleta em 1 Clique</label>
                    <div className="theme-presets-grid">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className={`theme-preset-btn ${
                            themeColors.bgMain === preset.colors.bgMain &&
                            themeColors.primary === preset.colors.primary
                              ? 'is-active'
                              : ''
                          }`}
                          onClick={() => handleApplyPreset(preset)}
                        >
                          <div className="preset-preview-palette">
                            <span style={{ backgroundColor: preset.colors.bgMain }} />
                            <span style={{ backgroundColor: preset.colors.bgSurface }} />
                            <span style={{ backgroundColor: preset.colors.bgCard }} />
                            <span style={{ backgroundColor: preset.colors.primary }} />
                            <span style={{ backgroundColor: preset.colors.accent }} />
                          </div>
                          <div className="preset-info">
                            <strong>{preset.name}</strong>
                            <small>{preset.desc}</small>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1. Cor de Fundo Principal */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Fundo Principal da Página (Body)</label>
                      <span className="color-value-badge">{themeColors.bgMain || '#0b0f19'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_BG.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.bgMain === color ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color,
                            border: color === '#ffffff' || color === '#f8fafc' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateThemeColors({ bgMain: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.bgMain || '#0b0f19'}
                          onChange={(e) => onUpdateThemeColors({ bgMain: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada de fundo principal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Cor de Superfície */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Fundo de Superfície (Header / Rodapé)</label>
                      <span className="color-value-badge">{themeColors.bgSurface || '#111827'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_BG.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.bgSurface === color ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color,
                            border: color === '#ffffff' || color === '#f8fafc' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateThemeColors({ bgSurface: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.bgSurface || '#111827'}
                          onChange={(e) => onUpdateThemeColors({ bgSurface: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada de superfície"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Cor de Fundo dos Cards */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Fundo dos Cards de Conteúdo</label>
                      <span className="color-value-badge">{themeColors.bgCard || '#111827'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_CARD.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.bgCard === color ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color,
                            border: color === '#ffffff' || color === '#f1f5f9' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateThemeColors({ bgCard: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.bgCard || '#111827'}
                          onChange={(e) => onUpdateThemeColors({ bgCard: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada dos cards"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Cor do Texto Principal */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Texto Principal (Títulos)</label>
                      <span className="color-value-badge">{themeColors.textPrimary || '#f8fafc'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_TEXT_MAIN.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.textPrimary === color ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color,
                            border: color === '#ffffff' || color === '#f8fafc' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateThemeColors({ textPrimary: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.textPrimary || '#f8fafc'}
                          onChange={(e) => onUpdateThemeColors({ textPrimary: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada do texto principal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Cor do Texto Secundário */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Texto Secundário (Descrições e Metas)</label>
                      <span className="color-value-badge">{themeColors.textSecondary || '#94a3b8'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_TEXT_MUTED.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.textSecondary === color ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color,
                            border: color === '#ffffff' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateThemeColors({ textSecondary: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.textSecondary || '#94a3b8'}
                          onChange={(e) => onUpdateThemeColors({ textSecondary: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada do texto secundário"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. Cor Primária / Destaques */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Cor Primária (Botões e Destaques)</label>
                      <span className="color-value-badge">{themeColors.primary || '#6366f1'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_PRIMARY.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.primary === color ? 'is-active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => onUpdateThemeColors({ primary: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.primary || '#6366f1'}
                          onChange={(e) => onUpdateThemeColors({ primary: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor primária personalizada"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7. Cor de Acento Secundária */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Cor de Acento Secundária (Gradientes e Tags)</label>
                      <span className="color-value-badge">{themeColors.accent || '#06b6d4'}</span>
                    </div>
                    <div className="color-palette">
                      {SWATCHES_PRIMARY.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-swatch ${themeColors.accent === color ? 'is-active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => onUpdateThemeColors({ accent: color })}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={themeColors.accent || '#06b6d4'}
                          onChange={(e) => onUpdateThemeColors({ accent: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor de acento personalizada"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ==========================================================
                   ABA 2: NAVBAR
                   ========================================================== */
                <>
                  {/* Estilo Visual dos Links */}
                  <div className="customizer-section">
                    <label className="section-label">Estilo Visual dos Links</label>
                    <div className="style-grid">
                      <button
                        type="button"
                        className={`style-option-btn ${navbarConfig.style === 'pill' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ style: 'pill' })}
                      >
                        <span className="option-title">💊 Pill</span>
                        <span className="option-desc">Bordas arredondadas modernas</span>
                      </button>

                      <button
                        type="button"
                        className={`style-option-btn ${navbarConfig.style === 'underline' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ style: 'underline' })}
                      >
                        <span className="option-title">➖ Underline</span>
                        <span className="option-desc">Linha de destaque inferior</span>
                      </button>

                      <button
                        type="button"
                        className={`style-option-btn ${navbarConfig.style === 'glass' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ style: 'glass' })}
                      >
                        <span className="option-title">✨ Glass</span>
                        <span className="option-desc">Efeito vidro translúcido</span>
                      </button>

                      <button
                        type="button"
                        className={`style-option-btn ${navbarConfig.style === 'minimal' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ style: 'minimal' })}
                      >
                        <span className="option-title">◽ Minimal</span>
                        <span className="option-desc">Design limpo e discreto</span>
                      </button>
                    </div>
                  </div>

                  {/* Alinhamento */}
                  <div className="customizer-section">
                    <label className="section-label">Alinhamento das Categorias</label>
                    <div className="segmented-control">
                      <button
                        type="button"
                        className={`segment-btn ${navbarConfig.align === 'left' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ align: 'left' })}
                      >
                        Esquerda
                      </button>
                      <button
                        type="button"
                        className={`segment-btn ${navbarConfig.align === 'center' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ align: 'center' })}
                      >
                        Centro
                      </button>
                      <button
                        type="button"
                        className={`segment-btn ${navbarConfig.align === 'right' ? 'is-active' : ''}`}
                        onClick={() => onUpdateNavbarConfig({ align: 'right' })}
                      >
                        Direita
                      </button>
                    </div>
                  </div>

                  {/* Comportamento Sticky */}
                  <div className="customizer-section">
                    <label className="section-label">Comportamento</label>
                    <div className="toggle-list">
                      <label className="toggle-item">
                        <div className="toggle-label">
                          <strong>Fixar no Topo (Sticky)</strong>
                          <small>Mantém o menu visível ao rolar a página</small>
                        </div>
                        <input
                          type="checkbox"
                          checked={navbarConfig.sticky}
                          onChange={(e) => onUpdateNavbarConfig({ sticky: e.target.checked })}
                        />
                        <span className="toggle-switch" />
                      </label>
                    </div>
                  </div>

                  {/* Cor do Fundo da Navbar */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Cor do Fundo da Navbar</label>
                      <span className="color-value-badge">{navbarConfig.bgColor || '#111827'}</span>
                    </div>
                    <div className="color-palette">
                      {NAVBAR_PRESET_BG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`color-swatch ${navbarConfig.bgColor === color.value ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color.value,
                            border: color.value === '#ffffff' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateNavbarConfig({ bgColor: color.value })}
                          title={color.name}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={navbarConfig.bgColor || '#111827'}
                          onChange={(e) => onUpdateNavbarConfig({ bgColor: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada de fundo da navbar"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cor do Texto da Navbar */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Cor do Texto dos Links da Navbar</label>
                      <span className="color-value-badge">{navbarConfig.textColor || '#94a3b8'}</span>
                    </div>
                    <div className="color-palette">
                      {NAVBAR_PRESET_TEXT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`color-swatch ${navbarConfig.textColor === color.value ? 'is-active' : ''}`}
                          style={{
                            backgroundColor: color.value,
                            border: color.value === '#ffffff' ? '1px solid #94a3b8' : undefined,
                          }}
                          onClick={() => onUpdateNavbarConfig({ textColor: color.value })}
                          title={color.name}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={navbarConfig.textColor || '#94a3b8'}
                          onChange={(e) => onUpdateNavbarConfig({ textColor: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada de texto da navbar"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cor de Destaque da Navbar */}
                  <div className="customizer-section">
                    <div className="section-label-row">
                      <label className="section-label">Cor de Destaque da Navbar (Accent)</label>
                      <span className="color-value-badge">{navbarConfig.accent || '#6366f1'}</span>
                    </div>
                    <div className="color-palette">
                      {NAVBAR_PRESET_ACCENTS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`color-swatch ${navbarConfig.accent === color.value ? 'is-active' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => onUpdateNavbarConfig({ accent: color.value })}
                          title={color.name}
                        />
                      ))}
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={navbarConfig.accent || '#6366f1'}
                          onChange={(e) => onUpdateNavbarConfig({ accent: e.target.value })}
                          className="native-color-picker"
                          title="Escolher cor personalizada de destaque da navbar"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Rodapé do Drawer */}
            <div className="customizer-footer">
              <button
                type="button"
                className="reset-btn"
                onClick={handleResetAll}
                title="Voltar para a configuração salva no WordPress"
              >
                {activeTab === 'theme' ? 'Restaurar Cores WP' : 'Restaurar Navbar WP'}
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
