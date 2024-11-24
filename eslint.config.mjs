/* eslint-disable object-curly-spacing */
import globals from 'globals';
import pluginJs from '@eslint/js';
import airbnbStyle from 'eslint-config-airbnb-base';

export default {
  extends: ['airbnb-base', pluginJs.configs.recommended],
  languageOptions: {
    globals: globals.browser,
  },
};
