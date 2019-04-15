module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["airbnb-base"],
  plugins: ["prettier"],
  rules: {
    "quotes": [2, "single", { "avoidEscape": true }],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "comma-dangle": ["error", "never"],
    "prettier/prettier": "error",
    "implicit-arrow-linebreak": "off",
    "arrow-parens": "off",
    "arrow-body-style": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "consistent-return": "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};
