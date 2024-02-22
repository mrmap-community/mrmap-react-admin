module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "standard-with-typescript",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json"
    },
    "plugins": [
        "react",
        "simple-import-sort",
        "react-hooks",
    ],
    "rules": {
        "simple-import-sort/imports": [
            "error",
            {
                groups: [
                    ["^react"],
                    ["^@?\\w"],
                    ["@/(.*)"],
                    ["^[./]"]
                ]
            }
        ],
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"

    },
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "ignorePatterns": ["**/vite-env.d.ts"],
    "rules": {

    }
}
