export default {
  extends: [
    'react-app',
    'react-app/jest',
    'airbnb',
    'airbnb/hooks'
  ],
  rules: {
    "no-trailing-spaces": "error",
    "consistent-return": "error",
    "arrow-parens": ["error", "always"],
    "arrow-body-style": ["error", "as-needed"],
    "linebreak-style": 0,
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-empty-function": "off",
    "comma-dangle": ["error", "always-multiline"],
    "import/extensions": ["error", "ignorePackages", { "js": "never", "jsx": "never", "ts": "never", "tsx": "never" }],
    "import/no-extraneous-dependencies": ["error", { "devDependencies": true }],
    "jsx-a11y/alt-text": "off",
    "max-len": ["error", { "code": 120, "tabWidth": 2, "ignoreComments": true, "ignoreTrailingComments": true, "ignoreUrls": true, "ignoreStrings": true, "ignoreTemplateLiterals": true, "ignoreRegExpLiterals": true }],
    "no-duplicate-imports": "error",
    "no-empty": "off",
    "no-plusplus": "off",
    "no-shadow": "off",
    "quotes": ["warn", "double"],
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react/function-component-definition": "off",
    "react/jsx-filename-extension": ["error", { "extensions": [".tsx"] }],
    "react/jsx-indent-props": ["error", 2],
    "react/jsx-props-no-spreading": "off",
    "react/react-in-jsx-scope": "off",
    "object-curly-newline": "off"
  }
};
