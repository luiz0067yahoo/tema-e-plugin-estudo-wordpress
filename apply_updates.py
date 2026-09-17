import os
import re

theme_dir = r"c:\Users\usuario\Documents\GitHub\tema-e-plugin-estudo-wordpress\wp-content\themes\tema_estudo"

# 1. Update FeedPage.jsx
feed_page_path = os.path.join(theme_dir, "src", "pages", "FeedPage.jsx")
with open(feed_page_path, "r", encoding="utf-8") as f:
    feed_content = f.read()

feed_content = feed_content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';\nimport { initGutenbergBlocks } from '../utils/gutenbergBlocks';"
)

feed_content = feed_content.replace(
    "  const [error, setError] = useState(null);",
    "  const [error, setError] = useState(null);\n  const singleArticleRef = useRef(null);"
)

effect_code = """
  // Ativação de blocos interativos do Gutenberg (ex: simuladores, accordions)
  useEffect(() => {
    if (posts.length === 1 && singleArticleRef.current) {
      initGutenbergBlocks(singleArticleRef.current);
    }
  }, [posts]);
"""

feed_content = feed_content.replace(
    "  if (loading) {",
    effect_code + "\n  if (loading) {"
)

feed_content = feed_content.replace(
    '<article className="single-article-view single-post-in-feed">',
    '<article ref={singleArticleRef} className="single-article-view single-post-in-feed">'
)

with open(feed_page_path, "w", encoding="utf-8") as f:
    f.write(feed_content)
print("FeedPage.jsx updated successfully!")

# 2. Update SingleItemPage.jsx
single_page_path = os.path.join(theme_dir, "src", "pages", "SingleItemPage.jsx")
with open(single_page_path, "r", encoding="utf-8") as f:
    single_content = f.read()

single_content = single_content.replace(
    "import api from '../services/api';",
    "import api from '../services/api';\nimport { initGutenbergBlocks } from '../utils/gutenbergBlocks';"
)

old_details_effect = """  // Ativaǜo de interatividade nos blocos Gutenberg de sanfona / details
  useEffect(() => {
    if (!contentRef.current) return;

    const detailsElements = contentRef.current.querySelectorAll('details');
    detailsElements.forEach((el) => {
      el.addEventListener('toggle', () => {
        el.classList.toggle('is-open', el.open);
      });
    });
  }, [item]);"""

new_details_effect = """  // Ativação de interatividade em todos os blocos Gutenberg (simuladores, accordions, etc.)
  useEffect(() => {
    if (!contentRef.current) return;
    initGutenbergBlocks(contentRef.current);
  }, [item]);"""

if old_details_effect in single_content:
    single_content = single_content.replace(old_details_effect, new_details_effect)
else:
    # fallback replacement using regex
    single_content = re.sub(
        r'// Ativa[^\n]*\n\s*useEffect\(\(\) => \{.*?detailsElements\.forEach.*?\}, \[item\]\);',
        new_details_effect,
        single_content,
        flags=re.DOTALL
    )

with open(single_page_path, "w", encoding="utf-8") as f:
    f.write(single_content)
print("SingleItemPage.jsx updated successfully!")

# 3. Update CategoryBanner.jsx
banner_path = os.path.join(theme_dir, "src", "components", "CategoryBanner.jsx")
with open(banner_path, "r", encoding="utf-8") as f:
    banner_content = f.read()

banner_content = "import { initGutenbergBlocks } from '../utils/gutenbergBlocks';\n" + banner_content
banner_content = re.sub(
    r'useEffect\(\(\) => \{.*?const details = contentRef\.current\.querySelectorAll.*?\}, \[page\]\);',
    """useEffect(() => {
    if (!contentRef.current) return;
    initGutenbergBlocks(contentRef.current);
  }, [page]);""",
    banner_content,
    flags=re.DOTALL
)

with open(banner_path, "w", encoding="utf-8") as f:
    f.write(banner_content)
print("CategoryBanner.jsx updated successfully!")

# 4. Append Simulator CSS to index.css
sim_css_path = r"c:\Users\usuario\Documents\GitHub\luiz0067-interative-software-simulator\build\style-index.css"
with open(sim_css_path, "r", encoding="utf-8") as f:
    sim_css = f.read()

index_css_path = os.path.join(theme_dir, "src", "index.css")
with open(index_css_path, "r", encoding="utf-8") as f:
    index_css = f.read()

if "/* === ESTILOS GUTENBERG: SIMULADOR DE SOFTWARE INTERATIVO === */" not in index_css:
    index_css += f"\n\n/* === ESTILOS GUTENBERG: SIMULADOR DE SOFTWARE INTERATIVO === */\n{sim_css}\n"
    with open(index_css_path, "w", encoding="utf-8") as f:
        f.write(index_css)
    print("index.css updated with simulator styles!")
else:
    print("Simulator styles already present in index.css.")

