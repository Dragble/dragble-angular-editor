/**
 * Dragble Editor Angular Component
 *
 * An Angular wrapper for the Dragble Editor SDK.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from "@angular/core";

type DragbleSDK = any;
type DragbleConfig = any;
type EditorOptions = any;
type DragbleCallbacks = any;
type DesignJson = any;
type ModuleData = any;
type Module = any;
type ExportHtmlOptions = any;
type ExportImageOptions = any;
type ExportImageData = any;
type ExportPdfOptions = any;
type ExportPdfData = any;
type ExportZipOptions = any;
type ExportZipData = any;
type PopupConfig = any;
type PopupValues = any;
type MergeTag = any;
type MergeTagGroup = any;
type MergeTagsConfig = any;
type SpecialLink = any;
type SpecialLinkGroup = any;
type SpecialLinksConfig = any;
type FontsConfig = any;
type Language = any;
type AppearanceConfig = any;
type ToolsConfig = any;
type FeaturesConfig = any;
type AIConfig = any;
type EditorBehaviorConfig = any;
type DisplayConditionsConfig = any;
type EditorMode = any;
type EditorEventName = any;
type ViewMode = any;
type TextDirection = any;
type DragbleToolConfig = any;
type DragbleWidgetConfig = any;
type AuditResult = any;
type AuditOptions = any;
type AuditCallback = any;
type CollaborationFeaturesConfig = any;
type CommentAction = any;
type UserInfo = any;

// ============================================================================
// SDK Loading
// ============================================================================

declare global {
  interface Window {
    dragble?: DragbleSDK;
    createEditor?: () => DragbleSDK;
  }
}

const SDK_CDN_URL = "https://sdk.dragble.com/latest/dragble-sdk.min.js";

interface SDKModule {
  dragble: DragbleSDK;
  createEditor: (config: DragbleConfig) => DragbleSDK;
  DragbleSDK: new () => DragbleSDK;
}

// Map of URL -> Promise for caching SDK loads per URL
const sdkLoadPromises: Map<string, Promise<SDKModule>> = new Map();

/**
 * Get the SDK URL to use.
 * @param customUrl - Optional custom SDK URL
 * @returns The SDK URL to load
 */
function getSDKUrl(customUrl?: string, sdkVersion?: string): string {
  if (customUrl && sdkVersion !== undefined) {
    console.warn("[DragbleEditor] sdkVersion is ignored when sdkUrl is provided.");
  }

  return customUrl ?? `https://sdk.dragble.com/${sdkVersion ?? "latest"}/dragble-sdk.min.js`;
}

/**
 * Create an SDK module from the global dragble object.
 */
function createSDKModuleFromGlobal(): SDKModule {
  return {
    dragble: (window as any).dragble,
    createEditor: (config: DragbleConfig) => {
      const instance = new (window as any).dragble.constructor();
      instance.init(config);
      return instance;
    },
    DragbleSDK: (window as any).dragble.constructor,
  };
}

/**
 * Load the SDK from a URL.
 * Supports custom SDK URLs for enterprise self-hosted or specific versions.
 * @param customUrl - Optional custom SDK URL
 */
function loadSDK(customUrl?: string): Promise<SDKModule> {
  const sdkUrl = getSDKUrl(customUrl);

  // Check cache for this specific URL
  const cachedPromise = sdkLoadPromises.get(sdkUrl);
  if (cachedPromise) return cachedPromise;

  // Check if already loaded globally (only for default URL to avoid conflicts)
  if (sdkUrl === SDK_CDN_URL && typeof window !== "undefined" && (window as any).dragble) {
    return Promise.resolve(createSDKModuleFromGlobal());
  }

  return loadSDKScript(sdkUrl);
}

/**
 * Load the SDK script from a specific URL.
 * Each unique URL is cached separately to support multiple SDK sources.
 * @param sdkUrl - The SDK URL to load
 */
function loadSDKScript(sdkUrl: string): Promise<SDKModule> {
  // Check cache for this specific URL
  const cachedPromise = sdkLoadPromises.get(sdkUrl);
  if (cachedPromise) return cachedPromise;

  const loadPromise = new Promise<SDKModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;

    script.onload = () => {
      if ((window as any).dragble) {
        // Resolve with SDK module interface
        resolve(createSDKModuleFromGlobal());
      } else {
        sdkLoadPromises.delete(sdkUrl);
        reject(
          new Error("Failed to load Dragble SDK - createEditor not found"),
        );
      }
    };

    script.onerror = () => {
      sdkLoadPromises.delete(sdkUrl);
      reject(new Error(`Failed to load Dragble SDK from ${sdkUrl}`));
    };

    document.head.appendChild(script);
  });

  // Cache the promise for this URL
  sdkLoadPromises.set(sdkUrl, loadPromise);

  return loadPromise;
}

// ============================================================================
// Content Type
// ============================================================================

export type EditorContentTypeValue = "module";

// ============================================================================
// Component
// ============================================================================

/**
 * DragbleEditorComponent
 *
 * @example
 * ```html
 * <dragble-editor
 *   editorKey="your-editor-key"
 *   editorMode="email"
 *   (ready)="onReady($event)"
 *   (change)="onChange($event)"
 * ></dragble-editor>
 * ```
 *
 * @example
 * ```typescript
 * import { Component, ViewChild } from '@angular/core';
 * import { DragbleEditorComponent } from '@dragble/angular-editor';
 *
 * @Component({
 *   selector: 'app-editor',
 *   template: `
 *     <dragble-editor
 *       #editor
 *       editorKey="your-editor-key"
 *       (ready)="onReady($event)"
 *     ></dragble-editor>
 *     <button (click)="handleSave()">Save</button>
 *   `
 * })
 * export class EditorComponent {
 *   @ViewChild('editor') editor!: DragbleEditorComponent;
 *
 *   onReady(sdk: DragbleSDK) {
 *     console.log('Editor ready!', sdk);
 *   }
 *
 *   handleSave() {
 *     this.editor.saveDesign((design) => {
 *       console.log('Design:', design);
 *     });
 *   }
 * }
 * ```
 */
@Component({
  selector: "dragble-editor",
  template: `<div
    #container
    [id]="containerId"
    [style.width]="'100%'"
    [style.height]="computedHeight"
    [style.minHeight]="computedMinHeight"
  ></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  standalone: true,
})
export class DragbleEditorComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  // ========================================================================
  // Inputs
  // ========================================================================

  /** Editor key for authentication (required) */
  @Input() editorKey!: string;

  /** Initial design to load */
  @Input() design?: DesignJson | ModuleData | null;

  /** Editor mode (email, web, popup) */
  @Input() editorMode: EditorMode = "email";

  /** Popup builder configuration (only used when editorMode is 'popup') */
  @Input() popup?: PopupConfig;

  /** Content type: 'module' for single-row mode */
  @Input() contentType?: EditorContentTypeValue;

  /** AI features configuration */
  @Input() ai?: AIConfig;

  /** UI language/locale */
  @Input() locale?: string;

  /**
   * Custom translation overrides keyed by locale code.
   * Each locale maps translation keys to translated strings,
   * allowing partial or full override of the editor's built-in UI strings.
   *
   * @example
   * ```ts
   * translations: {
   *   'en-US': { 'toolbar.save': 'Save Draft' },
   *   'fr-FR': { 'toolbar.save': 'Enregistrer le brouillon' },
   * }
   * ```
   */
  @Input() translations?: Record<string, Record<string, string>>;

  /** Text direction (ltr, rtl) */
  @Input() textDirection?: TextDirection;

  /** Template language for multi-language support */
  @Input() language?: Language;

  /** Visual customization */
  @Input() appearance?: AppearanceConfig;

  /** Enable/disable tools */
  @Input() tools?: ToolsConfig;

  /** Custom tools to register (Dragble-style) */
  @Input() customTools?: DragbleToolConfig[];

  /** Feature toggles */
  @Input() features?: FeaturesConfig;

  /** Merge tags configuration */
  @Input() mergeTags?: MergeTagsConfig;

  /** Special links configuration */
  @Input() specialLinks?: SpecialLinksConfig;

  /** Custom modules */
  @Input() modules?: Module[];

  /** Display conditions configuration */
  @Input() displayConditions?: DisplayConditionsConfig;

  /** Editor behavior configuration */
  @Input() editor?: EditorBehaviorConfig;

  /** Fonts configuration */
  @Input() fonts?: FontsConfig;

  /** Default body/canvas values applied on init */
  @Input() bodyValues?: Record<string, unknown>;

  /** Header row JSON to inject as a locked, non-editable row at the top */
  @Input() header?: unknown;

  /** Footer row JSON to inject as a locked, non-editable row at the bottom */
  @Input() footer?: unknown;

  /** Custom CSS URLs or inline styles */
  @Input() customCSS?: string[];

  /** Custom JS URLs or inline scripts */
  @Input() customJS?: string[];

  /** Height of the editor */
  @Input() height: string | number = "600px";

  /** Minimum height for the editor */
  @Input() minHeight: string | number = "600px";

  /** Additional editor options (merged into options) */
  @Input() options?: Partial<EditorOptions>;

  /**
   * Callbacks for editor events (minus onReady/onLoad/onChange/onError which use Angular outputs).
   * Includes: linkClick, onModuleSave, onPreview, onHeaderRowClick, onFooterRowClick,
   * onLockedRowClick, onContentDialog.
   */
  @Input() callbacks?: Omit<
    DragbleCallbacks,
    "onReady" | "onLoad" | "onChange" | "onError"
  >;

  /**
   * Custom SDK URL for loading the Dragble SDK script.
   * Use this for enterprise self-hosted SDK or specific versions.
   * @default "https://sdk.dragble.com/latest/dragble-sdk.min.js"
   */
  @Input() sdkUrl?: string;

  /**
   * SDK version to load from the Dragble CDN.
   * @default "latest"
   */
  @Input() sdkVersion?: string;

  /** Editor version forwarded to the SDK init config. */
  @Input() editorVersion?: string;

  /** Editor URL forwarded to the SDK init config. */
  @Input() editorUrl?: string;

  /**
   * Team collaboration features (commenting, reviewer role, etc.)
   * Can be a simple boolean or detailed configuration object.
   * Only works with editorMode 'email' or 'web'.
   * @default false
   */
  @Input() collaboration?: boolean | CollaborationFeaturesConfig;

  /** User information for session identity and collaboration */
  @Input() user?: UserInfo;

  /**
   * Design mode for template permissions.
   * - 'edit': Admin mode - shows "Row Actions" for setting row permissions
   * - 'live': End-user mode - enforces row permissions
   * @default 'live'
   */
  @Input() designMode?: "edit" | "live";

  // ========================================================================
  // Outputs
  // ========================================================================

  /** Emitted when the editor is ready */
  @Output() ready = new EventEmitter<DragbleSDK>();

  /** Emitted when a design is loaded */
  @Output() load = new EventEmitter<unknown>();

  /** Emitted when the design changes */
  @Output() change = new EventEmitter<{ design: DesignJson; type: string }>();

  /** Emitted when an error occurs */
  @Output() error = new EventEmitter<Error>();

  /** Emitted when a comment event occurs (create, edit, delete, resolve, reopen) */
  @Output() commentAction = new EventEmitter<CommentAction>();

  // ========================================================================
  // Internal State
  // ========================================================================

  containerId = `dragble-editor-${Math.random().toString(36).substr(2, 9)}`;
  private sdk: DragbleSDK | null = null;
  private _isReady = false;

  get isReady(): boolean {
    return this._isReady;
  }

  get computedHeight(): string {
    return typeof this.height === "number" ? `${this.height}px` : this.height;
  }

  get computedMinHeight(): string {
    return typeof this.minHeight === "number"
      ? `${this.minHeight}px`
      : this.minHeight;
  }

  // ========================================================================
  // Lifecycle
  // ========================================================================

  ngOnInit(): void {
    // Initialization happens in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.sdk || !this._isReady) return;

    // Watch for design changes
    if (changes["design"] && !changes["design"].firstChange) {
      const newDesign = changes["design"].currentValue;
      if (newDesign) {
        this.sdk.loadDesign(newDesign as DesignJson);
      }
    }

    // Watch for merge tags changes
    if (changes["mergeTags"] && !changes["mergeTags"].firstChange) {
      const newTags = changes["mergeTags"].currentValue as MergeTagsConfig;
      if (newTags) {
        this.sdk.setMergeTags(newTags);
      }
    }

    // Watch for modules changes
    if (changes["modules"] && !changes["modules"].firstChange) {
      const newModules = changes["modules"].currentValue;
      if (newModules) {
        this.sdk.setModules(newModules);
      }
    }

    // Watch for display conditions changes
    if (
      changes["displayConditions"] &&
      !changes["displayConditions"].firstChange
    ) {
      const newConditions = changes["displayConditions"].currentValue;
      if (newConditions) {
        this.sdk.setDisplayConditions(newConditions);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sdk) {
      this.sdk.destroy();
      this.sdk = null;
    }
  }

  // ========================================================================
  // Initialization
  // ========================================================================

  private async initializeEditor(): Promise<void> {
    try {
      const resolvedSdkUrl = getSDKUrl(this.sdkUrl, this.sdkVersion);
      const { createEditor } = await loadSDK(resolvedSdkUrl);
      const config = this.buildConfig();
      const sdk = createEditor(config);
      this.sdk = sdk;

      // Set up event listeners
      sdk.addEventListener("editor:ready", () => {
        this._isReady = true;
        this.ready.emit(sdk);
      });

      sdk.addEventListener("design:loaded", (data: unknown) => {
        this.load.emit(data);
      });

      sdk.addEventListener(
        "design:updated",
        (data: { design: DesignJson; type: string }) => {
          this.change.emit(data);
        },
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Initialization error:", error.message);
      this.error.emit(error);
    }
  }

  private buildConfig(): DragbleConfig {
    const editorConfig =
      this.contentType === "module"
        ? {
            ...this.editor,
            contentType: this.contentType as "module",
            minRows: 1,
            maxRows: 1,
          }
        : this.editor;

    // Build collaboration feature config
    let featuresConfig = this.features;
    if (this.collaboration !== undefined) {
      const collaborationConfig =
        typeof this.collaboration === "object"
          ? {
              ...this.collaboration,
              onComment: (action: CommentAction) => {
                this.commentAction.emit(action);
              },
            }
          : this.collaboration;
      featuresConfig = {
        ...featuresConfig,
        collaboration: collaborationConfig,
      };
    }

    // Build callbacks (merge Angular outputs with user-provided callbacks)
    const callbacks: DragbleCallbacks = {
      ...this.callbacks,
    };

    // Build nested options object
    const editorOptions: EditorOptions = {
      ...(this.user !== undefined && { user: this.user }),
      ...(this.locale !== undefined && { locale: this.locale }),
      ...(this.translations !== undefined && {
        translations: this.translations,
      }),
      ...(this.textDirection !== undefined && {
        textDirection: this.textDirection,
      }),
      ...(this.language !== undefined && { language: this.language }),
      height: this.height,
      minHeight: this.minHeight,
      ...(this.mergeTags !== undefined && { mergeTags: this.mergeTags }),
      ...(this.specialLinks !== undefined && {
        specialLinks: this.specialLinks,
      }),
      ...(this.modules !== undefined && { modules: this.modules }),
      ...(this.displayConditions !== undefined && {
        displayConditions: this.displayConditions,
      }),
      ...(this.appearance !== undefined && { appearance: this.appearance }),
      ...(this.tools !== undefined && { tools: this.tools }),
      ...(this.customTools !== undefined && { customTools: this.customTools }),
      ...(this.fonts !== undefined && { fonts: this.fonts }),
      ...(this.bodyValues !== undefined && { bodyValues: this.bodyValues }),
      ...(this.header !== undefined && { header: this.header }),
      ...(this.footer !== undefined && { footer: this.footer }),
      ...(editorConfig !== undefined && { editor: editorConfig }),
      ...(this.customCSS !== undefined && { customCSS: this.customCSS }),
      ...(this.customJS !== undefined && { customJS: this.customJS }),
      ...(featuresConfig !== undefined && { features: featuresConfig }),
      ...(this.ai !== undefined && { ai: this.ai }),
      ...this.options,
    };

    return {
      containerId: this.containerId,
      editorKey: this.editorKey,
      ...(this.editorMode !== undefined && { editorMode: this.editorMode }),
      ...(this.designMode !== undefined && { designMode: this.designMode }),
      ...(this.design !== undefined && { design: this.design as DesignJson }),
      ...(this.popup !== undefined && { popup: this.popup }),
      ...(this.editorVersion !== undefined && {
        editorVersion: this.editorVersion,
      }),
      ...(this.editorUrl !== undefined && { editorUrl: this.editorUrl }),
      callbacks,
      options: editorOptions,
    };
  }

  // ========================================================================
  // Public Methods - Full SDK pass-through
  // ========================================================================

  /** Get the underlying SDK instance */
  getEditor(): DragbleSDK | null {
    return this.sdk;
  }

  // Design methods
  loadDesign(
    design: DesignJson,
    options?: { preserveHistory?: boolean },
  ): void {
    this.sdk?.loadDesign(design, options);
  }

  loadBlank(): void {
    this.sdk?.loadBlank();
  }

  saveDesign(callback: (design: DesignJson) => void): void {
    this.sdk?.saveDesign(callback);
  }

  getDesign(): Promise<{ html: string; json: DesignJson }> | undefined {
    return this.sdk?.getDesign();
  }

  // Export methods (async-only)
  exportHtml(options?: ExportHtmlOptions): Promise<string> | undefined {
    return this.sdk?.exportHtml(options);
  }

  exportPlainText(): Promise<string> | undefined {
    return this.sdk?.exportPlainText();
  }

  exportJson(): Promise<DesignJson> | undefined {
    return this.sdk?.exportJson();
  }

  exportImage(
    options?: ExportImageOptions,
  ): Promise<ExportImageData> | undefined {
    return this.sdk?.exportImage(options);
  }

  exportPdf(options?: ExportPdfOptions): Promise<ExportPdfData> | undefined {
    return this.sdk?.exportPdf(options);
  }

  exportZip(options?: ExportZipOptions): Promise<ExportZipData> | undefined {
    return this.sdk?.exportZip(options);
  }

  getPopupValues(): Promise<PopupValues | null> | undefined {
    return this.sdk?.getPopupValues();
  }

  // Merge tags
  setMergeTags(config: MergeTagsConfig): void {
    this.sdk?.setMergeTags(config);
  }

  getMergeTags(): Promise<(MergeTag | MergeTagGroup)[]> | undefined {
    return this.sdk?.getMergeTags();
  }

  // Special links
  setSpecialLinks(config: SpecialLinksConfig): void {
    this.sdk?.setSpecialLinks(config);
  }

  getSpecialLinks(): Promise<(SpecialLink | SpecialLinkGroup)[]> | undefined {
    return this.sdk?.getSpecialLinks();
  }

  // Modules
  setModulesLoading(loading: boolean): void {
    this.sdk?.setModulesLoading(loading);
  }

  setModules(modules: Module[]): void {
    this.sdk?.setModules(modules);
  }

  getModules(): Promise<Module[]> | undefined {
    return this.sdk?.getModules();
  }

  // Fonts
  setFonts(config: FontsConfig): void {
    this.sdk?.setFonts(config);
  }

  getFonts(): Promise<FontsConfig> | undefined {
    return this.sdk?.getFonts();
  }

  // Body values
  setBodyValues(values: Record<string, unknown>): void {
    this.sdk?.setBodyValues(values);
  }

  getBodyValues(): Promise<Record<string, unknown>> | undefined {
    return this.sdk?.getBodyValues();
  }

  // Configuration
  setOptions(options: Partial<EditorOptions>): void {
    this.sdk?.setOptions(options);
  }

  setToolsConfig(config: ToolsConfig): void {
    this.sdk?.setToolsConfig(config);
  }

  setEditorMode(mode: EditorMode): void {
    this.sdk?.setEditorMode(mode);
  }

  setEditorConfig(config: EditorBehaviorConfig): void {
    this.sdk?.setEditorConfig(config);
  }

  getEditorConfig(): Promise<EditorBehaviorConfig> | undefined {
    return this.sdk?.getEditorConfig();
  }

  setLocale(locale: string): void {
    this.sdk?.setLocale(locale);
  }

  setTextDirection(direction: TextDirection): void {
    this.sdk?.setTextDirection(direction);
  }

  setAppearance(config: AppearanceConfig): void {
    this.sdk?.setAppearance(config);
  }

  setCustomCSS(css: string[]): void {
    this.sdk?.setCustomCSS(css);
  }

  setCustomJS(js: string[]): void {
    this.sdk?.setCustomJS(js);
  }

  // Multi-language
  setLanguage(language: Language): void {
    this.sdk?.setLanguage(language);
  }

  getLanguage(): Promise<Language | null> | undefined {
    return this.sdk?.getLanguage();
  }

  // Undo/Redo
  undo(): void {
    this.sdk?.undo();
  }

  redo(): void {
    this.sdk?.redo();
  }

  save(): void {
    this.sdk?.save();
  }

  // Preview
  showPreview(device?: ViewMode): void {
    this.sdk?.showPreview(device);
  }

  hidePreview(): void {
    this.sdk?.hidePreview();
  }

  // Tools
  registerTool(config: unknown): Promise<void> | undefined {
    return this.sdk?.registerTool(config);
  }

  unregisterTool(toolId: string): Promise<void> | undefined {
    return this.sdk?.unregisterTool(toolId);
  }

  getTools():
    | Promise<Array<{ id: string; label: string; baseToolType: string }>>
    | undefined {
    return this.sdk?.getTools();
  }

  // Display conditions
  setDisplayConditions(config: DisplayConditionsConfig): void {
    this.sdk?.setDisplayConditions(config);
  }

  // Audit
  audit(callback: AuditCallback): void;
  audit(options: AuditOptions, callback: AuditCallback): void;
  audit(options?: AuditOptions): Promise<AuditResult> | undefined;
  audit(
    optionsOrCallback?: AuditOptions | AuditCallback,
    callback?: AuditCallback,
  ): Promise<AuditResult> | undefined | void {
    if (typeof optionsOrCallback === "function") {
      return this.sdk?.audit(optionsOrCallback);
    }
    if (callback) {
      return this.sdk?.audit(optionsOrCallback as AuditOptions, callback);
    }
    return this.sdk?.audit(optionsOrCallback);
  }

  // Collaboration
  showComment(commentId: string): void {
    this.sdk?.showComment(commentId);
  }

  openCommentPanel(rowId: string): void {
    this.sdk?.openCommentPanel(rowId);
  }

  // Events
  addEventListener<T = unknown>(
    event: EditorEventName,
    callback: (data: T) => void,
  ): (() => void) | undefined {
    return this.sdk?.addEventListener(event, callback);
  }

  removeEventListener<T = unknown>(
    event: EditorEventName,
    callback: (data: T) => void,
  ): void {
    this.sdk?.removeEventListener(event, callback);
  }

  // Advanced
  registerColumns(cells: number[]): void {
    this.sdk?.registerColumns(cells);
  }

  setBrandingColors(config: {
    colors?:
      | string[]
      | Array<{
          id: string;
          label?: string;
          colors: string[];
          default?: boolean;
        }>;
    recentColors?: boolean;
  }): void {
    this.sdk?.setBrandingColors(config);
  }

  // Custom widgets
  createWidget(
    config: DragbleWidgetConfig | unknown,
  ): Promise<void> | undefined {
    return this.sdk?.createWidget(config);
  }

  removeWidget(widgetName: string): Promise<void> | undefined {
    return this.sdk?.removeWidget(widgetName);
  }

  // Undo/Redo state
  canUndo(): Promise<boolean> | undefined {
    return this.sdk?.canUndo();
  }

  canRedo(): Promise<boolean> | undefined {
    return this.sdk?.canRedo();
  }

  // Tabs
  updateTabs(tabs: Record<string, { visible?: boolean }>): void {
    this.sdk?.updateTabs(tabs);
  }
}
