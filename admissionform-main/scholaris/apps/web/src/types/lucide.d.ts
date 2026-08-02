declare module 'lucide-react';

declare module '@base-ui/react/merge-props' {
  export function mergeProps<T>(...args: any[]): any;
}

declare module '@base-ui/react/use-render' {
  export namespace useRender {
    export type ComponentProps<T> = any;
  }
  export const useRender: any;
}

declare module '@base-ui/react/button' {
  export function Button(props: any): import('react').ReactElement | null;
  export namespace Button {
    export type Props = any;
  }
}

declare module '@base-ui/react/checkbox' {
  export namespace Checkbox {
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const Indicator: import('react').ComponentType<any>;
    export namespace Indicator { export type Props = any; }
  }
  export const Checkbox: import('react').ComponentType<any>;
}

declare module '@base-ui/react/input' {
  export function Input(props: any): import('react').ReactElement | null;
  export namespace Input {
    export type Props = any;
  }
}

declare module '@base-ui/react/dialog' {
  export namespace Dialog {
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const Trigger: import('react').ComponentType<any>;
    export namespace Trigger { export type Props = any; }
    export const Portal: import('react').ComponentType<any>;
    export namespace Portal { export type Props = any; }
    export const Close: import('react').ComponentType<any>;
    export namespace Close { export type Props = any; }
    export const Backdrop: import('react').ComponentType<any>;
    export namespace Backdrop { export type Props = any; }
    export const Popup: import('react').ComponentType<any>;
    export namespace Popup { export type Props = any; }
    export const Title: import('react').ComponentType<any>;
    export namespace Title { export type Props = any; }
    export const Description: import('react').ComponentType<any>;
    export namespace Description { export type Props = any; }
  }
  export const Dialog: import('react').ComponentType<any>;
}

declare module '@base-ui/react/scroll-area' {
  export namespace ScrollArea {
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const Viewport: import('react').ComponentType<any>;
    export namespace Viewport { export type Props = any; }
    export const Scrollbar: import('react').ComponentType<any>;
    export namespace Scrollbar { export type Props = any; }
    export const Thumb: import('react').ComponentType<any>;
    export namespace Thumb { export type Props = any; }
    export const Corner: import('react').ComponentType<any>;
    export namespace Corner { export type Props = any; }
  }
  export const ScrollArea: import('react').ComponentType<any>;
}

declare module '@base-ui/react/select' {
  export namespace Select {
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const Group: import('react').ComponentType<any>;
    export namespace Group { export type Props = any; }
    export const GroupLabel: import('react').ComponentType<any>;
    export namespace GroupLabel { export type Props = any; }
    export const Value: import('react').ComponentType<any>;
    export namespace Value { export type Props = any; }
    export const Trigger: import('react').ComponentType<any>;
    export namespace Trigger { export type Props = any; }
    export const Icon: import('react').ComponentType<any>;
    export namespace Icon { export type Props = any; }
    export const Portal: import('react').ComponentType<any>;
    export namespace Portal { export type Props = any; }
    export const Positioner: import('react').ComponentType<any>;
    export namespace Positioner { export type Props = any; }
    export const Popup: import('react').ComponentType<any>;
    export namespace Popup { export type Props = any; }
    export const List: import('react').ComponentType<any>;
    export namespace List { export type Props = any; }
    export const Label: import('react').ComponentType<any>;
    export namespace Label { export type Props = any; }
    export const Item: import('react').ComponentType<any>;
    export namespace Item { export type Props = any; }
    export const ItemText: import('react').ComponentType<any>;
    export namespace ItemText { export type Props = any; }
    export const ItemIndicator: import('react').ComponentType<any>;
    export namespace ItemIndicator { export type Props = any; }
    export const Separator: import('react').ComponentType<any>;
    export namespace Separator { export type Props = any; }
    export const Arrow: import('react').ComponentType<any>;
    export namespace Arrow { export type Props = any; }
    export const ScrollUpArrow: import('react').ComponentType<any>;
    export const ScrollDownArrow: import('react').ComponentType<any>;
  }
  export const Select: import('react').ComponentType<any>;
}

declare module '@base-ui/react/separator' {
  export function Separator(props: any): import('react').ReactElement | null;
  export namespace Separator {
    export type Props = any;
  }
}

declare module '@base-ui/react/tabs' {
  export namespace Tabs {
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const List: import('react').ComponentType<any>;
    export namespace List { export type Props = any; }
    export const Tab: import('react').ComponentType<any>;
    export namespace Tab { export type Props = any; }
    export const Panel: import('react').ComponentType<any>;
    export namespace Panel { export type Props = any; }
  }
  export const Tabs: import('react').ComponentType<any>;
}

declare module '@base-ui/react/toast' {
  export namespace Toast {
    export const Provider: import('react').ComponentType<any>;
    export namespace Provider { export type Props = any; }
    export const Portal: import('react').ComponentType<any>;
    export namespace Portal { export type Props = any; }
    export const Viewport: import('react').ComponentType<any>;
    export namespace Viewport { export type Props = any; }
    export const Root: import('react').ComponentType<any>;
    export namespace Root { export type Props = any; }
    export const Content: import('react').ComponentType<any>;
    export namespace Content { export type Props = any; }
    export const Title: import('react').ComponentType<any>;
    export namespace Title { export type Props = any; }
    export const Description: import('react').ComponentType<any>;
    export namespace Description { export type Props = any; }
    export const Action: import('react').ComponentType<any>;
    export namespace Action { export type Props = any; }
    export const Close: import('react').ComponentType<any>;
    export namespace Close { export type Props = any; }
    export const createToastManager: any;
    export const useToastManager: any;
  }
  export const Toast: import('react').ComponentType<any>;
}
