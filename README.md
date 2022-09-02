# add-write-permissions-for-codeowners

[![CI](https://github.com/Archetypically/add-write-permissions-for-codeowners/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Archetypically/add-write-permissions-for-codeowners/actions/workflows/ci.yml)

This GitHub Action will add write permissions for the missing entries in the CODEOWNERS file.

## Usage

### Example

```yaml
---
name: Format CODEOWNERS

on:
  push:
    branches:
      - main
    paths:
      - 'CODEOWNERS'

jobs:
  add-write-permissions-for-codeowners:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - uses: Archetypically/add-write-permissions-for-codeowners@v1
      id: add-write-permissions-for-codeowners
      with:
        # Optional. The path to the CODEOWNERS file to format. Will auto-detect if not passed in.
        file-path: CODEOWNERS

        # Optional. Whether or not to actually perform the permissions update. Defaults to false.
        dry-run: false
```

### Parameters

| Name | Description | Default |
| --- | --- | --- |
| `file-path` | The path to the CODEOWNERS file to format. Will auto-detect if not passed in. | `CODEOWNERS` |
| `dry-run` | Whether or not to actually perform the permissions update. | `false` |

## Development

_This repository intentionally does not use `act` for local development to reduce complexity._

Inputs are controlled via environment variables defined in `development/.env.development`.

Run the action using:

```shell
yarn action
```

which will operate on the file at `development/CODEOWNERS`.

Run the tests using:

```shell
yarn test
```

## Credits

- [Evan Lee](https://evanlee.engineer) ([@Archetypically](https://github.com/Archetypically))

## License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.