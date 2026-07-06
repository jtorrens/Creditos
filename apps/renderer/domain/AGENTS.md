# Domain Rules

Domain modules are pure data modules.

They may normalize, transform, merge, paginate, and build render data.

They must not:

- touch DOM;
- read UI inputs;
- call nativeBridge;
- call fetch;
- autosave;
- show alerts;
- mutate global app state directly.
