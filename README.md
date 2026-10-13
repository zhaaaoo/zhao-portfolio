# zhao-portfolio

Source for [wangzhao.netlify.app](https://wangzhao.netlify.app) and the resume PDF on it.

```
npm install
npm run dev
```

| Script | |
|---|---|
| `npm run build` | type-check and build to `dist/` (Netlify runs this) |
| `npm test` | Playwright: axe checks on both pages, inspect mode |
| `npm run resume` | print `resume/` to `public/wang-zhao-resume.pdf`, failing if it runs past one page |

Content lives in `src/content/`: `resume.ts` feeds both the site and the PDF, `site.ts` is site-only.
