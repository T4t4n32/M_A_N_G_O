# MERGE_CONFLICTS_GUIDE

Guía rápida para detectar y resolver conflictos de merge en M.A.N.G.O.

## Detectar conflictos

```bash
./scripts/check-git-conflicts.sh
```

Si hay conflicto, verás rutas y líneas con marcadores:

- `<<<<<<<`
- `=======`
- `>>>>>>>`

## Resolver conflictos

1. Abre cada archivo reportado.
2. Elige qué bloque conservar (o combina ambos).
3. Elimina los tres marcadores de conflicto.
4. Vuelve a ejecutar el script hasta ver `✅`.
5. Corre validaciones de Fase A:

```bash
./scripts/run-motion-phase-a.sh
```

## Nota

El detector usa marcadores al **inicio de línea** para evitar falsos positivos con líneas decorativas como `=====` en comentarios.
