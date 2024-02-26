# Tracking code analysis javascript action

Checks all edited files compared to PR target, and adds Data foundation as a reviewer if any changed files contain top events implementation

## Inputs

### `changedFiles`

**Required** A string containing the list of changed files in PR

### `token`

**Required** Github token for api

## Example usage

```yaml
  - id: checkout
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
      ref: ${{ github.event.pull_request.head.sha }}
  - name: get diff files
    id: diff
    run: echo "changedFiles=$(git diff --name-only origin/master...HEAD | grep -P '\.(ts|js)$' | xargs)" >> $GITHUB_OUTPUT
  - name: analyze diff files
    uses: actions/tracking-code-analysis
    with:
      changedFiles: ${{ steps.diff.outputs.changedFiles }}
      token: ${{secrets.GITHUB_TOKEN}}
```

## Updating the list of top tier events and contexts

Ask someone from Data foundation to give you directus API token

Place it in `config.json`

Make sure you're on the omio network
then run
`yarn install && yarn cms-update`