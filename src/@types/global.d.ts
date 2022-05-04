// Defined by webpack on startup or compilation
declare const __COMMIT_HASH__: string;

// When using file-loader, we'll get a path to the resource
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "!!raw-loader!*" {
  const contents: string;
  export default contents;
}

// Achievements communicated back to Electron shell for Steam.
declare interface Document {
  achievements: string[];
}

declare module "tslib:*" {
  const _default: string;
  export default _default;
}
