<div align="center">
  <h1>Forum Admin System</h1>
  <span><a href="./README.md">中文</a> | English</span>
</div>

---

An admin dashboard for a forum / content community, built on top of the [SoybeanAdmin ElementPlus](https://github.com/soybeanjs/soybean-admin-element-plus) template.

## Custom-built features

- **Business pages** (`src/views/`): post list, forum boards, post comments (with detail dialog), reports, roles, users, profile, and a rebuilt home dashboard
- **Business API layer** (`src/service/api/`): 11 modules integrated with Apifox online mocks
- **Global type declarations** (`src/typings/api/`)
- **Component wrappers**: pagination, DOMPurify-safe content rendering (`safeContend.vue`), rich text editor (`richTextEditor.vue`)
- **Responsive design**: full mobile/narrow-screen adaptation

## Tech stack

Vue 3.5 · TypeScript · Vite 7 (rolldown-vite) · Element Plus · Pinia · UnoCSS · pnpm workspace

## Getting started

```bash
# Requirements: Node >= 20.19.0, pnpm >= 8.7.0
pnpm install
cp .env.example .env
pnpm dev        # dev mode (test env, Apifox mock APIs)
pnpm build      # production build
```

## Upstream

Forked from [soybean-admin-element-plus](https://github.com/soybeanjs/soybean-admin-element-plus) (MIT licensed). Demo pages (dashboard / multi-menu, etc.) were removed and replaced with the business features above.

## License

[MIT](./LICENSE)
