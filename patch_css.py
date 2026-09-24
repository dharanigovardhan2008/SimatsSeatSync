content = open('src/index.css', 'r', encoding='utf-8').read()
content = content.replace('@import "tailwindcss";\n@import "tailwindcss";', '@import "tailwindcss";')
open('src/index.css', 'w', encoding='utf-8').write(content)

