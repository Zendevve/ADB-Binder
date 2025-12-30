# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Batch Rename**: Added a Regex-based batch renaming tool for chapters in the Arrange Step.
- **Export Enhancements**:
    - Native Drag-and-Drop support for exported files.
    - "Add to Apple Music" integration (macOS/Windows).
- **Performance**:
    - Memoized track lists for smoother sorting.
    - Debounced rename previews to prevent UI lag.

### Fixed
- Removed awkward transparent fade in the Navigation and Title bars by using a solid background color.

## [0.2.0] - 2024-05-20

### Added
- Initial release of Basic Wizard:
    - Audiobook Binding (Upload, Sort, Export).
    - Format Converter.
    - Chapter Splitter (Basic).
- Audio Analyzer integration (silence detection).
- Project Save/Load functionality (`.abk` JSON files).
