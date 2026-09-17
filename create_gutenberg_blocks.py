import os

source_file = r"c:\Users\usuario\Documents\GitHub\luiz0067-interative-software-simulator\src\view.js"
target_file = r"c:\Users\usuario\Documents\GitHub\tema-e-plugin-estudo-wordpress\wp-content\themes\tema_estudo\src\utils\gutenbergBlocks.js"

with open(source_file, "r", encoding="utf-8") as f:
    orig_code = f.read()

# Remove the auto-executing DOMContentLoaded block at the bottom
code_body = orig_code.split("// Auto-initialize all simulator instances on page load")[0]

wrapper_code = f"""/**
 * Gutenberg Blocks Interactive Runtime for Tema Estudo
 * Suporte nativo a blocos interativos como Software Simulator, Accordions, etc.
 */

{code_body}

/**
 * Inicializa todos os blocos interativos dentro de um container do React
 * @param {{HTMLElement}} container
 */
export function initGutenbergBlocks(container) {{
  if (!container) return;

  // 1. Inicializa Simuladores de Software
  const simBlocks = container.querySelectorAll(".wp-block-custom-simulador-software");
  simBlocks.forEach((block) => {{
    const wrapper = block.querySelector(".sim-player-wrapper") || block;
    if (wrapper.getAttribute("data-initialized") !== "true") {{
      new SoftwareSimulator(block);
    }}
  }});

  // 2. Inicializa Accordions / Details
  const details = container.querySelectorAll("details");
  details.forEach((d) => {{
    if (!d.hasAttribute("data-bound-toggle")) {{
      d.setAttribute("data-bound-toggle", "true");
      d.addEventListener("toggle", () => {{
        d.classList.toggle("is-open", d.open);
      }});
    }}
  }});
}}

export default initGutenbergBlocks;
"""

os.makedirs(os.path.dirname(target_file), exist_ok=True)
with open(target_file, "w", encoding="utf-8") as f:
    f.write(wrapper_code)

print("gutenbergBlocks.js written successfully!")
