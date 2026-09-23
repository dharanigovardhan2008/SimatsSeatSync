import sys
content = open('src/components/ui/CodeSlots.tsx').read()

content = content.replace(
    r"const digitsOf = (raw: string | undefined) => String(raw ?? '').replace(/\D/g, '');",
    r"const charsOf = (raw: string | undefined) => String(raw ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();"
)
content = content.replace('digitsOf(', 'charsOf(')
content = content.replace('inputMode="numeric"', 'inputMode="text"')
content = content.replace('pattern="[0-9]*"', '')
content = content.replace('/^[0-9]$/.test(k)', '/^[a-zA-Z0-9]$/.test(k)')
content = content.replace('insert(k);', 'insert(k.toUpperCase());')
content = content.replace('digits entered', 'characters entered')

open('src/components/ui/CodeSlots.tsx', 'w').write(content)

