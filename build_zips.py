import os
import zipfile

root = r"c:\Users\usuario\Documents\GitHub\tema-e-plugin-estudo-wordpress"

# 1. Zipar Tema (tema_estudo)
theme_dir = os.path.join(root, "wp-content", "themes", "tema_estudo")
theme_zip = os.path.join(root, "wp-content", "themes", "tema_estudo.zip")

print("Gerando tema_estudo.zip com padrão POSIX/Linux...")
with zipfile.ZipFile(theme_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(theme_dir):
        # Ignora pastas desnecessárias
        if "node_modules" in dirnames:
            dirnames.remove("node_modules")
        if ".git" in dirnames:
            dirnames.remove(".git")
        for f in filenames:
            if f.endswith(".zip"):
                continue
            full_path = os.path.join(dirpath, f)
            rel_path = os.path.relpath(full_path, os.path.dirname(theme_dir))
            # FORÇA barras normais ('/') padrão ZIP para compatibilidade 100% com Linux / WordPress
            arcname = rel_path.replace("\\", "/")
            zf.write(full_path, arcname)

print(f"tema_estudo.zip criado com sucesso! Tamanho: {os.path.getsize(theme_zip):,} bytes")

# 2. Zipar Plugin (plugin_estudo)
plugin_dir = os.path.join(root, "wp-content", "plugins", "plugin_estudo")
plugin_zip = os.path.join(root, "wp-content", "plugins", "plugin_estudo.zip")

print("Gerando plugin_estudo.zip com padrão POSIX/Linux...")
with zipfile.ZipFile(plugin_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(plugin_dir):
        if ".git" in dirnames:
            dirnames.remove(".git")
        for f in filenames:
            if f.endswith(".zip"):
                continue
            full_path = os.path.join(dirpath, f)
            rel_path = os.path.relpath(full_path, os.path.dirname(plugin_dir))
            arcname = rel_path.replace("\\", "/")
            zf.write(full_path, arcname)

print(f"plugin_estudo.zip criado com sucesso! Tamanho: {os.path.getsize(plugin_zip):,} bytes")
