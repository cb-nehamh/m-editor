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

export interface EditorState {
  layout: LayoutType;
  splitRatio: number;
  regionComponents: Record<string, EditorComponent[]>;
  selectedId: string | null;
  tree: EditorComponent[];
}

export interface SavedEditorConfig {
  layout: LayoutType;
  splitRatio: number;
  regionComponents: Record<string, EditorComponent[]>;
}

export type EditorAction =
  | { type: 'SET_LAYOUT'; payload: LayoutType }
  | { type: 'SET_SPLIT'; payload: number }
  | { type: 'ADD_COMPONENT'; payload: { parentId: string | null; region: string; component: EditorComponent } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_OPTION'; payload: { id: string; path: string; value: any } }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; newParentId: string | null; index: number } }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TREE'; payload: EditorComponent[] }
  | { type: 'LOAD_CONFIG'; payload: EditorComponent[] }
  | { type: 'LOAD_FULL'; payload: SavedEditorConfig };

const initialState: EditorState = {
  layout: 'fullWidth',
  splitRatio: 25,
  regionComponents: { main: [] },
  selectedId: null,
  tree: [],
};

function findAndUpdate(
  nodes: EditorComponent[],
  id: string,
  updater: (node: EditorComponent) => EditorComponent
): EditorComponent[] {
  return nodes.map((node) => {
    if (node.name === id) return updater(node);
    if (node.child) return { ...node, child: findAndUpdate(node.child, id, updater) };
    return node;
  });
}

function removeById(nodes: EditorComponent[], id: string): EditorComponent[] {
  return nodes
    .filter((n) => n.name !== id)
    .map((n) => (n.child ? { ...n, child: removeById(n.child, id) } : n));
}

function findById(nodes: EditorComponent[], id: string): EditorComponent | null {
  for (const n of nodes) {
    if (n.name === id) return n;
    if (n.child) {
      const found = findById(n.child, id);
      if (found) return found;
    }
  }
  return null;
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split('.');
  if (keys.length === 1) return { ...obj, [keys[0]]: value };
  return { ...obj, [keys[0]]: setNestedValue(obj[keys[0]] ?? {}, keys.slice(1).join('.'), value) };
}

function buildTree(layout: LayoutType, regionComponents: Record<string, EditorComponent[]>, splitRatio: number): EditorComponent[] {
  const layoutDef = LAYOUT_DEFS.find((l) => l.type === layout)!;
  const children: EditorComponent[] = [];
  for (const region of layoutDef.regions) {
    const comps = regionComponents[region] ?? [];
    for (const c of comps) {
      children.push({ ...c, option: { ...c.option, region } });
    }
  }
  return [{
    name: 'portal-layout',
    type: 'layout',
    option: { variant: layout, split: layout === 'sidebar' ? [splitRatio, 100 - splitRatio] : undefined },
    child: children,
  }];
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

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LAYOUT': {
      const newLayout = action.payload;
      const newDef = LAYOUT_DEFS.find((l) => l.type === newLayout)!;
      const newRegions: Record<string, EditorComponent[]> = {};
      for (const r of newDef.regions) newRegions[r] = [];

      const allComps = Object.values(state.regionComponents).flat();
      if (allComps.length > 0) {
        newRegions[newDef.regions[0]] = allComps;
      }

      return {
        ...state,
        layout: newLayout,
        regionComponents: newRegions,
        tree: buildTree(newLayout, newRegions, state.splitRatio),
      };
    }

    case 'SET_SPLIT': {
      const splitRatio = action.payload;
      return {
        ...state,
        splitRatio,
        tree: buildTree(state.layout, state.regionComponents, splitRatio),
      };
    }

    case 'ADD_COMPONENT': {
      const { region, component } = action.payload;
      const targetRegion = region || LAYOUT_DEFS.find((l) => l.type === state.layout)!.regions[0];
      const newRegions = {
        ...state.regionComponents,
        [targetRegion]: [...(state.regionComponents[targetRegion] ?? []), component],
      };
      return {
        ...state,
        regionComponents: newRegions,
        tree: buildTree(state.layout, newRegions, state.splitRatio),
      };
    }

    case 'REMOVE_COMPONENT': {
      const newRegions = removeFromRegions(state.regionComponents, action.payload);
      return {
        ...state,
        regionComponents: newRegions,
        tree: buildTree(state.layout, newRegions, state.splitRatio),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };
    }

    case 'UPDATE_OPTION': {
      const { id, path, value } = action.payload;
      const newRegions = updateInRegions(state.regionComponents, id, (node) => ({
        ...node,
        option: setNestedValue(node.option ?? {}, path, value),
      }));
      return {
        ...state,
        regionComponents: newRegions,
        tree: buildTree(state.layout, newRegions, state.splitRatio),
      };
    }

    case 'MOVE_COMPONENT': {
      return state;
    }

    case 'SELECT':
      return { ...state, selectedId: action.payload };

    case 'SET_TREE':
    case 'LOAD_CONFIG':
      return { ...state, tree: action.payload, selectedId: null };

    case 'LOAD_FULL': {
      const { layout, splitRatio, regionComponents } = action.payload;
      return {
        ...state,
        layout,
        splitRatio,
        regionComponents,
        tree: buildTree(layout, regionComponents, splitRatio),
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

export { findById, findInRegions };
