/*
 * @Author: lmk
 * @Date: 2022-05-02 15:07:13
 * @LastEditTime: 2022-05-02 15:43:42
 * @LastEditors: lmk
 * @Description:
 */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    spacing: Array.from({ length: 1200 }).reduce((map, _, index) => {
      map[index] = `${index}px`;
      return map;
    }, {}),
    extend: {
      fontSize: ({ theme }) => ({
        ...theme("spacing"),
      }),
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
