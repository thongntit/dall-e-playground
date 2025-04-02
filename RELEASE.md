# Release Process

This document outlines the process for creating new releases of the DALL·E Playground.

## Preparing a Release

1. Update the `CHANGELOG.md` file with details about the new version
   - Add a new section at the top of the file with the new version number
   - Format: `## [x.y.z] - YYYY-MM-DD`
   - Document all significant changes, improvements, and bug fixes

2. Commit your changes to the CHANGELOG.md file
   ```bash
   git add CHANGELOG.md
   git commit -m "Update CHANGELOG for version x.y.z"
   ```

## Creating a Release

There are two ways to create a release:

### Method 1: Using npm scripts (Recommended)

We've added convenient npm scripts to handle the version bumping and tag creation:

```bash
# For a patch release (1.0.0 -> 1.0.1)
npm run release

# For a minor release (1.0.0 -> 1.1.0)
npm run release:minor

# For a major release (1.0.0 -> 2.0.0)
npm run release:major
```

These scripts will:
1. Bump the version in package.json
2. Create a git tag
3. Push both the changes and tags to GitHub

### Method 2: Manual process

If you prefer to do it manually:

```bash
# Update version in package.json
npm version [patch|minor|major]

# Push changes
git push

# Push tags
git push --tags
```

## Automatic GitHub Release

Once a new tag is pushed to GitHub, the GitHub Actions workflow will automatically:

1. Create a new release on GitHub
2. Extract the corresponding section from the CHANGELOG.md file
3. Use that content as the release notes
4. Publish the release

## Release Naming Convention

- Tags should follow the format `vX.Y.Z` (e.g., `v1.0.0`, `v1.1.0`, etc.)
- The GitHub Actions workflow is configured to respond only to tags that match this pattern

## GitHub Permissions

Both the release workflow and the branch synchronization workflow use the default `GITHUB_TOKEN` that's automatically provided by GitHub Actions. No additional token configuration is required.

## Post-Release

After a successful release:

1. Verify that the GitHub release was created correctly
2. Update the live preview site if necessary
3. Announce the release to users if appropriate