module.exports = {
    "env": {
        "browser": true,
        "es2020": true
    },
    "extends": [
      "plugin:vue/essential",

//        "@merpay/nuxt-typescript",
      "plugin:prettier/recommended",
//      "prettier/vue,
    ],
    "parserOptions": {
        "parser": "@typescript-eslint/parser",
    },
    "plugins": [
//        "vue",
//        "@typescript-eslint"
    ],
    "rules": {
      "no-useless-constructor": 0,
      "max-depth": 1,
      "destroy-filter": 1,
    },
};
