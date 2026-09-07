# MengTo Skills — Project Installation

This project includes a project-local import of the [MengTo/Skills](https://github.com/MengTo/Skills) library.

- Source: `https://github.com/MengTo/Skills`
- Imported revision: `321c769739b823de5eb94eb3a52aa1974fe783a2`
- Imported skills: 132
- Installation location: `.agents/skills/<skill-name>/`

Each skill is an independent, editable folder. Its `SKILL.md` is the instruction entry point; optional `REFERENCES.md`, `ARTICLE.md`, `assets/`, `scripts/`, and `demo/` files are preserved with it. Project-specific adjustments should be made in the individual skill folder so the change is reviewed and versioned with the site.

## Updating the upstream library

The ignored local checkout at `.agents/mengto-skills-source/` is only an update workspace. Pull its `main` branch, review the file-level diff against `.agents/skills/`, then copy only the desired skill folders into `.agents/skills/`. Do not overwrite a locally customized skill without reviewing its changes first.

## Using a skill

Choose the narrowest matching skill, read its `SKILL.md` before making changes, and follow any linked references only when they are relevant. For this site, likely entry points include `threejs`, `threejs-landscape`, `atmosphere-background`, `cinematic-scroll-storytelling`, `optimize-web-animations`, and `stitched-full-page-capture`.
