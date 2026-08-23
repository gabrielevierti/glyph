export type Gray = number;
export interface Point { x: number; y: number; }
export interface Rect { x: number; y: number; width: number; height: number; }
export interface RenderOptions {
  width?: number; height?: number; supersample?: number; background?: Gray;
}
export interface TextOptions {
  font?: string; size?: number; weight?: string | number;
  align?: CanvasTextAlign; baseline?: CanvasTextBaseline; letterSpacing?: number;
}
export interface Tile {
  id: number; name: string; rect: Rect; pixels: Uint8Array;
}
export interface TileLayout {
  width: number; height: number;
  tiles: Array<{ id: number; name: string; x: number; y: number; zOrder: number }>;
}
export interface Frame {
  width: number; height: number; pixels: Uint8Array; tiles: Tile[];
}
