# Evaltra website

Static product website and interactive sample demos. No backend, API key, engine binary, external JavaScript library or paid hosting is required.

## Preview and check

Node.js 22 or newer; no dependency installation required.

```sh
npm start
npm run check
npm test
```

Preview: http://127.0.0.1:4311/evaltra-website/

These checks cover the website only. They are not Evaltra engine or Excel compatibility tests.

## Publish

GitHub Pages publishes `dist/` when changes reach `main`. The workflow runs the checks before deployment. Repository Settings → Pages → Source must be **GitHub Actions**.

Site: https://oguzhankkaraca.github.io/evaltra-website/

Edit the files in `dist/`, run the checks, and push to `main`. Public GitHub Pages hosting and standard GitHub Actions runners for this public repository use GitHub's free offering, subject to its limits.

## Demo scope

- Revenue: six illustrative months, computed using small JavaScript functions.
- Sales: a fixed synthetic dataset with interactive filters.
- Formula examples: four explicitly supported presets with editable numeric inputs. This is not a general formula parser or the Evaltra engine.
- Dependency comparison: prepared Evaltra example outputs beside the existing Excel/static-engine reference file captured on 2026-09-28. Nothing is recalculated by those engines on the public site.

The public repository contains only reviewed static site files and publishing support. Local native service experiments, private artifacts, research notes and runtime files are excluded.
