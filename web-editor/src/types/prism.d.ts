declare module 'prismjs' {
  export interface PrismStatic {
    highlightElement(element: Element, async?: boolean, callback?: () => void): void
    languages: Record<string, unknown>
  }
  const Prism: PrismStatic
  export default Prism
}
