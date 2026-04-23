/**
 * Dragble Editor Angular Module
 *
 * This module is provided for backwards compatibility with non-standalone Angular apps.
 * For Angular 14+ apps using standalone components, you can import DragbleEditorComponent directly.
 */

import { NgModule } from "@angular/core";
import { DragbleEditorComponent } from "./dragble-editor.component";

@NgModule({
  imports: [DragbleEditorComponent],
  exports: [DragbleEditorComponent],
})
export class DragbleEditorModule {}
