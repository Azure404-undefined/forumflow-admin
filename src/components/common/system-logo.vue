<template>
  <div class="app-logo">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ForumFlow"
    >
      <path
        class="logo-surface"
        d="M32 12h96c13.255 0 24 10.745 24 24v72c0 13.255-10.745 24-24 24H74l-32 20 6-20H32c-13.255 0-24-10.745-24-24V36c0-13.255 10.745-24 24-24Z"
      />
      <path class="logo-highlight" d="M25 51c0-13.807 11.193-25 25-25h61" />
      <path class="logo-letter" d="M55 108V61c0-12.703 10.297-23 23-23h38" />
      <path class="logo-letter" d="M56 69h42c10 0 18-4 24-12" />
      <path class="logo-letter logo-letter-soft" d="M56 95h31c10 0 18-3 24-9" />
    </svg>
  </div>
</template>

<style scoped>
.app-logo {
  --logo-color-300: rgb(var(--primary-300-color));
  --logo-color-500: rgb(var(--primary-500-color));
  --logo-color-700: rgb(var(--primary-700-color));
}

.logo-surface {
  fill: var(--logo-color-500);
}

.logo-highlight {
  fill: none;
  stroke: var(--logo-color-300);
  stroke-linecap: round;
  stroke-width: 8;
  opacity: 0.65;
}

.logo-letter {
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 12;
}

.logo-letter-soft {
  stroke: color-mix(in srgb, #fff 76%, var(--logo-color-300));
}
</style>
