// @unocss-include
import { getColorPalette, getRgb } from '@sa/color';
import { DARK_CLASS } from '@/constants/app';
import { localStg } from '@/utils/storage';
import { toggleHtmlClass } from '@/utils/common';
import { $t } from '@/locales';

export function setupLoading() {
  const themeColor = localStg.get('themeColor') || '#646cff';
  const darkMode = localStg.get('darkMode') || false;
  const palette = getColorPalette(themeColor);

  const { r, g, b } = getRgb(themeColor);
  const primaryColor = `--primary-color: ${r} ${g} ${b}`;
  const svgCssVars = Array.from(palette.entries())
    .map(([key, value]) => `--logo-color-${key}: ${value}`)
    .join(';');
  const cssVars = `${primaryColor}; ${svgCssVars}`;

  if (darkMode) {
    toggleHtmlClass(DARK_CLASS).add();
  }

  const loadingClasses = [
    'left-0 top-0',
    'left-0 bottom-0 animate-delay-500',
    'right-0 top-0 animate-delay-1000',
    'right-0 bottom-0 animate-delay-1500'
  ];

  const dot = loadingClasses
    .map(item => `<div class="absolute w-16px h-16px bg-primary rounded-8px animate-pulse ${item}"></div>`)
    .join('\n');

  const loading = `
<div class="fixed-center flex-col bg-layout" style="${cssVars}">
  <div class="w-128px h-128px">
    ${getLogoSvg()}
  </div>
  <div class="w-56px h-56px my-36px">
    <div class="relative h-full animate-spin">
      ${dot}
    </div>
  </div>
  <h2 class="text-28px font-500 text-primary">${$t('system.title')}</h2>
</div>`;

  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = loading;
  }
}

function getLogoSvg() {
  return `<svg width="100%" height="100%" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ForumFlow">
    <path fill="var(--logo-color-500)" d="M32 12h96c13.255 0 24 10.745 24 24v72c0 13.255-10.745 24-24 24H74l-32 20 6-20H32c-13.255 0-24-10.745-24-24V36c0-13.255 10.745-24 24-24Z" />
    <path fill="none" stroke="var(--logo-color-300)" stroke-linecap="round" stroke-width="8" opacity="0.65" d="M25 51c0-13.807 11.193-25 25-25h61" />
    <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="12" d="M55 108V61c0-12.703 10.297-23 23-23h38" />
    <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="12" d="M56 69h42c10 0 18-4 24-12" />
    <path fill="none" stroke="var(--logo-color-300)" stroke-linecap="round" stroke-linejoin="round" stroke-width="12" d="M56 95h31c10 0 18-3 24-9" />
  </svg>`;
}
