import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/admin/**/*.{js,ts,jsx,tsx}',
    './app/admin/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#092147',
        teal: '#39B2AD',
        red: '#CD0039',
      },
    },
  },
  plugins: [],
}

export default config
