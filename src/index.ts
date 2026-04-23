/**
 * Dragble Angular Editor
 *
 * Angular wrapper for the Dragble Editor SDK.
 *
 * @packageDocumentation
 */

// Export the component
export { DragbleEditorComponent } from "./dragble-editor.component";
export type { EditorContentTypeValue } from "./dragble-editor.component";

// Export the module
export { DragbleEditorModule } from "./dragble-editor.module";

// Re-export all SDK types from the shared types package
export * from "dragble-types";
