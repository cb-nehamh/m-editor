import React, { createContext, useContext, useReducer, type Dispatch } from 'react';

export interface EditorComponent {
  name: string;
  type: string;
  option?: Record<string, any>;
  style?: Record<string, string>;
  child?: EditorComponent[];
}

export type LayoutType = 'fullWidth' | 'twoColumn' | 'sidebar';

export interface LayoutDef {
  type: LayoutType;
  label: string;
  regions: string[];
}

export const LAYOUT_DEFS: LayoutDef[] = [
  { type: 'fullWidth', label: 'Single Column', regions: ['main'] },
  { type: 'twoColumn', label: 'Two Columns', regions: ['left', 'right'] },
  { type: 'sidebar', label: 'Sidebar + Content', regions: ['sidebar', 'content'] },
];

export interface LayoutSection {
  id: string;
  layout: LayoutType;
  splitRatio: number;
  regionComponents: Record<string, EditorComponent[]>;
}

export interface EditorState {
  sections: LayoutSection[];
  activeSectionId: string;
  selectedId: string | null;
  tree: EditorComponent[];
  containerWidth: number;
}

export interface SavedEditorConfig {
  sections: LayoutSection[];
}

export type EditorAction =
  | { type: 'SET_LAYOUT'; payload: LayoutType }
  | { type: 'SET_SPLIT'; payload: number }
  | { type: 'ADD_COMPONENT'; payload: { parentId: string | null; region: string; component: EditorComponent; sectionId?: string } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_OPTION'; payload: { id: string; path: string; value: any } }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; newParentId: string | null; index: number } }
  | { type: 'RESIZE_COMPONENT'; payload: { id: string; dimensions: { width?: number; height?: number; minHeight?: number } } }
  | { type: 'REORDER_WITHIN_REGION'; payload: { sectionId: string; region: string; fromIndex: number; toIndex: number } }
  | { type: 'MOVE_BETWEEN_REGIONS'; payload: { componentId: string; toSectionId: string; toRegion: string; toIndex: number } }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TREE'; payload: EditorComponent[] }
  | { type: 'LOAD_CONFIG'; payload: EditorComponent[] }
  | { type: 'LOAD_FULL'; payload: SavedEditorConfig }
  | { type: 'ADD_SECTION'; payload?: { layout?: LayoutType } }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'SELECT_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_CONTAINER_WIDTH'; payload: number };

function createSection(layout: LayoutType = 'fullWidth'): LayoutSection {
  const def = LAYOUT_DEFS.find((l) => l.type === layout)!;
  const regionComponents: Record<string, EditorComponent[]> = {};
  for (const r of def.regions) regionComponents[r] = [];
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    layout,
    splitRatio: 25,
    regionComponents,
  };
}

const defaultSection = createSection('fullWidth');

const initialState: EditorState = {
  sections: [defaultSection],
  activeSectionId: defaultSection.id,
  selectedId: null,
  tree: [],
  containerWidth: 1100,
};

function setNestedValue(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split('.');
  if (keys.length === 1) return { ...obj, [keys[0]]: value };
  return { ...obj, [keys[0]]: setNestedValue(obj[keys[0]] ?? {}, keys.slice(1).join('.'), value) };
}

function buildSectionTree(section: LayoutSection): EditorComponent {
  const layoutDef = LAYOUT_DEFS.find((l) => l.type === section.layout)!;
  const children: EditorComponent[] = [];
  for (const region of layoutDef.regions) {
    const comps = section.regionComponents[region] ?? [];
    for (const c of comps) {
      children.push({ ...c, option: { ...c.option, region } });
    }
  }
  return {
    name: `portal-layout-${section.id}`,
    type: 'layout',
    option: {
      variant: section.layout,
      split: section.layout === 'sidebar' ? [section.splitRatio, 100 - section.splitRatio] : undefined,
    },
    child: children,
  };
}

function buildTree(sections: LayoutSection[]): EditorComponent[] {
  return sections.map(buildSectionTree);
}

function removeFromRegions(
  regions: Record<string, EditorComponent[]>,
  id: string
): Record<string, EditorComponent[]> {
  const result: Record<string, EditorComponent[]> = {};
  for (const [region, comps] of Object.entries(regions)) {
    result[region] = comps.filter((c) => c.name !== id);
  }
  return result;
}

function updateInRegions(
  regions: Record<string, EditorComponent[]>,
  id: string,
  updater: (node: EditorComponent) => EditorComponent
): Record<string, EditorComponent[]> {
  const result: Record<string, EditorComponent[]> = {};
  for (const [region, comps] of Object.entries(regions)) {
    result[region] = comps.map((c) => (c.name === id ? updater(c) : c));
  }
  return result;
}

function findInRegions(regions: Record<string, EditorComponent[]>, id: string): EditorComponent | null {
  for (const comps of Object.values(regions)) {
    const found = comps.find((c) => c.name === id);
    if (found) return found;
  }
  return null;
}

function findInAllSections(sections: LayoutSection[], id: string): EditorComponent | null {
  for (const section of sections) {
    const found = findInRegions(section.regionComponents, id);
    if (found) return found;
  }
  return null;
}

function updateSection(sections: LayoutSection[], sectionId: string, updater: (s: LayoutSection) => LayoutSection): LayoutSection[] {
  return sections.map((s) => (s.id === sectionId ? updater(s) : s));
}

function updateAllSections(sections: LayoutSection[], id: string, updater: (regions: Record<string, EditorComponent[]>) => Record<string, EditorComponent[]>): LayoutSection[] {
  return sections.map((s) => ({
    ...s,
    regionComponents: updater(s.regionComponents),
  }));
}

function getActiveSection(state: EditorState): LayoutSection | undefined {
  return state.sections.find((s) => s.id === state.activeSectionId);
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LAYOUT': {
      const newLayout = action.payload;
      const newDef = LAYOUT_DEFS.find((l) => l.type === newLayout)!;
      const sections = updateSection(state.sections, state.activeSectionId, (s) => {
        const newRegions: Record<string, EditorComponent[]> = {};
        for (const r of newDef.regions) newRegions[r] = [];
        const allComps = Object.values(s.regionComponents).flat();
        if (allComps.length > 0) {
          newRegions[newDef.regions[0]] = allComps;
        }
        return { ...s, layout: newLayout, regionComponents: newRegions };
      });
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'SET_SPLIT': {
      const splitRatio = action.payload;
      const sections = updateSection(state.sections, state.activeSectionId, (s) => ({
        ...s, splitRatio,
      }));
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'ADD_COMPONENT': {
      const { region, component, sectionId } = action.payload;
      const targetSectionId = sectionId ?? state.activeSectionId;
      const section = state.sections.find((s) => s.id === targetSectionId);
      if (!section) return state;
      const targetRegion = region || LAYOUT_DEFS.find((l) => l.type === section.layout)!.regions[0];
      const sections = updateSection(state.sections, targetSectionId, (s) => ({
        ...s,
        regionComponents: {
          ...s.regionComponents,
          [targetRegion]: [...(s.regionComponents[targetRegion] ?? []), component],
        },
      }));
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'REMOVE_COMPONENT': {
      const sections = updateAllSections(state.sections, action.payload, (regions) =>
        removeFromRegions(regions, action.payload)
      );
      return {
        ...state,
        sections,
        tree: buildTree(sections),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
    }

    case 'UPDATE_OPTION': {
      const { id, path, value } = action.payload;
      const sections = updateAllSections(state.sections, id, (regions) =>
        updateInRegions(regions, id, (node) => ({
          ...node,
          option: setNestedValue(node.option ?? {}, path, value),
        }))
      );
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'MOVE_COMPONENT':
      return state;

    case 'RESIZE_COMPONENT': {
      const { id, dimensions } = action.payload;
      const sections = updateAllSections(state.sections, id, (regions) =>
        updateInRegions(regions, id, (node) => ({
          ...node,
          option: {
            ...node.option,
            dimensions: { ...(node.option?.dimensions ?? {}), ...dimensions },
          },
        }))
      );
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'REORDER_WITHIN_REGION': {
      const { sectionId, region, fromIndex, toIndex } = action.payload;
      const sections = updateSection(state.sections, sectionId, (s) => {
        const comps = [...(s.regionComponents[region] ?? [])];
        const [moved] = comps.splice(fromIndex, 1);
        comps.splice(toIndex, 0, moved);
        return { ...s, regionComponents: { ...s.regionComponents, [region]: comps } };
      });
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'MOVE_BETWEEN_REGIONS': {
      const { componentId, toSectionId, toRegion, toIndex } = action.payload;
      let comp: EditorComponent | null = null;
      let sections = state.sections.map((s) => {
        const newRegions: Record<string, EditorComponent[]> = {};
        for (const [r, comps] of Object.entries(s.regionComponents)) {
          const found = comps.find((c) => c.name === componentId);
          if (found) comp = found;
          newRegions[r] = comps.filter((c) => c.name !== componentId);
        }
        return { ...s, regionComponents: newRegions };
      });
      if (!comp) return state;
      sections = updateSection(sections, toSectionId, (s) => {
        const targetComps = [...(s.regionComponents[toRegion] ?? [])];
        targetComps.splice(toIndex, 0, comp!);
        return { ...s, regionComponents: { ...s.regionComponents, [toRegion]: targetComps } };
      });
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'SELECT':
      return { ...state, selectedId: action.payload };

    case 'ADD_SECTION': {
      const newSection = createSection(action.payload?.layout ?? 'fullWidth');
      const sections = [...state.sections, newSection];
      return {
        ...state,
        sections,
        activeSectionId: newSection.id,
        tree: buildTree(sections),
      };
    }

    case 'REMOVE_SECTION': {
      if (state.sections.length <= 1) return state;
      const sections = state.sections.filter((s) => s.id !== action.payload);
      const activeSectionId = state.activeSectionId === action.payload
        ? sections[0].id
        : state.activeSectionId;
      return {
        ...state,
        sections,
        activeSectionId,
        tree: buildTree(sections),
        selectedId: null,
      };
    }

    case 'SELECT_SECTION':
      return { ...state, activeSectionId: action.payload };

    case 'REORDER_SECTIONS': {
      const { fromIndex, toIndex } = action.payload;
      const sections = [...state.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { ...state, sections, tree: buildTree(sections) };
    }

    case 'SET_CONTAINER_WIDTH':
      return { ...state, containerWidth: Math.max(320, Math.min(2400, action.payload)) };

    case 'SET_TREE':
    case 'LOAD_CONFIG':
      return { ...state, tree: action.payload, selectedId: null };

    case 'LOAD_FULL': {
      const { sections: loadedSections } = action.payload;
      const sections = loadedSections.length > 0 ? loadedSections : [createSection('fullWidth')];
      return {
        ...state,
        sections,
        activeSectionId: sections[0].id,
        tree: buildTree(sections),
        selectedId: null,
      };
    }

    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  return React.createElement(EditorContext.Provider, { value: { state, dispatch } }, children);
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

function collectAllComponents(sections: LayoutSection[]): EditorComponent[] {
  const result: EditorComponent[] = [];
  function walk(nodes: EditorComponent[]) {
    for (const n of nodes) {
      result.push(n);
      if (n.child) walk(n.child);
    }
  }
  for (const section of sections) {
    for (const region of Object.values(section.regionComponents)) {
      walk(region);
    }
  }
  return result;
}

export { findInRegions, findInAllSections, getActiveSection, buildTree, collectAllComponents };
