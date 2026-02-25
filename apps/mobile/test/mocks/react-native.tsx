import React from 'react';
import { vi } from 'vitest';

function renderNode(node: React.ReactNode | (() => React.ReactNode) | null | undefined) {
  if (!node) return null;
  if (typeof node === 'function') {
    return (node as () => React.ReactNode)();
  }
  return node;
}

export const View = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const Text = ({ children, ...props }: any) => <span {...props}>{children}</span>;

export const ScrollView = ({ children, refreshControl, ...props }: any) => (
  <div {...props}>
    {renderNode(refreshControl)}
    {children}
  </div>
);

export const TouchableOpacity = ({ onPress, children, ...props }: any) => (
  <button type="button" onClick={onPress} {...props}>
    {children}
  </button>
);

export const Pressable = ({ onPress, children, ...props }: any) => (
  <button type="button" onClick={onPress} {...props}>
    {children}
  </button>
);

export const TextInput = React.forwardRef<HTMLInputElement, any>(
  ({ onChangeText, value = '', secureTextEntry: _secure, ...props }, ref) => (
    <input
      ref={ref}
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      {...props}
    />
  ),
);

export const FlatList = ({
  data = [],
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshControl,
  ...props
}: any) => (
  <div {...props}>
    {renderNode(ListHeaderComponent)}
    {renderNode(refreshControl)}
    {data.length === 0
      ? renderNode(ListEmptyComponent)
      : data.map((item: any, index: number) => (
          <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
  </div>
);

export const Modal = ({ visible, children }: any) => (visible ? <div>{children}</div> : null);

export const RefreshControl = ({ onRefresh }: { onRefresh?: () => void }) => (
  <button type="button" onClick={onRefresh} data-testid="refresh-control">
    Refresh
  </button>
);

export const Alert = {
  alert: vi.fn(),
};

export function useWindowDimensions() {
  return {
    width: 390,
    height: 844,
    scale: 2,
    fontScale: 1,
  };
}
